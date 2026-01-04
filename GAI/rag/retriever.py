# rag/retriever.py
import chromadb
from chromadb.utils import embedding_functions

CHROMA_DIR = ".chroma"
COLLECTION_NAME = "eventkb"

embedder = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

def retrieve_relevant_chunks(query: str, k: int = 4):
    client = chromadb.PersistentClient(path=CHROMA_DIR)
    coll = client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=embedder
    )
    res = coll.query(query_texts=[query], n_results=k)
    docs = res.get("documents", [[]])[0]
    metas = res.get("metadatas", [[]])[0]
    # Pair with sources
    return [{"content": d, "source": m.get("source")} for d, m in zip(docs, metas)]
