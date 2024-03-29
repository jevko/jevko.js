import {jevkoFromString} from '../jevkoFromString.js'
import {jevkoToString, escape, fence, smartEscape} from '../jevkoToString.js'

import test from 'node:test'
import assert from 'assert/strict'

// todo: perhaps simply add a jevkoFromString roundtrip to all the other tests
test(`encode fenced`, () => {
  const str = `\`''?\\s*(?=[\\[\\]])'\``

  const parsed = jevkoFromString(str)
  const strified = jevkoToString(parsed)

  assert.equal(strified, str)
})

test(`escaping and fencing`, () => {
  const str = `\`''?\\s*(?=[\\[\\]])'\``

  const res = escape(str)

  assert.equal(res, "``''?\\s*(?=`[\\`[\\`]`])'``")

  assert.equal(fence(str, 3), `\`\`\`'\`''?\\s*(?=[\\[\\]])'\`'\`\`\``)
  assert.equal(fence(str, 5), `\`\`\`\`\`'\`''?\\s*(?=[\\[\\]])'\`'\`\`\`\`\``)
  assert.equal(smartEscape(str), `\`\`\`'\`''?\\s*(?=[\\[\\]])'\`'\`\`\``)

  assert.throws(() => fence(str, 4))
})