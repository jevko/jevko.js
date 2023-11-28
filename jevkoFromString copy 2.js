import { normalizeDelimiters } from "./delimiters.js"

// a version which does multistrings similarly to djevko
export const jevkoFromString = (str, delimiters) => {
  const {opener, closer, escaper, quoter} = normalizeDelimiters(delimiters)

  const parents = []
  let parent = {subjevkos: []}, buffer = '', h = 0, mode = 'normal'
  let line = 1, column = 1
  let tag = '', t = 0

  // todo: save tag + tag info in jevko
  const open = (prefix, i, tag) => {
    const jevko = {subjevkos: []}
    parent.subjevkos.push({prefix, tag, jevko})
    buffer = ''
    h = i + 1
    parents.push(parent)
    parent = jevko
  }

  // todo: save tag + tag info in jevko
  const close = (suffix, i, tag) => {
    parent.suffix = suffix
    parent.tag = tag
    buffer = ''
    h = i + 1
    if (parents.length < 1) throw SyntaxError(`Unexpected closer (${closer}) at ${line}:${column}!`)
    parent = parents.pop()
  }

  // note: checks tag from index 1, assuming tag[0] is always escaper
  const checkTag = (tag) => {
    let t = ''
    let j = 0
    let invalid = false
    for (let i = 1; i < tag.length; ++i) {
      const c = tag[i]
      if ([opener, closer].includes(c)) {
        invalid = true
        t += tag.slice(j, i) + escaper
        j = i
      }
    }
    t += tag.slice(j)
    if (invalid) {
      throw SyntaxError(
        `Heredoc tag must not include ${opener} or ${closer}! The tag was: ${t}`
      )
    }
  }

  // note: iterating thru code units rather than code points
  // this is effectively correct as long as each delimiter fits within one code unit
  // todo: perhaps enforce?
  for (let i = 0; i < str.length; ++i) {
    const c = str[i]

    if (mode === 'escaped') {
      if (c === escaper || c === opener || c === closer) mode = 'normal'
      else if (c === quoter) {
        // note: trimming
        // note: prepending escaper for symmetry
        // note: doubling escapers for symmetry
        tag = escaper + 
          (buffer + str.slice(h, i))
            .trimStart()
            .replaceAll(escaper, escaper + escaper)
        // note: disallow []
        checkTag(tag)
        mode = 'heredoc'
        h = i + 1
        t = i + 1
      } else throw SyntaxError(`Invalid digraph (${escaper}${c}) at ${line}:${column}!`)
    } else if (mode === 'heredoc') {
      if (c === quoter) {
        t = i + 1
      } else if (c === opener) {
        // note: trimming
        const found = str.slice(t, i).trimEnd()
        if (found === tag) {
          // todo: save tag + tag info in jevko
          open(str.slice(h, t - 1), i)
          mode = 'normal'
        } // else t = i + 1
      } else if (c === closer) {
        const found = str.slice(t, i).trimEnd()
        if (found === tag) {
          // todo: save tag + tag info in jevko
          close(str.slice(h, t - 1), i)
          mode = 'normal'
        } // else t = i + 1
      }
    } else /*if (mode === 'normal')*/ if (c === escaper) {
      buffer += str.slice(h, i)
      h = i + 1
      mode = 'escaped'
    } else if (c === opener) {
      open(buffer + str.slice(h, i), i)
    } else if (c === closer) {
      close(buffer + str.slice(h, i), i)
    }

    if (c === '\n') {
      ++line
      column = 1
    } else {
      ++column
    }
  }
  // todo: better error msgs
  if (mode === 'escaped') throw SyntaxError(`Unexpected end after escaper (${escaper})!`)
  else if (mode === 'heredoc') {
    const found = str.slice(t).trimEnd()
    if (found === tag) {
      parent.suffix = str.slice(h, t - 1)
    } else {
      throw SyntaxError(`Unexpected end before heredoc closed! Expected tag: [${tag.slice(1)}], found: [${found}].`)
    }
  }
  else /*if (mode === 'normal')*/ {
    parent.suffix = buffer + str.slice(h)
  }
  if (parents.length > 0) throw SyntaxError(`Unexpected end: missing ${parents.length} closer(s) (${closer})!`)
  parent.opener = opener
  parent.closer = closer
  parent.escaper = escaper
  parent.quoter = quoter
  return parent
}
