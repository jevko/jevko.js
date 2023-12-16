// todo: simplify
import { normalizeDelimiters } from "./delimiters.js";

const advance = (str, state) => {
  const c = str[state.index]
  const pc = state.pc
  if (c === '\r' || (pc !== '\r' && c === '\n')) {
    state.line += 1
    state.column = 1
  }
  else {
    state.column += 1
  }
  state.pc = c
  state.index += 1
}
const locationstr = (state) => {
  return `${state.line}:${state.column}`
}
const location = (state) => {
  const {index, line, column} = state
  return {index, line, column}
}

export const makeDecoders = (delimiters, ...rest) => {
  return _makeDecoders(normalizeDelimiters(delimiters), ...rest)
}

// note: the parser is iterating thru code units rather than code points
// this is effectively correct as long as each delimiter fits within one code unit
// todo: enforce delimiters within one code unit
// assumes delimiters are normalized
export const _makeDecoders = (delimiters) => {
  const {opener, closer, escaper, fencer} = delimiters

  // todo: max depth
  const parseRoot = (str, next) => {
    const state = {index: 0, line: 1, column: 1}
    parseTree(str, state, next)
    if (state.index !== str.length)    throw SyntaxError(
      `Expected end of input but got ${str[state.index]} at ${locationstr(state)}!`
    )
    return next.end()
  }

  const parseTree = (str, state, next) => {
    for (;;) {
      const text = parseText(str, state)
      if (str[state.index] === closer || state.index === str.length) {
        return next.suffix(text)
      }
      else {
        next.prefix(text)
      }
      parseSubtree(str, state, next)
    }
  }
  const parseSubtree = (str, state, next) => {
    if (str[state.index] !== opener)   throw SyntaxError(
      `Expected ${opener} but got ${str[state.index]} at ${locationstr(state)}!`
    )
    advance(str, state)
    parseTree(str, state, next)
    if (state.index === str.length)    throw SyntaxError(
      `Expected ${closer} but got end of input!`
    )
    if (str[state.index] !== closer)   throw SyntaxError(
      `Expected ${closer} but got ${str[state.index]} at ${locationstr(state)}!`
    )
    advance(str, state)
    return
  }
  const parseText = (str, state) => {
    const from = location(state)
    let c = str[state.index]
    let digraphs
    if (c === escaper) {
      const {digraphs: ds, text} = parseFence(str, state)
      if (ds === undefined) return text
      digraphs = ds
    }
    else digraphs = []
    let thru = from
    for (
      ; 
      state.index < str.length; 
      thru = location(state), advance(str, state)
    ) {
      c = str[state.index]
      if (c === opener || c === closer) {
        return {
          source: str,
          from,
          thru,
          til: location(state),
          digraphs,
        }
      }
      else if (c === escaper) {
        digraphs.push(parseDigraph(str, state))
      }
    }
    return {
      source: str,
      from,
      thru,
      til: location(state),
      digraphs, 
    }
  }
  const parseDigraph = (str, state) => {
    const from = location(state)
    advance(str, state)
    if (state.index === str.length) throw SyntaxError(
      `Expected ${opener} or ${closer} or ${escaper} after ${
        escaper
      } but got end of input!`
    )
    const c = str[state.index]
    if ([opener, closer, escaper].includes(c)) return {
      from,
      thru: location(state),
    }
    throw SyntaxError(
      `Expected ${opener} or ${closer} or ${escaper} after ${
        escaper
      } but got ${c} at ${locationstr(state)}!`
    )
  }

  const parseFence = (str, state) => {
    const startindex = state.index
    // save first potential digraph 'from' location
    const locations = [location(state)]
    // skip escaper
    advance(str, state)
    // save first potential digraph 'to' location
    locations.push(location(state))
    for (
      ; 
      state.index < str.length; 
      advance(str, state), locations.push(location(state))
    ) {
      const c = str[state.index]
      if (c !== escaper) {
        if (c === fencer) {
          const fencelen = state.index - startindex
          if (fencelen % 2 === 0) {
            // digraphs + inactive fencer
            // skip inactive fencer
            advance(str, state)
            return {digraphs: locationsToDigraphs(locations)}
          }
          else {
            // skip fencer
            advance(str, state)
            // fenced text
            return parseFenced(str, state, fencelen, locations[0])
          }
        }
        else if (c === opener || c === closer) {
          const fencelen = state.index - startindex
          if (fencelen % 2 === 1) {
            // digraphs + escaper + c
            // skip c
            advance(str, state)
          }
          return {digraphs: locationsToDigraphs(locations)}
        }
        else {
          const fencelen = state.index - startindex
          if (fencelen % 2 === 0) {
            // digraphs + c
            advance(str, state)
            return {digraphs: locationsToDigraphs(locations)}
          }
          else {
            throw SyntaxError(
              `Expected ${opener} or ${closer} or ${escaper} after ${
                escaper
              } but got ${c} at ${locationstr(state)}!`
            )
          }
        }
      }
    }
    const fencelen = state.index - startindex
    if (fencelen % 2 === 0) {
      // digraphs
      return {digraphs: locationsToDigraphs(locations)}
    }
    else {
      throw SyntaxError(
        `Expected ${opener} or ${closer} or ${escaper} after ${
          escaper
        } but got end of input!`
      )
    }
  }
  // note: this could go outside of _makeDelimiters
  const locationsToDigraphs = (locations) => {
    const digraphs = []
    for (let i = 0; i < locations.length - 1; i += 2) {
      digraphs.push({from: locations[i], thru: locations[i + 1]})
    }
    return digraphs
  }

  const parseFenced = (str, state, fencelen, fencedfrom) => {
    const from = location(state)
    // more like othersideofthefencestartindex / othersidestartindex / mstartindex
    let endindex = -1
    let thru
    let prev
    let til
    for (
      ; 
      state.index < str.length; 
      prev = location(state), advance(str, state)
    ) {
      const c = str[state.index]
      if (c === fencer) {
        endindex = state.index + 1
        thru = prev
        til = location(state)
      }
      else if (endindex !== -1 && c !== escaper) {
        const mfenlen = state.index - endindex
        if (c === opener && fencelen === mfenlen) {
          const text = {
            source: str,
            fencelength: fencelen,
            from: fencedfrom,
            thru: prev,
            til: location(state),
            content: {
              from,
              thru,
              til,
            },
          }
          return {text}
        }
        else if (c === closer && fencelen === mfenlen) {
          const text = {
            source: str,
            fencelength: fencelen,
            from: fencedfrom,
            thru: prev,
            til: location(state),
            content: {
              from,
              thru,
              til,
            },
          }
          return {text}
        }
        endindex = -1
        // console.log('---', c, str)
      }
    }
    if (endindex !== -1 && fencelen === str.length - endindex) {
      const text = {
        source: str,
        fencelength: fencelen,
        from: fencedfrom,
        thru: prev,
        til: location(state),
        content: {
          from,
          thru,
          til,
        },
      }
      return {text}
    }
    // console.error('>>>', endindex, fencelen, str.length - endindex, str)
    throw SyntaxError(`Expected fenced text to be closed but got end of input! Text started at ${locationstr(fencedfrom)}.`)
  }

  return parseRoot
}

// todo: naming
// todo: use _makeDecoders(defaultDelimiters)
export const parseRoot = makeDecoders()

// note: caches the result in text, so subsequent calls will just return that
export const textToString = (text) => {
  if (text.stringified) return text.stringified
  if (text.digraphs === undefined) {
    const {content, source} = text
    const stringified = source.slice(content.from.index, content.til.index)
    text.stringified = stringified
    return stringified
  }
  const {source, from} = text
  const {index} = from
  let i = index
  let ret = ''
  for (const e of text.digraphs) {
    const {index} = e.from
    ret += source.slice(i, index)
    i = index + 1
  }
  const stringified = ret + source.slice(i, text.til.index)
  text.stringified = stringified
  return stringified
}