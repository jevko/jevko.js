import { normalizeDelimiters } from "./delimiters.js"

export const jevkoFromString = (str, delimiters) => {
  const {opener, closer, escaper, quoter} = normalizeDelimiters(delimiters)

  const parents = []
  let parent = {subjevkos: []}, prefix = '', h = 0, mode = 'normal'
  let line = 1, column = 1
  let tag = '', t = 0
  for (let i = 0; i < str.length; ++i) {
    const c = str[i]

    if (mode === 'escaped') {
      if (c === escaper || c === opener || c === closer) mode = 'normal'
      else if (c === quoter) {
        mode = 'tag'
        t = i + 1
      } else throw SyntaxError(`Invalid digraph (${escaper}${c}) at ${line}:${column}!`)
    } else if (mode === 'tag') {
      if (c === quoter) {
        tag = str.slice(t, i)
        h = i + 1
        t = h
        mode = 'heredoc'
      }
    } else if (mode === 'heredoc') {
      if (c === quoter) {
        const found = str.slice(h, i)
        if (found === tag) {
          const jevko = {
            subjevkos: [], 
            suffix: str.slice(t, h - 1),
            tag
          }
          parent.subjevkos.push({prefix, jevko})
          prefix = ''
          h = i + 1
          tag = ''
          mode = 'normal'
        } else {
          h = i + 1
        }
      }
    } else /*if (mode === 'normal')*/ if (c === escaper) {
      prefix += str.slice(h, i)
      h = i + 1
      mode = 'escaped'
    } else if (c === opener) {
      const jevko = {subjevkos: []}
      parent.subjevkos.push({prefix: prefix + str.slice(h, i), jevko})
      prefix = ''
      h = i + 1
      parents.push(parent)
      parent = jevko
    } else if (c === closer) {
      parent.suffix = prefix + str.slice(h, i)
      prefix = ''
      h = i + 1
      if (parents.length < 1) throw SyntaxError(`Unexpected closer (${closer}) at ${line}:${column}!`)
      parent = parents.pop()
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
  if (mode === 'tag') throw SyntaxError(`Unexpected end after quoter (${quoter})!`)
  if (mode === 'heredoc') throw SyntaxError(`Unexpected end after quoter (${quoter})!`)
  if (parents.length > 0) throw SyntaxError(`Unexpected end: missing ${parents.length} closer(s) (${closer})!`)
  parent.suffix = prefix + str.slice(h)
  parent.opener = opener
  parent.closer = closer
  parent.escaper = escaper
  parent.quoter = quoter
  return parent
}