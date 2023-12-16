import test from 'node:test'
import assert from 'assert/strict'
import { parseSadzonka as parse, stringifySadzonka as stringify } from '../sadzonka.js'

test('parse', () => {
  assert.deepEqual(parse('abc'), 'abc')
  assert.deepEqual(parse('[abc]'), ['abc'])
  assert.deepEqual(parse('[abc][def]'), ['abc', 'def'])
  assert.deepEqual(parse('k1[abc] k2[def]'), {k1: 'abc', k2: 'def'})
  assert.deepEqual(parse('k1[abc] k2[def] ;k3[xyz]'), {k1: 'abc', k2: 'def'})
  assert.deepEqual(parse('k1[abc] k2[def] \\[\\][xyz]'), {k1: 'abc', k2: 'def', '\\': 'xyz'})

  assert.deepEqual(parse('k1``[v1]'), {'k1`': 'v1'})
  assert.deepEqual(parse('k1[v1``]'), {k1: 'v1`'})
  assert.deepEqual(
    parse(`abc[def]\`\`\`'ghi'\`\`\`[\`[jkl\`]]mno\`\`[a\`\`b]xy[\`\`zw]lm`), 
    {abc: 'def', ghi: '[jkl]', 'mno`': 'a`b', xy: '`zw'},
  )

  assert.throws(() => parse('k1`[v1]'))
  assert.throws(() => parse('k1[v1`]'))
})

test('stringify', () => {
  assert.deepEqual(stringify('abc'), ('abc'))
  assert.deepEqual(stringify(['abc']), ('[abc]'))
  assert.deepEqual(stringify(['abc', 'def']), ('[abc][def]'))
  assert.deepEqual(stringify({k1: 'abc', k2: 'def'}), ('k1[abc]k2[def]'))
  assert.deepEqual(stringify({k1: 'abc', k2: 'def', '\\': 'xyz'}), ('k1[abc]k2[def]\\[\\][xyz]'))

  assert.deepEqual(
    stringify({k1: '[abc]', k2: '`def`', '`[]`': 'xyz'}), 
    ('k1[\\[[{]abc[}]]]k2[\\[[~]def[~]]]\\[[~][{][}][~]][xyz]')
  )
})