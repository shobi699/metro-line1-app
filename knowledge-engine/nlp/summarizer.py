import json
import urllib.request
from typing import List, Dict, Any

class Summarizer:
    def __init__(self, ollama_url: str = "http://localhost:11434", model: str = "deepseek-r1:8b"):
        self.ollama_url = ollama_url
        self.model = model

    def summarize_clusters(self, entities: List[Dict[str, Any]], relations: List[Dict[str, Any]], question: str) -> str:
        """
        Creates a global summary (L4) based on all known facts in the DB relevant to the question.
        For a PoC, it just dumps facts into the prompt and asks for a global synthesis.
        """
        if not entities and not relations:
            return "داده‌ای در گراف برای خلاصه‌سازی وجود ندارد."

        facts = []
        for r in relations:
            # Build simple fact strings
            subj = r.get("subject_key", "")
            targ = r.get("target_key", "")
            facts.append(f"{subj} -> {r.get('rel', '')} -> {targ} [سند: {r.get('source_doc', '')}]")
        
        # Take up to 100 relations to avoid context overflow in PoC
        facts_text = "\n".join(facts[:100])
        
        prompt = f"""شما یک دستیار هوشمند مدیران مترو هستید.
با استفاده از حقایق گرافی زیر، یک خلاصه‌ی مدیریتی جامع در پاسخ به پرسش کاربر بنویسید.
حقایق:
{facts_text}

پرسش تحلیلی کاربر: {question}
پاسخ:"""

        req_data = json.dumps({
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.3
            }
        }).encode('utf-8')

        try:
            req = urllib.request.Request(
                f"{self.ollama_url}/api/generate",
                data=req_data,
                headers={'Content-Type': 'application/json'}
            )
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode('utf-8'))
                return result.get("response", "خطا در تولید پاسخ.")
        except Exception as e:
            return f"خطا در برقراری ارتباط با LLM برای خلاصه‌سازی: {str(e)}"
