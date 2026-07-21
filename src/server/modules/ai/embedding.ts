import { pipeline, env } from '@xenova/transformers'

// Only download models to the server cache directory, not in the project root
env.cacheDir = './.cache/transformers'
// Optional: Disable local model check if you want it to download from Hugging Face
// env.allowLocalModels = false;

class EmbeddingPipeline {
  static task = 'feature-extraction' as const
  static model = 'Xenova/all-MiniLM-L6-v2'
  static instance: any = null

  static async getInstance(progress_callback?: any) {
    if (this.instance === null) {
      this.instance = pipeline(this.task, this.model, { progress_callback })
    }
    return this.instance
  }
}

/**
 * Generate 384-dimensional embedding for a text string using local transformers.js
 */
export async function getEmbedding(text: string): Promise<number[]> {
  try {
    const embedder = await EmbeddingPipeline.getInstance()
    // By default, feature-extraction returns a tensor. 
    // We want the pooled output (mean pooling) for sentence embeddings.
    const output = await embedder(text, { pooling: 'mean', normalize: true })
    
    // The output is a Float32Array in output.data
    return Array.from(output.data)
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw error
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }

  if (normA === 0 || normB === 0) return 0
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}
