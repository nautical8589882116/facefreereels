import assert from 'node:assert/strict'
import test from 'node:test'

import { isDemoLogin, isDemoPhone } from '../src/config/demoLogin'

test('recognizes only the configured demo phone', () => {
  assert.equal(isDemoPhone('+919876543210'), true)
  assert.equal(isDemoPhone('9876543210'), false)
  assert.equal(isDemoPhone('+919876543211'), false)
})

test('accepts only the exact demo phone and code pair', () => {
  assert.equal(isDemoLogin('+919876543210', '000000'), true)
  assert.equal(isDemoLogin('+919876543210', '000001'), false)
  assert.equal(isDemoLogin('+919876543211', '000000'), false)
})
