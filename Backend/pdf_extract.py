import fitz  # PyMuPDF
import re
from typing import List, Dict



def clean_extracted_text(text: str) -> str:
    if not text:
        return ""

    # Normalize newlines
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Fix hyphenated line breaks: "exam-\nple" -> "example"
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)

    # Remove line breaks that are just wrapping within a paragraph:
    # Convert single newlines to spaces, but keep paragraph breaks
    # First, protect paragraph breaks
    text = re.sub(r"\n{2,}", "\n\n", text)          # collapse many newlines
    text = text.replace("\n\n", "<<<PARA>>>")      # temporary marker
    text = re.sub(r"\n", " ", text)                # remaining single newlines -> space
    text = text.replace("<<<PARA>>>", "\n\n")      # restore paragraph breaks

    # Collapse extra spaces/tabs
    text = re.sub(r"[ \t]+", " ", text)

    # Trim spaces around paragraph breaks
    text = re.sub(r" *\n\n *", "\n\n", text)

    # Optional: add spacing after punctuation if PDF removed it (safe-ish)
    text = re.sub(r"([.!?])([A-Z])", r"\1 \2", text)

    return text.strip()

def normalize_text(s: str) -> str:
    # Fix broken line wraps common in PDFs
    s = s.replace("\r", "\n")
    # Remove hyphenation across line breaks: "exam-\nple" -> "example"
    s = re.sub(r"(\w)-\n(\w)", r"\1\2", s)
    # Convert remaining newlines to spaces (keep paragraph splits later)
    s = re.sub(r"[ \t]+\n", "\n", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()

def split_paragraphs(text: str) -> List[str]:
    # First split by blank lines
    parts = re.split(r"\n\s*\n+", text)
    parts = [re.sub(r"\s+", " ", p).strip() for p in parts if p.strip()]

    # If PDF has no blank lines, fallback to sentence-chunks
    if len(parts) <= 1:
        base = parts[0] if parts else text
        sents = split_sentences(base)
        chunks = chunk_sentences_by_words(sents, max_words=80, min_sents=2, max_sents=4)
        return chunks

    return parts

def split_sentences(text: str) -> List[str]:
    # Lightweight sentence split (good enough for MVP)
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return []
    sents = re.split(r"(?<=[.!?])\s+", text)
    return [s.strip() for s in sents if s.strip()]

def chunk_sentences_by_words(sentences: List[str], max_words: int = 90, min_sents: int = 2, max_sents: int = 4) -> List[str]:
    """
    ADHD pages: group 2-4 sentences while keeping word count reasonable.
    """
    pages = []
    buf = []
    buf_words = 0

    def flush():
        nonlocal buf, buf_words
        if buf:
            pages.append(" ".join(buf).strip())
        buf, buf_words = [], 0

    for s in sentences:
        w = len(s.split())
        # If adding this sentence would exceed max_words AND we have at least min_sents, flush
        if buf and (buf_words + w > max_words) and (len(buf) >= min_sents):
            flush()

        buf.append(s)
        buf_words += w

        # If we hit max_sents, flush
        if len(buf) >= max_sents:
            flush()

    flush()
    return [p for p in pages if len(p) >= 20]

def dyslexia_reflow(paragraph: str, max_chars: int = 90) -> str:
    """
    Optional: reflow long paragraphs into shorter lines.
    Frontend can still render as normal text; this reduces wall-of-text feeling.
    """
    words = paragraph.split()
    lines = []
    line = ""
    for w in words:
        if len(line) + len(w) + 1 <= max_chars:
            line = (line + " " + w).strip()
        else:
            lines.append(line)
            line = w
    if line:
        lines.append(line)
    return "\n".join(lines)

def chunk_words(text: str, max_words: int = 70) -> List[str]:
    words = text.split()
    if not words:
        return []
    chunks = []
    for i in range(0, len(words), max_words):
        chunks.append(" ".join(words[i:i+max_words]).strip())
    return [c for c in chunks if len(c) >= 20]

def extract_converted_units(pdf_path: str, mode: str) -> List[Dict]:
    """
    Returns list of units with source page number:
      - dyslexia: paragraph-like chunks, cleaned + optionally reflowed
      - adhd: short 'pages' built from sentences, ideal for page flip
    """
    doc = fitz.open(pdf_path)
    units: List[Dict] = []

    for pno in range(doc.page_count):
        page = doc.load_page(pno)
        raw = page.get_text("text") or ""
        raw = normalize_text(raw)
        raw = clean_extracted_text(raw)

        paras = split_paragraphs(raw)

        if mode == "dyslexia":
            for para in paras:
                if len(para) < 20:
                    continue

    # break long paragraphs into smaller chunks (better focus steps)
                chunks = chunk_words(para, max_words=70)

                for ch in chunks:
                    ch2 = dyslexia_reflow(ch, max_chars=95)
                    units.append({"page": pno + 1, "text": ch2})

        elif mode == "adhd":
            # Build short pages from sentences across paragraphs within the same PDF page
            all_sents = []
            for para in paras:
                all_sents.extend(split_sentences(para))

            chunks = chunk_sentences_by_words(all_sents, max_words=95, min_sents=2, max_sents=4)
            for ch in chunks:
                units.append({"page": pno + 1, "text": clean_extracted_text(ch) })

        else:
            raise ValueError("mode must be 'dyslexia' or 'adhd'")

    doc.close()
    return units


def extract_paragraph_pages(pdf_path: str, mode: str = "adhd"):
    """
    Backward-compatible name expected by app.py.
    Returns converted units with page numbers.
    """
    return extract_converted_units(pdf_path, mode)
