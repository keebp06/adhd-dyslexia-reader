import { useState } from "react";
import PdfPane from "./PdfPane";
import ConvertedPane from "./ConvertedPane";

export default function SplitReader({ file, mode, units }) {
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(0);

  // reset page when new file is uploaded
  const onNewFile = () => {
    setPageNumber(1);
    setNumPages(0);
  };

  return (
    <div className="split">
      <section className="pane">
        <div className="paneHeader">
          <div className="paneTitle">Original Book</div>
          <div className="pager">
            <button
              disabled={!file || pageNumber <= 1}
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <span className="pagerText">
              Page {file ? pageNumber : "-"} {numPages ? `of ${numPages}` : ""}
            </span>
            <button
              disabled={!file || (numPages ? pageNumber >= numPages : true)}
              onClick={() =>
                setPageNumber((p) => (numPages ? Math.min(numPages, p + 1) : p))
              }
            >
              Next
            </button>
          </div>
        </div>

        <PdfPane
          file={file}
          pageNumber={pageNumber}
          onLoadNumPages={setNumPages}
          onNewFile={onNewFile}
        />
      </section>

      <section className="pane">
        <div className="paneHeader">
          <div className="paneTitle">Converted View ({mode})</div>
        </div>

        <ConvertedPane mode={mode} units={units} />
      </section>
    </div>
  );
}
