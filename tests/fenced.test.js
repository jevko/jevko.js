import {jevkoFromString} from '../jevkoFromString.js'

import test from 'node:test'
import assert from 'assert/strict'

test(`fenced`, () => {
  const str = `\`''?\\s*(?=[\\[\\]])'\``

  const parsed = jevkoFromString(str)

  assert.equal(parsed.suffix, `'?\\s*(?=[\\[\\]])`)
})

test('fenced edge', () => {
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

  assert.equal(subjevkos[0].jevko.suffix, `''a'`)
  assert.equal(subjevkos[1].jevko.suffix, `'a'a'`)
  assert.equal(subjevkos[2].jevko.suffix, `''a'a'`)
  assert.equal(subjevkos[3].jevko.suffix, ``)
  assert.equal(subjevkos[4].prefix, `[prefix]`)
  assert.equal(subjevkos[5].jevko.suffix, `[suffix]`)
  assert.equal(subjevkos[6].jevko.suffix, `...`)
})

test('fenced fail', () => {  
  try {
    jevkoFromString(`
  this should crash [\`'\`]`)
  } catch (e) {
    assert(e.message !== '', e)
  }
})
