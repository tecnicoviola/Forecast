import os
import json
import logging
from typing import Optional, Dict, Any, List
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from app.config import settings

logger = logging.getLogger("climate_analyzer.db")

class DocumentDatabase:
    """
    Hybrid NoSQL Database adapter:
    Attempts connection to MongoDB if accessible.
    If MongoDB is offline or unavailable, seamlessly falls back to a persistent
    thread-safe file-backed NoSQL document store inside `data_cache/`
    ensuring zero-configuration setup for local evaluation.
    """

    def __init__(self):
        self.client: Optional[MongoClient] = None
        self.mongo_db = None
        self.is_mongo_active: bool = False
        self.cache_dir = settings.CACHE_DIR
        os.makedirs(self.cache_dir, exist_ok=True)
        self._init_connection()

    def _init_connection(self):
        try:
            self.client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=1500)
            # Check connection
            self.client.admin.command('ping')
            self.mongo_db = self.client[settings.DATABASE_NAME]
            self.is_mongo_active = True
            logger.info("Connected successfully to MongoDB instance.")
        except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as e:
            self.is_mongo_active = False
            logger.info(f"MongoDB not reachable ({e}). Operating in resilient File-based NoSQL Document Store mode.")

    def _get_collection_file(self, collection_name: str) -> str:
        return os.path.join(self.cache_dir, f"{collection_name}.json")

    def _read_local_collection(self, collection_name: str) -> Dict[str, Any]:
        filepath = self._get_collection_file(collection_name)
        if not os.path.exists(filepath):
            return {}
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading local collection {collection_name}: {e}")
            return {}

    def _write_local_collection(self, collection_name: str, data: Dict[str, Any]):
        filepath = self._get_collection_file(collection_name)
        try:
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Error saving local collection {collection_name}: {e}")

    def get_document(self, collection_name: str, doc_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve cached analysis or query result by unique key."""
        if self.is_mongo_active and self.mongo_db is not None:
            try:
                doc = self.mongo_db[collection_name].find_one({"_id": doc_id})
                if doc:
                    return doc
            except Exception as e:
                logger.warning(f"Mongo fetch error: {e}, falling back to local file store.")
        
        # Local document store fallback
        collection = self._read_local_collection(collection_name)
        return collection.get(doc_id)

    def set_document(self, collection_name: str, doc_id: str, data: Dict[str, Any]) -> bool:
        """Store or update document."""
        data_to_store = dict(data)
        data_to_store["_id"] = doc_id

        if self.is_mongo_active and self.mongo_db is not None:
            try:
                self.mongo_db[collection_name].replace_one({"_id": doc_id}, data_to_store, upsert=True)
                return True
            except Exception as e:
                logger.warning(f"Mongo write error: {e}, using local file store.")

        collection = self._read_local_collection(collection_name)
        collection[doc_id] = data_to_store
        self._write_local_collection(collection_name, collection)
        return True

    def list_documents(self, collection_name: str, limit: int = 50) -> List[Dict[str, Any]]:
        """List documents from collection."""
        if self.is_mongo_active and self.mongo_db is not None:
            try:
                cursor = self.mongo_db[collection_name].find().limit(limit)
                return list(cursor)
            except Exception as e:
                logger.warning(f"Mongo list error: {e}")

        collection = self._read_local_collection(collection_name)
        return list(collection.values())[:limit]

# Global DB instance
db = DocumentDatabase()
