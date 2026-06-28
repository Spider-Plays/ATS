import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { calculateCompensationBreakdown } from './offerCompensation.js'

describe('calculateCompensationBreakdown', () => {
  it('matches sample offer letter at CTC 864480', () => {
    const b = calculateCompensationBreakdown(864480)
    assert.equal(b.earnings.find((e) => e.key === 'basic')?.annual, 345792)
    assert.equal(b.gross.annual, 816047)
    assert.equal(b.totalCtc.annual, 864480)
    assert.equal(b.netPay.annual, 774252)
  })
})
