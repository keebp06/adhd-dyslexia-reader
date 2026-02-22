import os, uuid
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pdf_extract import extract_paragraph_pages
from pdf_extract import extract_converted_units

BASE_DIR = os.path.dirname(__file__)
UPLOAD_DIR = os.path.join(BASE_DIR, "data", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(title="ADHD/Dyslexia Reader API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://adhd-dyslexia-reader.vercel.app",  # YOUR EXACT VERCEL URL
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/documents")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF supported.")

    doc_id = str(uuid.uuid4())
    out_path = os.path.join(UPLOAD_DIR, f"{doc_id}.pdf")

    contents = await file.read()
    with open(out_path, "wb") as f:
        f.write(contents)

    return {"doc_id": doc_id}

@app.get("/api/documents/{doc_id}/pages")
def get_pages(doc_id: str):
    pdf_path = os.path.join(UPLOAD_DIR, f"{doc_id}.pdf")
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="Document not found.")

    try:
        # returns per-page paragraphs (whatever your function outputs)
        pages = extract_paragraph_pages(pdf_path)
        return {"doc_id": doc_id, "pages": pages}
    except Exception as e:
        # fallback: return something usable instead of 500
        units = extract_converted_units(pdf_path, mode="dyslexia")
        return {"doc_id": doc_id, "pages": [units], "warning": str(e)}


@app.get("/api/documents/{doc_id}/convert")
def convert(doc_id: str, mode: str = "dyslexia"):
    pdf_path = os.path.join(UPLOAD_DIR, f"{doc_id}.pdf")
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="Document not found.")

    if mode not in {"dyslexia", "adhd"}:
        raise HTTPException(status_code=400, detail="mode must be dyslexia or adhd")

    units = extract_converted_units(pdf_path, mode=mode)
    return {"doc_id": doc_id, "mode": mode, "units": units}


