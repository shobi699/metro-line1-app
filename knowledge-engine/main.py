from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from nlp.preprocessor import Preprocessor
from nlp.extractor import Extractor
from nlp.summarizer import Summarizer
from db.graph import GraphDB
from db.vector import VectorDB
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Knowledge Engine (GraphRAG)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

preprocessor = Preprocessor()
extractor = Extractor()
db = GraphDB(db_path="./data/graph")
db.init_schema()
vector_db = VectorDB()
summarizer = Summarizer()

import datetime

# Simple in-memory audit log for PoC
audit_logs = []

def log_audit(action: str, details: str, user: str = "system"):
    log_entry = {
        "timestamp": datetime.datetime.now().isoformat(),
        "user": user,
        "action": action,
        "details": details
    }
    audit_logs.append(log_entry)
    print(f"[Audit] {log_entry['timestamp']} - {action}: {details}")

class IngestRequest(BaseModel):
    text: str
    source_doc: str
    page: int = 1
    valid_from: Optional[str] = None

class QueryRequest(BaseModel):
    query: str
    roles: List[str]

@app.post("/ingest")
async def ingest_document(req: IngestRequest):
    # 1. Preprocess & Chunk
    clean_text = preprocessor.clean(req.text)
    chunks = preprocessor.chunk(clean_text)
    
    total_entities = 0
    total_triples = 0
    
    # 2. Extract
    for chunk in chunks:
        result = extractor.extract(chunk)
        entities = result.get("entities", [])
        triples = result.get("triples", [])
        
        # 3. Insert Entities with Identity Resolution
        for ent in entities:
            db.merge_entity(ent)
            total_entities += 1
            
        # 4. Insert Relations with Provenance and Time Validity
        for triple in triples:
            triple["source_doc"] = req.source_doc
            triple["page"] = req.page
            triple["valid_from"] = req.valid_from
            db.merge_relation(triple)
            total_triples += 1

    # 5. Insert raw chunks into Vector DB
    for chunk in chunks:
        vector_db.add_chunk(chunk, metadata={"source_doc": req.source_doc, "page": req.page, "valid_from": req.valid_from})
            
    log_audit("INGEST", f"Ingested {req.source_doc} - extracted {total_entities} entities and {total_triples} triples.")
    
    return {
        "status": "success",
        "processed_chunks": len(chunks),
        "entities_extracted": total_entities,
        "triples_extracted": total_triples,
        "queue_size": len(db.merge_queue)
    }

@app.post("/query")
async def query_knowledge(req: QueryRequest):
    """
    Hybrid Search (L3-G + L3-V)
    1. Entity Linking (exact/fuzzy match of keywords to norm_keys)
    2. Extract local subgraph
    3. If no subgraph found, fallback to Vector Search
    """
    # Simple extraction of keywords (mocking entity linking)
    words = req.query.split()
    
    # Try to find subgraph (L3-G)
    subgraph = []
    for w in words:
        if len(w) > 3:
            res = db.get_local_subgraph(w, req.roles)
            if res:
                subgraph.extend(res)
                
    if subgraph:
        # L3-G Hit
        log_audit("QUERY", f"L3-G Hit for '{req.query}'")
        return {
            "query": req.query,
            "roles": req.roles,
            "subgraph": subgraph,
            "source": "L3-G",
            "answer_mock": "This is a grounded answer from the knowledge graph."
        }
        
    # Fallback to Vector Search (L3-V)
    vector_results = vector_db.search(req.query, top_k=2)
    if vector_results:
        log_audit("QUERY", f"L3-V Hit for '{req.query}'")
        return {
            "query": req.query,
            "roles": req.roles,
            "chunks": vector_results,
            "source": "L3-V",
            "answer_mock": "This is a semantic answer from the vector database."
        }

    log_audit("QUERY", f"No Match for '{req.query}'")
    # No results found anywhere
    return {
        "query": req.query,
        "roles": req.roles,
        "subgraph": [],
        "chunks": [],
        "source": "None",
        "answer_mock": "اطلاعات کافی در اسناد یافت نشد."
    }

class ResolveMergeRequest(BaseModel):
    queue_index: int
    approve: bool
    alias: Optional[str] = None

@app.post("/queue/resolve")
async def resolve_merge(req: ResolveMergeRequest):
    if req.queue_index < 0 or req.queue_index >= len(db.merge_queue):
        raise HTTPException(status_code=404, detail="Item not found in queue")
        
    item = db.merge_queue.pop(req.queue_index)
    
    if req.approve:
        # In a real system, we'd update aliases
        print(f"[Merge] Approved merging '{item['entity']['norm_key']}' with '{item['matched_key']}'")
        log_audit("MERGE_RESOLVE", f"Approved merging '{item['entity']['norm_key']}' with '{item['matched_key']}'")
        return {"status": "merged"}
    else:
        # Treat as distinct entity
        db.entities.append(item['entity'])
        print(f"[Merge] Rejected merge. Stored '{item['entity']['norm_key']}' as distinct.")
        log_audit("MERGE_RESOLVE", f"Rejected merging '{item['entity']['norm_key']}' with '{item['matched_key']}'")
        return {"status": "kept_distinct"}

@app.get("/queue")
async def get_queue():
    return {"pending_merges": db.merge_queue}

class GlobalQueryRequest(BaseModel):
    query: str

@app.post("/global-query")
async def global_query(req: GlobalQueryRequest):
    log_audit("GLOBAL_QUERY", f"Global summary requested for: '{req.query}'")
    summary = summarizer.summarize_clusters(db.entities, db.relations, req.query)
    return {
        "query": req.query,
        "summary": summary,
        "source": "L4-Global"
    }

@app.get("/audit-logs")
async def get_audit_logs():
    return {"logs": list(reversed(audit_logs))}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
