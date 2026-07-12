import json
import urllib.request
from typing import List, Dict, Any

class Extractor:
    def __init__(self, ollama_url: str = "http://localhost:11434/api/generate", model: str = "gemma4:12b-it-qat"):
        self.ollama_url = ollama_url
        self.model = model
        self.prompt_template = """تو یک استخراج‌کننده گراف دانش حرفه‌ای برای اسناد مترو هستی.
دستور: از متن زیر فقط موجودیت‌ها و روابط مجاز را استخراج کن.
گره‌های مجاز: [person, org, document, concept, equipment, place, event, date]
روابط مجاز: [مدیر_, مسئول_, تعهد_مالی, اصلاح_می‌کند, ابطال_می‌کند, ابلاغ_به, واقع_در, مربوط_به, رخداد_در]

قواعد:
1. رابطه غیرصریح نساز.
2. فقط خروجی JSON معتبر شامل کلیدهای `entities` و `triples` برگردان. هیچ متن اضافه‌ای ننویس.
3. موجودیت‌ها باید دارای `norm_key`, `name`, `type` باشند.
4. رابطه‌ها (triples) باید دارای `subject_key`, `rel`, `target_key` باشند.

متن:
"{chunk}"
"""

    def extract(self, text: str) -> Dict[str, Any]:
        prompt = self.prompt_template.format(chunk=text)
        
        payload = {
            "model": self.model,
            "prompt": prompt,
            "format": "json",
            "stream": False,
            "options": {
                "temperature": 0.0
            }
        }
        
        req = urllib.request.Request(
            self.ollama_url,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode('utf-8'))
                response_text = result.get('response', '{}')
                
                # Parse JSON output from model
                # Strip markdown json blocks if present
                response_text = response_text.strip()
                if response_text.startswith('```json'):
                    response_text = response_text[7:]
                if response_text.startswith('```'):
                    response_text = response_text[3:]
                if response_text.endswith('```'):
                    response_text = response_text[:-3]
                response_text = response_text.strip()
                
                try:
                    data = json.loads(response_text)
                    return {
                        "entities": data.get("entities", []),
                        "triples": data.get("triples", [])
                    }
                except json.JSONDecodeError as e:
                    print(f"[Extractor] Model output was not valid JSON: {e}")
                    print(f"Raw Output: {response_text}")
                    return {"entities": [], "triples": []}
                    
        except Exception as e:
            print(f"[Extractor] Request to Ollama failed: {e}")
            return {"entities": [], "triples": []}
