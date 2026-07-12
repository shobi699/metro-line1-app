import uuid
import difflib
from typing import Dict, Any, List

class GraphDB:
    def __init__(self, db_path: str):
        self.entities = {}
        self.relations = []
        self.merge_queue = []  # Confirmation Queue

    def init_schema(self):
        pass

    def _fuzzy_match(self, new_key: str, threshold: float = 0.85) -> str:
        best_match = None
        highest_ratio = 0.0
        
        for existing_key in self.entities.keys():
            ratio = difflib.SequenceMatcher(None, new_key, existing_key).ratio()
            if ratio > highest_ratio:
                highest_ratio = ratio
                best_match = existing_key
                
        if highest_ratio >= threshold:
            return best_match
        return None

    def merge_entity(self, entity: Dict[str, Any]):
        norm_key = entity.get("norm_key")
        if not norm_key:
            return
            
        # 1. Exact Match
        if norm_key in self.entities:
            # Update aliases if needed
            pass
            return norm_key

        # 2. Fuzzy Match
        fuzzy_match_key = self._fuzzy_match(norm_key)
        
        # 3. Confirmation Queue for uncertain matches
        if fuzzy_match_key:
            # Check if ratio is exactly 1.0 (exact match handles above)
            # If high confidence but not exact, put in queue
            self.merge_queue.append({
                "id": str(uuid.uuid4()),
                "new_entity": entity,
                "candidate_key": fuzzy_match_key,
                "status": "pending"
            })
            # Temporarily add it as a new entity until merged
            self.entities[norm_key] = entity
            return norm_key
        else:
            # No match, add new entity
            self.entities[norm_key] = entity
            return norm_key

    def merge_relation(self, rel: Dict[str, Any]):
        # Enforce Provenance Rule
        if not rel.get("source_doc"):
            print("[GraphDB] Warning: Relation rejected due to missing source_doc (Provenance rule)")
            return
            
        # Add default valid_to
        if "valid_to" not in rel:
            rel["valid_to"] = None
            
        rel_type = rel.get("rel")
        subj = rel.get("subject_key")
        
        # Deprecation logic (Soft Delete)
        # If this relation invalidates or modifies another document/concept,
        # we deprecate previous relations about that concept.
        if rel_type in ["اصلاح_می‌کند", "ابطال_می‌کند"]:
            target = rel.get("target_key")
            valid_from = rel.get("valid_from")
            # Find older relations related to this target and deprecate them
            for existing_rel in self.relations:
                if (existing_rel.get("subject_key") == target or existing_rel.get("target_key") == target) and existing_rel.get("valid_to") is None:
                    existing_rel["valid_to"] = valid_from
                    print(f"[GraphDB] Deprecated relation in {existing_rel.get('source_doc')} due to {rel_type} by {rel.get('source_doc')}")
            
        self.relations.append(rel)

    def get_local_subgraph(self, norm_key: str, access_roles: List[str]) -> List[Dict[str, Any]]:
        # Traverse mock relations for this key
        results = []
        for r in self.relations:
            # Filter by valid_to IS NULL (only return valid relations by default)
            if r.get("valid_to") is not None:
                continue
                
            if r.get("subject_key") == norm_key or r.get("target_key") == norm_key:
                # Mock access control: assume all relations match role for now
                results.append({
                    "subject": r.get("subject_key"),
                    "predicate": r.get("rel"),
                    "object": r.get("target_key"),
                    "source": r.get("source_doc"),
                    "page": r.get("page", 1)
                })
        return results

    def get_queue(self) -> List[Dict[str, Any]]:
        return [q for q in self.merge_queue if q["status"] == "pending"]
