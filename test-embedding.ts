import { getEmbedding } from './src/server/modules/ai/embedding'

async function test() {
  console.log('Starting embedding test...')
  try {
    const start = Date.now()
    const emb = await getEmbedding('تست خط ۱ مترو تهران')
    console.log('Success! Vector length:', emb.length)
    console.log('First 5 dimensions:', emb.slice(0, 5))
    console.log('Time taken:', Date.now() - start, 'ms')
  } catch (err) {
    console.error('Test failed with error:', err)
  }
}

test()
