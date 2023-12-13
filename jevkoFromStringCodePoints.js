import { normalizeDelimiters } from "./delimiters.js"

// a version of jevkoFromString which iterates over code points rather than code units and uses buffering into strings (character by character concatenation) instead of slicing to build up prefixes, suffixes, heredocs
export const jevkoFromString = (str, delimiters) => {
  const {opener, closer, escaper, quoter} = normalizeDelimiters(delimiters)

  const parents = []
  let parent = {subjevkos: [], suffix: ''}
  let text = ''
  let mode = 'normal'
  let line = 1, column = 1
  let tag = '', heredoc = '', fragment = ''
  let sawFirstQuoter = false
  for (const c of str) {
    if (mode === 'escaped') {
      if (c === escaper || c === opener || c === closer) {
        mode = 'normal'
        text += c
      } else if (c === quoter) {
        mode = 'tag'
      } else throw SyntaxError(`Invalid digraph (${escaper}${c}) at ${line}:${column}!`)
    } else if (mode === 'tag') {
      if (c === quoter) {
        mode = 'heredoc'
      } else {
        tag += c
      }
    } else if (mode === 'heredoc') {
      if (c === quoter) {
        if (sawFirstQuoter === false) {
          sawFirstQuoter = true
          heredoc += fragment
          fragment = ''
        } else {
          if (fragment === tag) {
            const jevko = {
              subjevkos: [], 
              suffix: heredoc,
              tag
            }
            parent.subjevkos.push({prefix: text, jevko})
            text = ''
            tag = ''
            fragment = ''
            heredoc = ''
            mode = 'normal'
            sawFirstQuoter = false
          } else {
            heredoc += c + fragment
            fragment = ''
          }
        }
      } else {
        fragment += c
      }
    } else /*if (mode === 'normal')*/ if (c === escaper) {
      mode = 'escaped'
    } else if (c === opener) {
      const jevko = {subjevkos: []}
      parent.subjevkos.push({prefix: text, jevko})
      text = ''
      parents.push(parent)
      parent = jevko
    } else if (c === closer) {
      parent.suffix = text
      text = ''
      if (parents.length < 1) throw SyntaxError(`Unexpected closer (${closer}) at ${line}:${column}!`)
      parent = parents.pop()
    } else {
      text += c
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
  if (mode === 'heredoc' || mode === 'heredoc0') throw SyntaxError(`Unexpected end after quoter (${quoter})!`)
  if (parents.length > 0) throw SyntaxError(`Unexpected end: missing ${parents.length} closer(s) (${closer})!`)
  parent.suffix = text
  parent.opener = opener
  parent.closer = closer
  parent.escaper = escaper
  parent.quoter = quoter
  return parent
}