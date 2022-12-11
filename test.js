import {jevkoFromString} from './jevkoFromString.js'

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

Deno.test('slicing optimization', () => {
  assert(jevkoFromString(`  \`\`\`\`aaa\`[bbb\`]\`]ccc\`\`  `).suffix === '  ``aaa[bbb]]ccc`  ')
  assert(jevkoFromString(`  \`\`\`\`aaa\`[bbb\`]\`]ccc\`\`  []`).subjevkos[0].prefix === '  ``aaa[bbb]]ccc`  ')
})

Deno.test('jevkoFromString', () => {
  const parsed = jevkoFromString(`
test \`/x/]]][[[\`\`\`///y/y/d/ddc/x/
`, {quoter: '/'})
  const sub = parsed.subjevkos[0]
  assertEquals(sub.prefix, '\ntest ')
  assertEquals(sub.jevko.suffix, ']]][[[\`\`\`///y/y/d/ddc')
  assertEquals(sub.jevko.tag, 'x')
})