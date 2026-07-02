import { describe, it, expect } from 'vitest'
import { cosineSimilarity } from './embedding'

describe('cosineSimilarity', () => {
  it('should return 1 for identical vectors', () => {
    const vecA = [1, 2, 3]
    const vecB = [1, 2, 3]
    expect(cosineSimilarity(vecA, vecB)).toBeCloseTo(1, 5)
  })

  it('should return 0 for orthogonal vectors', () => {
    const vecA = [1, 0]
    const vecB = [0, 1]
    expect(cosineSimilarity(vecA, vecB)).toBe(0)
  })

  it('should calculate correct similarity for similar vectors', () => {
    const vecA = [3, 4, 0]
    const vecB = [3, 4, 1]
    // dotProduct = 3*3 + 4*4 + 0*1 = 25
    // normA = sqrt(9 + 16) = 5
    // normB = sqrt(9 + 16 + 1) = sqrt(26) = 5.099
    // similarity = 25 / (5 * 5.099) = 0.98058
    expect(cosineSimilarity(vecA, vecB)).toBeCloseTo(0.98058, 4)
  })

  it('should throw error for vectors of different lengths', () => {
    const vecA = [1, 2]
    const vecB = [1, 2, 3]
    expect(() => cosineSimilarity(vecA, vecB)).toThrow('Vectors must have the same length')
  })
})
