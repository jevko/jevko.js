import { decodeString, textToString } from "./decode.js";
import { jevkoToString } from "./jevkoToString.js";

// Alternative name: JĄML -- Jevko All-Purpose Markup Language
//                   J4ML
//                   JML4
//                   JDaML -- Jevko Data (and) Markup Language
//                   JDAML
// JGML -- Jevko Generic Markup Language

// Data Markup Ńotation
export const parseJdaml = (str) => {
  return extractData(applyAttrs(parseElems(seedFromString(str))))
}
export const parseJdamlMarkup = (str) => {
  return applyAttrs(parseElems(seedFromString(str)))
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
    // todo: perhaps don't use '[k][v] for arbitrary keys
    //       instead, don't allow arbitrary keys/tags
    //       '[xyz]  is then an empty tag, value xyz
    //
    //       could add arbitrary keys as an extension in the next version
    //       e.g. like .<-[key][value] or .<[key]>[value]
    //       or simply .<-[[key][value]]
    //                 .[[key]=[value]]
    //                 .=[[key][value]]
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
    if (tag.slice(1).startsWith(';')) continue
    nsubs.push({tag, subs: parseElems(tree)})
  }
  // todo: only allow singular ' but not .
  if (t !== undefined) nsubs.push({tag: t, subs: []})
  if (text !== '') nsubs.push(text)
  return nsubs
}
// NOTE: most likely don't implement this, because of [rock'n'roll]
// before using this, address the [rock'n'roll] problem
// if no good solution, then I think ['143[]], etc. is fine
// ['[143]] could be a good compromise
// NB todo: handle ['[xyz]] in some way -- either error or treat as ['[xyz][]]
// todo: for things like ['seq] or ['143] or ['true]
const extractOneAndOnly = (text) => {
  const start = text.length - 1
  let i = start
  for (; i >= 0; --i) {
    const c = text[i]
    if (c === '\n' || c === '\r') {
      return [text, '']
    }
    else if (c === "'" && i < start) {
      return [text.slice(0, i), text.slice(i)]
    }
  }
  return [text, '']
}
const extractTag = (text) => {
  let i = text.length - 1
  for (; i >= 0; --i) {
    const c = text[i]
    if (c === '\n' || c === '\r') {
      return [text, '']
    }
    else if (c === '.' || c === "'") {
      return [text.slice(0, i), text.slice(i)]
    }
  }
  return [text, '']
}

// todo: finish and use this:
// validates whether tag is well-formed
const validateTag = (tag) => {
  const c1 = tag[0]
  if (".'".includes(c1) === false) throw Error('oops')
  if (tag.length === 1) return tag
  const c2 = tag[1]
  if (/[a-zA-Z$_;]/.test(c2) === false) throw Error('oops')
  if (tag.length === 2) return tag
  const last = tag.at(-1)
  // note: could allow a space (or even > 1 space) at the end which would not be counted as part of the tag -- could do that in the next version as well
  if (/[a-zA-Z$_]/.test(last) === false) throw Error('oops')
  let lastwassspace = false
  for (let i = 1; i < tag.length - 1; ++i) {
    const c = tag[i]
    if (c === ' ') {
      if (lastwassspace) throw Error('oops')
      lastwassspace = true
    }
    else if (/[a-zA-Z$_]/.test(c) === false) throw Error('oops')
    else {
      lastwassspace = false
    }
  }
  return tag
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
  // throw Error('oops')
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
      if (typeof sub === 'string') return sub
    }

    const items = convertArray(_subs)
    // if (_subs.length === 1) {
    if (items.length === 1) {
      // console.log("BBBBB", _subs)
      // const sub = _subs[0]
      // string
      // if (typeof sub === 'string') return sub
      // if (sub._tag === '') return [extractData(sub)]
      // other type: todo
      // return extractData(sub)
      return items[0]
    }
    else {
      // console.log("AAAAAA", _subs)
      // array
      return items
      // return convertArray(_subs)
    }
  }

  // object

  // disallow nonattr _subs in objects
  if (_subs.filter(s => typeof s !== 'string').length > 0) {
    console.error(_subs)
    throw Error('oops')
  }

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

const parseTagForHighlight = (tree) => {
  const {subs, text} = tree
  if (subs.length > 0) throw Error('subs.length > 0')
  return textToString(text)
}
// todo:
// export const stringifyDmń = (subs) => {
export const parseElemsForHighlight = (tree) => {
  const {subs, text: fulltext} = tree
  const nsubs = []
  let t
  for (const {text: fulltext, tree} of subs) {
    const text = textToString(fulltext)
    if (t !== undefined) {
      if (text !== '') throw Error('oops: text !== ""')
      nsubs.push({tag: t, subs: parseElemsForHighlight(tree)})
      t = undefined
      continue
    }

    const [txt, tag] = extractTag(text)
    if (txt !== '') nsubs.push(txt)
    if (tag.length === 1) {
      t = tag + parseTagForHighlight(tree)
      continue
    }
    if (tag.slice(1).startsWith(';')) {
      nsubs.push({comment: true, tag, tree})
      continue
    }
    nsubs.push({tag, subs: parseElemsForHighlight(tree)})
  }
  // todo: only allow singular ' but not .
  if (t !== undefined) nsubs.push({tag: t, subs: [], singular: true})
  const text = textToString(fulltext)
  if (text !== '') nsubs.push(text)
  return nsubs
}
export const highlightSubs = (subs, level = 0) => {
  let ret = '<span class="subs">'
  for (const sub of subs) {
    if (typeof sub === 'string') {
      ret += `<span class="text">${sub}</span>`
    }
    else if (sub.comment) {
      // todo:
      ret += `<span class="comment">${tag}[todo]</span>`
    }
    else {
      const {tag, subs, singular} = sub
      // console.log("SUB", sub)

      if (singular) {
        ret += `<span class="elem level-${level % 3}"><span class="tag">${tag[0]}<span class="bracket">[</span><span class="content">${tag.slice(1)}</span><span class="bracket">]</span></span></span>`
      }
      else {
        console.log('ttt', tag, sub)
        const t = tag === ''? '': `<span class="tag">${tag[0]}<span class="content">${tag.slice(1)}</span></span>`

        if (tag.startsWith('.')) {
          ret += `<span class="attr level-${level % 3}">${t}<span class="bracket">[</span>${highlightSubs(subs, level + 1)}<span class="bracket">]</span></span>`
        }
        else {
          ret += `<span class="elem level-${level % 3}">${t}<span class="bracket">[</span>${highlightSubs(subs, level + 1)}<span class="bracket">]</span></span>`
        }
      }
    }
  }
  return ret + '</span>'
}


export const seedFromStringForHighlight = (str) => {
  let current = {subs: [], text: undefined}
  const parents = [current]
  return decodeString(str, {
    prefix: (text) => {
      const tree = {subs: [], text: undefined}
      current.subs.push({text, tree})
      parents.push(current)
      current = tree
    },
    suffix: (text) => {
      current.text = text
      current = parents.pop()
    },
    end: () => {
      return current
    }
  })
}

export const highlightJdaml = (str) => {
  return highlightSubs(parseElemsForHighlight(seedFromStringForHighlight(str)))
}