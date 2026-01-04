# rag/ingest.py
import os
from pathlib import Path
from pypdf import PdfReader
import chromadb
from chromadb.utils import embedding_functions

# Disable Chroma telemetry noise
os.environ["CHROMA_TELEMETRY_ENABLED"] = "false"

DOC_DIR = Path("data/docs")
CHROMA_DIR = ".chroma"
COLLECTION_NAME = "eventkb"

embedder = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

def load_text_from_pdf(path: Path) -> str:
    reader = PdfReader(str(path))
    return "\n".join((page.extract_text() or "") for page in reader.pages)

def chunk(text: str, max_chars: int = 1200, overlap: int = 150):
    chunks = []
    i, n = 0, len(text)
    while i < n:
        j = min(i + max_chars, n)
        segment = text[i:j].strip()
        if segment:
            chunks.append(segment)
        i = j - overlap if j < n else j
        if i < 0:
            i = 0
    return chunks

def main():
    print(f"[INGEST] Looking for docs in: {DOC_DIR.resolve()}")
    if not DOC_DIR.exists():
        print("[INGEST] data/docs folder not found.")
        return

    files = [p for p in DOC_DIR.glob("*") if p.suffix.lower() in {".pdf", ".txt", ".md"}]
    if not files:
        print("[INGEST] No .pdf/.txt/.md files in data/docs")
        return

    print(f"[INGEST] Found {len(files)} file(s): " + ", ".join(p.name for p in files))

    client = chromadb.PersistentClient(path=CHROMA_DIR)

    # delete old collection
    try:
        client.delete_collection(COLLECTION_NAME)
        print(f"[INGEST] Deleted existing collection '{COLLECTION_NAME}'")
    except Exception:
        pass

    coll = client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=embedder
    )

    docs = []

    for p in files:
        # try PDF → fallback to text
        if p.suffix.lower() == ".pdf":
            try:
                text = load_text_from_pdf(p)
            except Exception:
                text = p.read_text(encoding="utf-8", errors="ignore")
        else:
            text = p.read_text(encoding="utf-8", errors="ignore")

        if not text.strip():
            print(f"[INGEST] Skipping empty/invalid file: {p.name}")
            continue

        chs = chunk(text)
        print(f"[INGEST] {p.name}: {len(chs)} chunk(s)")

        for idx, ch in enumerate(chs):
            docs.append({
                "id": f"{p.name}-{idx}",
                "content": ch,
                "source": p.name
            })

    if not docs:
        print("[INGEST] No chunks created. Nothing ingested.")
        return

    coll.add(
        ids=[d["id"] for d in docs],
        documents=[d["content"] for d in docs],
        metadatas=[{"source": d["source"]} for d in docs]
    )

    print(f"[INGEST] Ingested {len(docs)} chunk(s) into collection '{COLLECTION_NAME}'")
    print(f"[INGEST] Chroma store at: {Path(CHROMA_DIR).resolve()}")

if __name__ == "__main__":
    main()
