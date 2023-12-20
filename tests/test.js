import test from 'node:test'
import assert from 'assert/strict'

import {jevkoFromString} from '../jevkoFromString.js'

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

test('jevkoFromString', () => {
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

test('hello world', () => {
  const jevko = jevkoFromString(`hello [world]`) 

  assert(jevko.subjevkos[0].prefix === 'hello ')
  assert(jevko.subjevkos[0].jevko.subjevkos.length === 0)
  assert(jevko.subjevkos[0].jevko.suffix === 'world')
  assert(jevko.suffix === '')
})

test('slicing optimization', () => {
  assert(jevkoFromString(`  \`\`\`\`aaa\`[bbb\`]\`]ccc\`\`  `).suffix === '  ``aaa[bbb]]ccc`  ')
  assert(jevkoFromString(`  \`\`\`\`aaa\`[bbb\`]\`]ccc\`\`  []`).subjevkos[0].prefix === '  ``aaa[bbb]]ccc`  ')
})

test(`'heredoc'`, () => {
  const str = `end [\`''?\\s*(?=[\\[\\]])'\`]`

  const parsed = jevkoFromString(str)

  assert.equal(parsed.subjevkos[0].jevko.suffix, `'?\\s*(?=[\\[\\]])`)
})

test('heredoc edge', () => {
  const str = `
  end [\`''a'\`]
  end [\`'a'a'\`]
  end [\`''a'a'\`]
`

  const parsed = jevkoFromString(str)
  const {subjevkos} = parsed

  assert.equal(subjevkos[0].jevko.suffix, `'a`)
  assert.equal(subjevkos[1].jevko.suffix, `a'a`)
  assert.equal(subjevkos[2].jevko.suffix, `'a'a`)
})

test('unicode', () => {
  const t = `_20- _D7FF-퟿_6c0f-氏_E000-_FFFD-�_effe-_010000-[𐀀]_10FFFF-􏿿_08ffff-򏿿`

  const {subjevkos, suffix} = jevkoFromString(t)

  assert.equal(subjevkos[0].prefix, `_20- _D7FF-퟿_6c0f-氏_E000-_FFFD-�_effe-_010000-`)
  assert.equal(subjevkos[0].jevko.suffix, `𐀀`)
  assert.equal(suffix, `_10FFFF-􏿿_08ffff-򏿿`)
})

test(`tagged`, () => {
  const str = "`$t$hello$t$"

  const parsed = jevkoFromString(str)

  console.log(parsed)

  assert.equal(parsed.suffix, `hello`)


  assert.equal(jevkoFromString("`$$hiho$$").suffix, `hiho`)
  assert.equal(jevkoFromString("`$000$hiho$000$").suffix, `hiho`)
  assert.equal(jevkoFromString("`$000$hiho$000$[]").subjevkos[0].prefix, `hiho`)
  assert.equal(jevkoFromString("[`$___$hiho$___$]").subjevkos[0].jevko.suffix, `hiho`)
})