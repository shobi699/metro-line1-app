import { NextResponse, NextRequest } from 'next/server'
import { AIGateway } from '@/server/modules/ai/gateway'
import { verifyAccessToken } from '@/server/auth/jwt'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = await verifyAccessToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { prompt } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const systemPrompt = `
You are an expert technical catalog designer. Your goal is to convert user descriptions of technical troubleshooting processes, state machines, or system components into valid Mermaid.js flowchart code.
CRITICAL RULES:
1. Return ONLY valid Mermaid.js code. No markdown formatting (\`\`\`mermaid). No introductory or concluding text.
2. ALWAYS use "flowchart TD" or "flowchart LR". Do not use stateDiagram or other chart types.
3. Node IDs must be alphanumeric English only (A, B, C, N1, N2).
4. EVERY node must have an explicit ID before its shape. NEVER connect directly to a shape without an ID. (e.g. A --> B{"text"} is VALID. A --> {"text"} is INVALID).
5. All Persian/Farsi text MUST be enclosed in double quotes. Example: A["شروع عیب یابی"]
6. FOR ARROWS WITH TEXT, YOU MUST USE THIS EXACT SYNTAX: NodeID1 -->|"متن"| NodeID2
7. STRICTLY FORBIDDEN: Do NOT use \`-- متن --\` or \`--متن--\`. This will crash the system. Only use \`-->|"متن"|\`.
8. Make sure to properly close all braces, brackets, and quotes. (e.g. B{"متن"})

Example Output:
flowchart TD
  A["شروع عیب یابی"] --> B{"آیا برق وصل است؟"}
  B -->|"بله"| C["بررسی سنسورها"]
  B -->|"خیر"| D["بررسی فیوز اصلی"]
`

    const response = await AIGateway.routeRequest(systemPrompt + '\n\n' + prompt)

    const responseText = response.text
    
    // Clean up potential markdown formatting that the model might incorrectly include
    let cleanMermaid = responseText.replace(/```mermaid\n?/g, '').replace(/```\n?/g, '').trim()
    if (cleanMermaid.startsWith('mermaid')) {
      cleanMermaid = cleanMermaid.substring(7).trim()
    }

    return NextResponse.json({ mermaid: cleanMermaid })
  } catch (error) {
    console.error('Error generating catalog:', error)
    return NextResponse.json({ error: 'Failed to generate catalog' }, { status: 500 })
  }
}

