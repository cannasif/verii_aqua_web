import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBiomassGram,
  calculateIncrementedAverageGram,
  roundGram,
} from '../src/features/aqua/shared/batch-math.js';

test('calculateIncrementedAverageGram adds increment gram with 3-digit precision', () => {
  assert.equal(calculateIncrementedAverageGram(1, 6), 7);
  assert.equal(calculateIncrementedAverageGram(0.5, 0.001), 0.501);
  assert.equal(calculateIncrementedAverageGram(50, 0.5), 50.5);
});

test('calculateBiomassGram calculates fish count x average gram', () => {
  assert.equal(calculateBiomassGram(10000, 50), 500000);
  assert.equal(calculateBiomassGram(3000, 65), 195000);
  assert.equal(calculateBiomassGram(9850, 50), 492500);
});

test('scenario delta matches expected convert biomass increase', () => {
  const fishCount = 1000;
  const fromAverage = 1;
  const increment = 6;

  const toAverage = calculateIncrementedAverageGram(fromAverage, increment);
  const fromBiomass = calculateBiomassGram(fishCount, fromAverage);
  const toBiomass = calculateBiomassGram(fishCount, toAverage);
  const delta = roundGram(toBiomass - fromBiomass);

  assert.equal(toAverage, 7);
  assert.equal(delta, 6000);
});
