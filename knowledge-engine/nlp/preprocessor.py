import re

class Preprocessor:
    def __init__(self):
        pass
        
    def clean(self, text: str) -> str:
        # Basic cleanup
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def chunk(self, text: str, max_words: int = 300) -> list[str]:
        # Very naive chunking for Phase 0
        words = text.split()
        chunks = []
        for i in range(0, len(words), max_words):
            chunk = ' '.join(words[i:i+max_words])
            chunks.append(chunk)
        return chunks
