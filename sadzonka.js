import { defaultDelimiters } from "./delimiters.js";
import { parseRoot, textToString } from "./parse.js";

export const parseSadzonka = (str) => {
  return toval(preproc(seedFromString(str)))
}

export const seedFromString = (str) => {
  let current = {subs: [], text: ''}
  const parents = [current]
  return parseRoot(str, {
    prefix: (text) => {
      const tree = {subs: [], text: ''}
      current.subs.push({text: textToString(text), tree})
      parents.push(current)
      current = tree
    },
    suffix: (text) => {
      current.text = textToString(text)
      current = parents.pop()
    },
    end: () => {
      return current
    }
  })
}

export const preproc = (tree) => {
  const {subs, text} = tree
  const nsubs = []
  let escaped
  for (const {text, tree} of subs) {
    let tx
    if (escaped === undefined) {
      tx = text.split('\n').at(-1).trim()
      if (tx.startsWith(';')) continue
      else if (tx === '\\') {
        escaped = unescape(tree)
        continue
      } 
    } else {
      if (text.trim() !== '') throw SyntaxError(
        `Unexpected text after escaped prefix: |${text}|`
      )
      tx = escaped
      escaped = undefined
    }
    nsubs.push({text: tx, tree: preproc(tree)})
  }
  if (nsubs.length > 0) {
    if (escaped !== undefined) throw SyntaxError(
      `Unexpected escaped text after subs: |${text}|`
    )
    // note: ignoring original text
    return {subs: nsubs, text: ''}
  }
  if (escaped !== undefined) {
    // note: could also allow text after escaped suffix (would be ignored)
    if (text.trim() !== '') throw SyntaxError(
      `Unexpected text after escaped suffix: |${text}|`
    )
    return {subs: [], text: escaped}
  }
  // note: could alternatively do text.split('\n').at(-1).trim()
  return {subs: [], text}
}

export const toval = (tree) => {
  const {subs} = tree
  if (subs.length === 0) return tree.text
  if (subs[0].text === '') {
    // to array
    const ret = []
    for (const {text, tree} of subs) {
      if (text !== '') throw TypeError(`Unexpected text in array: |${text}|`)
      ret.push(toval(tree))
    }
    return ret
  }
  // to object
  const ret = {}
  for (const {text, tree} of subs) {
    if (Object.hasOwn(ret, text)) throw TypeError(`Duplicate key: |${text}|`)
    ret[text] = toval(tree)
  }
  return ret
}

// todo? normalizedelimiters?
export const unescape = (tree, {opener, closer, escaper} = defaultDelimiters) => {
  let ret = ''
  const {subs, text} = tree
  for (const {text, tree} of subs) {
    ret += text
    if (tree.subs.length > 0) throw SyntaxError(`Unexpected nesting in escape!`)
    const {text: t} = tree
    if (t === '{') ret += opener
    else if (t === '}') ret += closer
    else if (t === '~') ret += escaper
    else throw SyntaxError(`Unexpected escape: |${t}|`)
  }
  return ret + text
}

export const stringifySadzonka = (val) => {
  if (val === null) throw TypeError(`Unexpected null`)
  if (typeof val === 'string') return escape(val)
  if (Array.isArray(val)) {
    let ret = ''
    for (const it of val) {
      ret += `[${stringifySadzonka(it)}]`
    }
    return ret
  }
  if (typeof val === 'object') {
    let ret = ''
    for (const [k, v] of Object.entries(val)) {
      ret += `${escape(k)}[${stringifySadzonka(v)}]`
    }
    return ret
  }
  throw TypeError(`Unsupported type: ${typeof val}`)
}

const escape = (str) => {
  let h = 0
  const parts = []

  if (str === '\\') return '\\[\\]'

  for (let i = 0; i < str.length; ++i) {
    const c = str[i]
    if (c === '[') {
      parts.push(str.slice(h, i), '[{]')
      h = i + 1
    }
    else if (c === ']') {
      parts.push(str.slice(h, i), '[}]')
      h = i + 1
    }
    else if (c === '`') {
      parts.push(str.slice(h, i), '[~]')
      h = i + 1
    }
  }
  const tail = str.slice(h)
  if (parts.length > 0) return `\\[${parts.join('')}${tail}]`
  return tail
}

export const stringifytree = (tree) => {
  let ret = ''
  const {subs, text} = tree
  for (const {text, tree} of subs) {
    ret += escape(text) + '[' + stringifytree(tree) + ']'
  }
  return ret + escape(text)
}