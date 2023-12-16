import {defaultOpener, defaultCloser, defaultEscaper} from './delimiters.js'

// todo: remove; this is now part of encoders
export const escape = (str, {
  opener = defaultOpener,
  closer = defaultCloser,
  escaper = defaultEscaper,
} = {}) => {
  let ret = ''
  for (const c of str) {
    if (c === opener || c === closer || c === escaper) ret += escaper
    ret += c
  }
  return ret
}