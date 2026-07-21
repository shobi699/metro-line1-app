export interface DurableObjectNamespace {
  idFromName(name: string): { toString(): string }
  get(id: { toString(): string }): DurableObjectStub
}

export interface DurableObjectStub {
  fetch(url: string, init?: RequestInit): Promise<Response>
}

export interface DurableObjectState {
  acceptWebSocket(ws: unknown): void
}

export interface WebSocketPair {
  0: WebSocket
  1: WebSocket
}

declare const WebSocketPair: {
  new (): WebSocketPair
}

export interface KvNamespace {
  get(key: string, type: 'json'): Promise<unknown>
  put(key: string, value: string, opts: { expirationTtl: number }): Promise<void>
  delete(key: string): Promise<void>
}

export interface R2Bucket {
  put(key: string, value: ArrayBuffer | Buffer, opts?: { httpMetadata?: { contentType?: string } }): Promise<unknown>
}
