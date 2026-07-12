import math
import urllib.request
import json
from typing import List, Dict, Any

class VectorDB:
    def __init__(self, ollama_url: str = "http://localhost:11434", model: str = "deepseek-r1:8b"):
        self.ollama_url = ollama_url
        self.model = model
        # Store records: {"id": int, "text": str, "vector": List[float], "metadata": dict}
        self.records: List[Dict[str, Any]] = []
        self._next_id = 1

    def _get_embedding(self, text: str) -> List[float]:
        try:
            req_data = json.dumps({
                "model": self.model,
                "prompt": text
            }).encode('utf-8')
            
            req = urllib.request.Request(
                f"{self.ollama_url}/api/embeddings", 
                data=req_data,
                headers={'Content-Type': 'application/json'}
            )
            
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode('utf-8'))
                return result.get("embedding", [])
        except Exception as e:
            print(f"[VectorDB] Error generating embedding: {e}")
            return []

    def _cosine_similarity(self, v1: List[float], v2: List[float]) -> float:
        if not v1 or not v2 or len(v1) != len(v2):
            return 0.0
            
        dot_product = sum(a * b for a, b in zip(v1, v2))
        norm1 = math.sqrt(sum(a * a for a in v1))
        norm2 = math.sqrt(sum(b * b for b in v2))
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
            
        return dot_product / (norm1 * norm2)

    def add_chunk(self, text: str, metadata: Dict[str, Any] = None):
        """Generates embedding for text and stores it."""
        embedding = self._get_embedding(text)
        if not embedding:
            return
            
        record = {
            "id": self._next_id,
            "text": text,
            "vector": embedding,
            "metadata": metadata or {}
        }
        self.records.append(record)
        self._next_id += 1
        print(f"[VectorDB] Stored chunk {record['id']} (len: {len(text)})")

    def search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Searches for top_k most similar chunks using cosine similarity."""
        if not self.records:
            return []
            
        query_vector = self._get_embedding(query)
        if not query_vector:
            return []
            
        scored_records = []
        for record in self.records:
            score = self._cosine_similarity(query_vector, record["vector"])
            scored_records.append({
                "score": score,
                "text": record["text"],
                "metadata": record["metadata"]
            })
            
        # Sort by score descending
        scored_records.sort(key=lambda x: x["score"], reverse=True)
        return scored_records[:top_k]
