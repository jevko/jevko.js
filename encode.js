import { normalizeDelimiters, defaultDelimiters } from "./delimiters.js"

// todo: tests for all this
// todo: maybe a makeEncdec
export const makeEncoders = (delims, ...rest) => {
  const delimiters = normalizeDelimiters(delims)
  return _makeEncoders(delimiters, ...rest)
}

// assumes delimiters are normalized
export const _makeEncoders = (delimiters, fencelengthlimit = 15) => {
  const {fencer, escaper, opener, closer} = delimiters

  const escape = (str) => {
    let ret = ''
    let j = 0
    for (let i = 0; i < str.length; ++i) {
      const c = str[i]
      if (c === opener || c === closer || c === escaper) {
        ret += str.slice(j, i) + escaper
        j = i
      }
    }
    return ret + str.slice(j)
  }
  
  /**
   * Assumes delimiters are normalized
   * Trusts that fencelength is correct
   */
  const fence = (str, fencelength) => {
    const fence = Array.from({length: fencelength}).fill(escaper).join('')

    return `${fence}${fencer}${str}${fencer}${fence}`
  }

  const needsEscaping = (str) => {
    for (let i = 0; i < str.length; ++i) {
      const c = str[i]
      if (c === opener || c === closer || c === escaper) {
        return true
      }
    }
    return false
  }

  // 
  const smartEscape = (str) => {
    if (needsEscaping(str) === false) return str
    let fence = escaper
    const ee = escaper + escaper
    while (str.indexOf(fencer + fence) !== -1) {
      if (fence.length >= fencelengthlimit) return escape(str)
      fence += ee
    }
    return `${fence}${fencer}${str}${fencer}${fence}`
  }

  // todo: benchmark and test smartEscape, smartEscape1, smartEscape2 and pick the best one; probably smartEscape2
  // does only one pass thru the string
  const smartEscape1 = (str) => {
    let needsescaping = false
    let fencestartindex = -1
    let maxfenlen = 0
    for (let i = 0; i < str.length; ++i) {
      const c = str[i]
      if (needsescaping === false) {
        if (c === opener || c === closer || c === escaper) {
          needsescaping = true
        }
      }
      if (fencestartindex === -1) {
        if (c === fencer) {
          fencestartindex = i + 1
        }
      }
      else if (c !== escaper) {
        const currfenlen = i - fencestartindex
        if (currfenlen > maxfenlen) maxfenlen = currfenlen
        fencestartindex = -1
      }
    }
    if (needsescaping === false) return str
    const fencelength = maxfenlen + 1
    if (fencelength >= fencelengthlimit) return escape(str)
    return fence(str, fencelength)
  }
  // does at most 2 passes over the str
  const smartEscape2 = (str) => {
    if (needsEscaping(str) === false) return str
    let conflictfencestartindex = -1
    let maxfenlen = 0
    for (let i = 0; i < str.length; ++i) {
      const c = str[i]
      if (conflictfencestartindex === -1) {
        if (c === fencer) {
          conflictfencestartindex = i + 1
        }
      }
      else if (c !== escaper) {
        const currfenlen = i - conflictfencestartindex
        if (currfenlen > maxfenlen) maxfenlen = currfenlen
        conflictfencestartindex = -1
      }
    }
    const fencelength = maxfenlen + 1
    if (fencelength >= fencelengthlimit) return escape(str)
    return fence(str, fencelength)
  }

  return {escape, fence, smartEscape}
}

export const {escape, fence, smartEscape} = _makeEncoders(defaultDelimiters)