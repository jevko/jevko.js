import {jevkoFromString} from './jevkoFromString copy 2.js'

import {assert, assertEquals} from './devDeps.js'

const parsed = jevkoFromString(`Name [Horse]

Conservation status [Domesticated]
Scientific classification [
  \`[Kingdom\`] [Animalia]
  Phylum [Chordata]
  Class [Mammalia]
  Order [Perissodactyla]
  Family [Equidae]
  Genus [Equus]
  Species [E. ferus]
  Subspecies [E. f. caballus]
]
Trinomial name [
  [Equus ferus caballus]
  [Linnaeus, 1758]
] 
Synonyms [at least 48 published]`)

Deno.test('jevkoFromString', () => {
  assert(parsed.subjevkos.length === 5)
  assert(parsed.suffix === "")
  
  assert(parsed.subjevkos[2].jevko.subjevkos.some(({prefix}) => prefix.includes(" [Kingdom] ")), JSON.stringify(parsed.subjevkos[2].jevko.subjevkos, null, 2))
  
  try {
    jevkoFromString(`
  this should crash [
    with unexpected \`] at 5:1
  ]
]`)
  } catch (e) {
    assert(e.message.includes('5:1'), e)
  }
})

// todo: support final heredoc
Deno.test(`'heredoc'`, () => {
  const str = `\`''?\\s*(?=[\\[\\]])'\``
  // const str = `end\`''?\\s*(?=[\\[\\]])'\`end`

  const parsed = jevkoFromString(str)

  assertEquals(parsed.suffix, `'?\\s*(?=[\\[\\]])`)
})

Deno.test('heredoc edge', () => {
  const str = `
  end [\`'''a''\`]
  end [\`''a'a''\`]
  end [\`'''a'a''\`]
  test [\`''\`]\`'[prefix]'\`[suffix]
  prefix [\`'[suffix]'\`]
  symmetry [\`\`\`'...'\`\`\`]
`

// tag\`'[prefix]'\`tag [suffix]
// tag\`'[prefix]'\`tag [tag\`'[suffix]'\`tag]

  const parsed = jevkoFromString(str)
  const {subjevkos} = parsed

  assertEquals(subjevkos[0].jevko.suffix, `''a'`)
  assertEquals(subjevkos[1].jevko.suffix, `'a'a'`)
  assertEquals(subjevkos[2].jevko.suffix, `''a'a'`)
  assertEquals(subjevkos[3].jevko.suffix, ``)
  assertEquals(subjevkos[4].prefix, `[prefix]`)
  assertEquals(subjevkos[5].jevko.suffix, `[suffix]`)
  assertEquals(subjevkos[6].jevko.suffix, `...`)
})

Deno.test('jevkoFromString heredoc fail', () => {  
  try {
    jevkoFromString(`
  this should crash [\`'\`]`)
  } catch (e) {
    assert(e.message !== '', e)
  }
})

Deno.test('doctest', () => {  
  const str = Deno.readTextFileSync('doctest')

  const parsed = jevkoFromString(str)

  let ret = ''

  for (const {prefix, jevko} of parsed.subjevkos) {
    ret += prefix

    const ss = jevko.subjevkos

    {
      const {prefix, jevko} = ss[0]
      ret += `\n.. ${prefix.replace(/\s/g, '')}:: `
      ret += jevko.suffix
    }

    for (const {prefix, jevko: j} of ss.slice(1, -1)) {
      ret += `\n   :${prefix.replace(/\s/g, '')}: `
      ret += j.suffix
    }

    {
      const {prefix, jevko} = ss.at(-1)
      assert(prefix.trim() === '')
      ret += '\n' + normalizeindent(jevko.suffix, 3)
    }
  }
  ret += parsed.suffix

  console.log(ret)
})

// Deno.test('unicode', () => {
//   const t = `_20- _D7FF-퟿_6c0f-氏_E000-_FFFD-�_effe-_010000-[𐀀]_10FFFF-􏿿_08ffff-򏿿`

//   console.log(JSON.stringify(jevkoFromString(t), null, 2))
// })

const normalizeindent = (str, desired = 3) => {
  const lines = str.split('\n')
  const indents = []
  let lowest = Infinity
  for (const line of lines) {
    let current = 0
    for (let i = 0; i < line.length; ++i) {
      const c = line[i]
      if (c === ' ') {
        current += 1
      } else break
    }
    if (current < lowest) lowest = current
    indents.push(current)
  }

  const ret = []
  let i = 0
  for (const line of lines) {
    const indent = indents[i]
    const lose = (indent - lowest) - desired
    if (lose > 0) {
      ret.push(line.slice(lose))
    } else {
      const ind = Array.from({length: -lose}).join(' ')
      ret.push(ind + line)
    }
    i += 1
  }
  return ret.join('\n')
}