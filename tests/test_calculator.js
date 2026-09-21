// Unit test for calculator logic and edge cases
const assert = require('assert');

function getDealsWord(num) {
  if (num % 1 !== 0) return 'сделки';
  const n = Math.abs(Math.round(num));
  if (n % 10 === 1 && n % 100 !== 11) return 'сделка';
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'сделки';
  return 'сделок';
}

function calculateRevenue(contacts, scenario, crossSell) {
  let dealsPer1000 = 0;
  let baseRevenuePer1000 = 0;

  if (scenario === 'realistic') {
    dealsPer1000 = 1.7;
    baseRevenuePer1000 = 804000;
  } else {
    dealsPer1000 = 3.0;
    baseRevenuePer1000 = 1400000;
  }

  const scale = contacts / 1000;
  const totalDeals = Math.max(1, Math.round(dealsPer1000 * scale * 10) / 10);
  let totalRevenue = Math.round(baseRevenuePer1000 * scale);

  let crossSellRevenue = 0;
  if (crossSell) {
    crossSellRevenue = Math.round(260000 * scale);
    totalRevenue += crossSellRevenue;
  }

  const rpc = Math.round(totalRevenue / contacts);

  return { contacts, scenario, crossSell, totalDeals, totalRevenue, crossSellRevenue, rpc };
}

// Tests
console.log('Testing getDealsWord:');
assert.strictEqual(getDealsWord(1), 'сделка');
assert.strictEqual(getDealsWord(2), 'сделки');
assert.strictEqual(getDealsWord(3.4), 'сделки');
assert.strictEqual(getDealsWord(1.7), 'сделки');
assert.strictEqual(getDealsWord(5.1), 'сделки');
assert.strictEqual(getDealsWord(8.5), 'сделки');
assert.strictEqual(getDealsWord(4), 'сделки');
assert.strictEqual(getDealsWord(5), 'сделок');
assert.strictEqual(getDealsWord(11), 'сделок');
assert.strictEqual(getDealsWord(21), 'сделка');
assert.strictEqual(getDealsWord(24), 'сделки');
console.log('✓ getDealsWord tests passed');

console.log('\nTesting default calculator state (realistic, 2000 contacts, crossSell=false):');
const defaultResult = calculateRevenue(2000, 'realistic', false);
assert.strictEqual(defaultResult.totalDeals, 3.4);
assert.strictEqual(defaultResult.totalRevenue, 1608000);
assert.strictEqual(defaultResult.crossSellRevenue, 0);
assert.strictEqual(defaultResult.rpc, 804);
console.log('✓ Default calculator calculation verified:', defaultResult);

console.log('\nTesting optimized scenario (optimized, 2000 contacts, crossSell=true):');
const optResult = calculateRevenue(2000, 'optimized', true);
assert.strictEqual(optResult.totalDeals, 6);
assert.strictEqual(optResult.totalRevenue, 3320000);
assert.strictEqual(optResult.crossSellRevenue, 520000);
assert.strictEqual(optResult.rpc, 1660);
console.log('✓ Optimized scenario verified:', optResult);

console.log('\nTesting boundary contacts values:');
const minResult = calculateRevenue(500, 'realistic', false);
assert(minResult.totalDeals >= 1, 'Should have at least 1 deal minimum');
assert.strictEqual(minResult.totalRevenue, 402000);

const maxResult = calculateRevenue(10000, 'realistic', true);
assert.strictEqual(maxResult.totalDeals, 17);
assert.strictEqual(maxResult.totalRevenue, 10640000);
console.log('✓ Min and max boundaries verified');

console.log('\nALL CALCULATOR TESTS PASSED SUCCESSFULLY!');
