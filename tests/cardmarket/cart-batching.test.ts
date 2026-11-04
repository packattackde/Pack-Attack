import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { planCartBatches } from '../../src/lib/cardmarket-browser/cart-batching';

const shipA = {
  name: 'Alice',
  street: 'A St 1',
  zip: '10115',
  city: 'Berlin',
  country: 'DE',
};
const shipB = {
  name: 'Bob',
  street: 'B St 2',
  zip: '80331',
  city: 'Munich',
  country: 'DE',
};

describe('planCartBatches', () => {
  it('merges orders when sellers differ', () => {
    const batches = planCartBatches([
      { orderId: 'o1', shipping: shipA, sellerUsernames: ['SellerX'] },
      { orderId: 'o2', shipping: shipB, sellerUsernames: ['SellerY'] },
    ]);
    assert.equal(batches.length, 1);
    assert.deepEqual(batches[0]!.orderIds, ['o1', 'o2']);
  });

  it('splits when same seller needs two addresses', () => {
    const batches = planCartBatches([
      { orderId: 'o1', shipping: shipA, sellerUsernames: ['SellerX'] },
      { orderId: 'o2', shipping: shipB, sellerUsernames: ['SellerX'] },
    ]);
    assert.equal(batches.length, 2);
    assert.equal(batches[0]!.orderIds[0], 'o1');
    assert.equal(batches[1]!.orderIds[0], 'o2');
  });
});
