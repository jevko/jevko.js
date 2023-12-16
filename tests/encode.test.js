import {jevkoFromString} from '../jevkoFromString.js'
import {jevkoToString} from '../jevkoToString.js'

import test from 'node:test'
import assert from 'assert/strict'

// todo: perhaps simply add a jevkoFromString roundtrip to all the other tests
test(`encode fenced`, () => {
  const str = `\`''?\\s*(?=[\\[\\]])'\``

  const parsed = jevkoFromString(str)
  const strified = jevkoToString(parsed)

  assert.equal(strified, str)
})