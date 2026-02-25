export function roundGram(value) {
  return Number(Number(value).toFixed(3));
}

export function calculateIncrementedAverageGram(currentAverageGram, gramIncrement) {
  return roundGram(Number(currentAverageGram) + Number(gramIncrement));
}

export function calculateBiomassGram(fishCount, averageGram) {
  return roundGram(Number(fishCount) * Number(averageGram));
}
