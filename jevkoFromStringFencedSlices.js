import { normalizeDelimiters } from "./delimiters.js"

// a version which does multistrings similarly to djevko
// but in the most minimal way that does not know anything about whitespace
// however it can easily be extended to support space and other djevko/djedat features
export const jevkoFromString = (str, delimiters) => {
  const {opener, closer, escaper, quoter} = normalizeDelimiters(delimiters)

  const parents = []
  let parent = {subjevkos: []}, escapers = [], startindex = 0, mode = 'init', fencelen = 0, mfencelen = 0, afterquoterindex = 0, afterquoter = false
  let line = 1, column = 1

  const open = (i) => {
    const jevko = {subjevkos: []}
    const subjevko = {
      prefix: {startindex, length: i - startindex, escapers},
      jevko,
    }
    parent.subjevkos.push(subjevko)
    escapers = []
    startindex = i + 1
    mode = 'init'
    parents.push(parent)
    parent = jevko
    return subjevko
  }

  const close = (i) => {
    parent.suffix = {startindex, length: i - startindex, escapers}
    escapers = []
    startindex = i + 1
    mode = 'init'
    if (parents.length < 1) throw SyntaxError(`Unexpected closer (${closer}) at ${line}:${column}!`)
    parent = parents.pop()
  }

  // note: iterating thru code units rather than code points
  // this is effectively correct as long as each delimiter fits within one code unit
  // todo: perhaps enforce?
  for (let i = 0; i < str.length; ++i) {
    const c = str[i]

    if (mode === 'init') {
      if (c === escaper) fencelen += 1
      else if (c === quoter) {
        if (fencelen % 2 === 1) {
          mode = 'fenced'
          startindex = i + 1
          afterquoterindex = i + 1
        }
        else {
          fencelen = 0
          for (let j = startindex; j < i; j += 2) {
            escapers.push(j)
          }
          mode = 'normal'
        }
      }
      else {
        if (fencelen % 2 === 1) {
          if (c === escaper || c === opener || c === closer) mode = 'normal'
          else throw SyntaxError(`Invalid digraph (${escaper}${c}) at ${line}:${column}!`)

          fencelen = 0
          for (let j = startindex; j < i; j += 2) {
            escapers.push(j)
          }
        } else {
          fencelen = 0
          for (let j = startindex; j < i; j += 2) {
            escapers.push(j)
          }
          if (c === opener) open(i)
          else if (c === closer) close(i)
          else mode = 'normal'
        }
      }
    }
    else if (mode === 'escaped') {
      if (c === escaper || c === opener || c === closer) mode = 'normal'
      else throw SyntaxError(`Invalid digraph (${escaper}${c}) at ${line}:${column}!`)
    } 
    else if (mode === 'fenced') {
      if (c === quoter) {
        afterquoterindex = i + 1
        mfencelen = 0
        afterquoter = true
      } 
      else if (afterquoter) {
        if (c === escaper) {
          mfencelen += 1
        }
        else {
          if (c === opener) {
            if (fencelen === mfencelen) {
              const sub = open(afterquoterindex - 1)
              // note: save fence + fence info in subjevko
              sub.fencelen = fencelen
              fencelen = 0
            }
          } 
          else if (c === closer) {
            if (fencelen === mfencelen) {
              // note: save fence + fence info in jevko
              parent.fencelen = fencelen
              close(afterquoterindex - 1)
              fencelen = 0
            }
          }
          afterquoter = false
          mfencelen = 0
        }
      }
    }
    else if (mode === 'normal')
      if (c === escaper) {
        escapers.push(i)
        mode = 'escaped'
      } 
      else if (c === opener) open(i)
      else if (c === closer) close(i)

    if (c === '\n') {
      ++line
      column = 1
    } else {
      ++column
    }
  }
  // todo: better error msgs
  if (mode === 'init') {
    if (fencelen % 2 === 1) {
      // note the ;
      if (c === escaper || c === opener || c === closer) ;
      else throw SyntaxError(`Invalid digraph (${escaper}${c}) at ${line}:${column}!`)
    }
    for (let j = startindex; j < str.length; j += 2) {
      escapers.push(j)
    }
    parent.suffix = {startindex, length: str.length - startindex, escapers}
  }
  else if (mode === 'escaped') throw SyntaxError(`Unexpected end after escaper (${escaper})!`)
  else if (mode === 'fenced') {
    if (fencelen === mfencelen) {
      parent.suffix = {startindex, length: (afterquoterindex - 1) - startindex, escapers}
      parent.fencelen = fencelen
    } else {
      throw SyntaxError(`Unexpected end before fenced text closed!\nExpected: ${fence}\nFound: ${found}`)
    }
  }
  else /*if (mode === 'normal')*/ {
    parent.suffix = {startindex, length: str.length - startindex, escapers}
  }
  if (parents.length > 0) throw SyntaxError(`Unexpected end: missing ${parents.length} closer(s) (${closer})!`)
  parent.opener = opener
  parent.closer = closer
  parent.escaper = escaper
  // todo: maybe quoter should be fencer?
  parent.quoter = quoter
  parent.source = str
  return parent
}

const transformslice = (slice, source) => {
  let np = ''
  const {startindex, length} = slice
  let t = startindex
  for (const ei of slice.escapers) {
    np += source.slice(t, ei)
    t = ei + 1
  }
  np += source.slice(t, startindex + length)
  return np
}

const transform1 = (jevko, source) => {
  const subjevkos = []
  for (const {prefix, jevko: j} of jevko.subjevkos) {
    subjevkos.push({prefix: transformslice(prefix, source), jevko: transform1(j, source)})
  }
  return {subjevkos, suffix: transformslice(jevko.suffix, source)}
}

export const transform = (jevko) => {
  return transform1(jevko, jevko.source)
}