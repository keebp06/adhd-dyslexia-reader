import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

export default function PdfPane({ file, pageNumber, onLoadNumPages }) {
  const [fileData, setFileData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    setErr("");

    async function load() {
      if (!file) {
        setFileData(null);
        return;
      }
      try {
        const buf = await file.arrayBuffer();
        if (alive) setFileData({ data: buf });
      } catch (e) {
        console.error(e);
        if (alive) setErr("Could not read this file. Try another PDF.");
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [file]);

  if (!file) return <div className="empty">Upload a PDF to preview it here.</div>;
  if (err) return <div className="empty">{err}</div>;

  return (
    <div className="pdfWrap">
      <Document
        file={fileData}
        loading={<div className="empty">Loading PDF…</div>}
        onLoadSuccess={({ numPages }) => onLoadNumPages(numPages)}
        onLoadError={(e) => {
          console.error("PDF load error:", e);
          setErr("Failed to load PDF. Try a different (non-password) PDF.");
        }}
      >
        <Page pageNumber={pageNumber} scale={1.15} />
      </Document>
    </div>
  );
}
