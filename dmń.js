import { decodeString, textToString } from "./decode.js";

// Data Markup Ńotation
export const parseDmń = (str) => {
  return extractData(applyAttrs(parseElems(seedFromString(str))))
}

export const seedFromString = (str) => {
  let current = {subs: [], text: ''}
  const parents = [current]
  return decodeString(str, {
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

export const parseElems = (tree) => {
  const {subs, text} = tree
  const nsubs = []
  let t
  for (const {text, tree} of subs) {
    if (t !== undefined) {
      if (text !== '') throw Error('oops: text !== ""')
      nsubs.push({tag: t, subs: parseElems(tree)})
      t = undefined
      continue
    }

    const [txt, tag] = extractTag(text)
    if (txt !== '') nsubs.push(txt)
    if (tag.length === 1) {
      t = tag + parseTag(tree)
      continue
    }
    if (tag.startsWith(';')) continue
    nsubs.push({tag, subs: parseElems(tree)})
  }
  if (text !== '') nsubs.push(text)
  return nsubs
}

const extractTag = (text) => {
  let i = text.length - 1
  for (; i >= 0; --i) {
    const c = text[i]
    if (c === '\n' || c === '\r') {
      return [text, '']
    }
    else if (c === '.' || c === '#') {
      return [text.slice(0, i), text.slice(i)]
    }
  }
  return [text, '']
}

const parseTag = (tree) => {
  const {subs, text} = tree
  if (subs.length > 0) throw Error('subs.length > 0')
  return text
}

const applyAttrs = (subs, parent = {_tag: ''}) => {
  const nsubs = []
  for (const sub of subs) {
    if (typeof sub === 'string') {
      nsubs.push(sub)
      continue
    }
    const {tag, subs} = sub

    if (tag.startsWith('.')) {
      let t2 = tag.slice(1)
      if (t2.startsWith('_')) t2 = '_' + t2
      if (Object.hasOwn(parent, t2)) throw Error('dupe')
      parent[t2] = applyAttrs(subs)
    }
    else {
      const nsub = applyAttrs(subs)
      nsub._tag = tag.slice(1)
      nsubs.push(nsub)
    }
  }
  parent._subs = nsubs
  return parent
}
const parsers = {
  nil: ({_subs, _tag, ...rest}) => {
    if (_subs.length !== 0 || Object.entries(rest).length !== 0) throw Error('oops')
    return null
  },
  bool: ({_subs, _tag, ...rest}) => {
    if (_subs.length !== 1 || Object.entries(rest).length !== 0) {
      throw Error('oops')
    }
    const sub = _subs[0]
    if (typeof sub !== 'string') throw Error('oops')
    if (sub === 'true') return true
    if (sub === 'false') return false
    throw Error('oops')
  },
  u64: ({_subs, _tag, ...rest}) => {
    if (_subs.length !== 1 || Object.entries(rest).length !== 0) throw Error('oops')
    const sub = _subs[0]
    if (typeof sub !== 'string') throw Error('oops')
    // todo: error check, etc.
    // actually should use a standard number parser
    return Number(sub)
  },
  seq: ({_subs, _tag, ...rest}) => {
    if (Object.entries(rest).length !== 0) throw Error('oops')
    return convertArray(_subs)
  },
  json: ({_subs, _tag, ...rest}) => {
    if (_subs.length !== 1 || Object.entries(rest).length !== 0) {
      throw Error('oops')
    }
    const sub = _subs[0]
    if (typeof sub !== 'string') throw Error('oops')
    return JSON.parse(sub)
  },
}
const defaultParser = (parent) => {
  return parent
}
const extractData = (parent) => {
  const {_tag, _subs, ...rest} = parent

  // tagged type
  if (_tag !== '') {
    const parser = parsers[_tag] ?? defaultParser
    // todo: blow up here/delegate to user-defined handler
    return parser(parent)
  }

  // console.log(parent, rest)

  const entries = Object.entries(rest)

  if (entries.length === 0) {
    if (_subs.length === 1) {
      const sub = _subs[0]
      // string
      if (typeof sub === 'string') return sub
      // other type: todo
      return extractData(sub)
    }
    else {
      // array
      return convertArray(_subs)
    }
  }

  // object
  const ret = {}
  for (let [key, value] of entries) {
    if (key.startsWith('__')) key = key.slice(1)
    ret[key] = extractData(value)
  }
  return ret
}
const convertArray = (subs) => {
  const ret = []
  for (const sub of subs) {
    if (typeof sub === 'string') continue
    ret.push(extractData(sub))
  }
  return ret
}

// todo:
// export const stringifyDmń = (subs) => {
