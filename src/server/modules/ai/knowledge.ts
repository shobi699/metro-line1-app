import { prisma } from '@/server/db'
import { getEmbedding } from './embedding'

/**
 * Splits text into overlapping chunks
 */
export function chunkText(text: string, maxChunkSize = 600, overlap = 120): string[] {
  if (!text) return []
  const chunks: string[] = []
  let start = 0
  
  while (start < text.length) {
    const end = Math.min(start + maxChunkSize, text.length)
    chunks.push(text.substring(start, end))
    start += maxChunkSize - overlap
    
    // Safety check to prevent infinite loop
    if (maxChunkSize - overlap <= 0) break
  }
  
  return chunks
}

/**
 * Indexes a knowledge source by chunking its text and generating local vector embeddings
 */
export async function indexKnowledgeSource(sourceId: string, contentText: string) {
  // 1. Delete previous chunks
  await prisma.aiChunk.deleteMany({
    where: { sourceId }
  })

  // 2. Generate chunks
  const chunks = chunkText(contentText)
  
  if (chunks.length === 0) {
    await prisma.aiKnowledgeSource.update({
      where: { id: sourceId },
      data: { chunkCount: 0, indexedAt: new Date() }
    })
    return
  }

  // 3. Generate embeddings and save chunks
  for (const chunk of chunks) {
    try {
      const embedding = await getEmbedding(chunk)
      await prisma.aiChunk.create({
        data: {
          sourceId,
          text: chunk,
          embedding: JSON.stringify(embedding)
        }
      })
    } catch (err) {
      console.error(`Failed to generate embedding for chunk in source ${sourceId}`, err)
    }
  }

  // 4. Update source metadata
  await prisma.aiKnowledgeSource.update({
    where: { id: sourceId },
    data: {
      chunkCount: chunks.length,
      indexedAt: new Date()
    }
  })
}
