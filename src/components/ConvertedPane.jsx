import { useEffect, useMemo, useRef, useState } from "react";

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

const HIGHLIGHT_COLORS = [
  { name: "Yellow", value: "rgba(255, 235, 59, 0.55)" },
  { name: "Green", value: "rgba(76, 175, 80, 0.35)" },
  { name: "Pink", value: "rgba(233, 30, 99, 0.25)" },
  { name: "Blue", value: "rgba(33, 150, 243, 0.28)" },
];

function splitIntoSentences(text) {
  return (text || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
}

export default function ConvertedPane({ mode, units }) {
  // Common
  const containerRef = useRef(null);
  const pages = useMemo(() => (Array.isArray(units) ? units : []), [units]);

  // ADHD state (kept minimal so file compiles; your ADHD UI can stay as you had)
  const [pageIdx, setPageIdx] = useState(0);
  const [direction, setDirection] = useState("next"); // "next" | "prev"

  // Dyslexia controls
  const [highlightColor, setHighlightColor] = useState(HIGHLIGHT_COLORS[0].value);
  const [fontSize, setFontSize] = useState(22);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [letterSpacing, setLetterSpacing] = useState(0.5);

  const [focusMode, setFocusMode] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  // Reading ruler
  const [rulerMode, setRulerMode] = useState(false);
  const [rulerY, setRulerY] = useState(180);

  // TTS
  const [ttsOn, setTtsOn] = useState(false);
  const [ttsRate, setTtsRate] = useState(1.0);

  const [ttsIdx, setTtsIdx] = useState(0);
  const [ttsSentences, setTtsSentences] = useState([]);

  // Reset indexes on mode/units change
  useEffect(() => {
    setPageIdx(0);
    setActiveIdx(0);
    stopTTS();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, units]);

  // Keep sentence list in sync with current paragraph (focus mode)
  useEffect(() => {
    const para = pages[activeIdx] ?? "";
    setTtsSentences(splitIntoSentences(para));
    setTtsIdx(0);
    // when changing paragraph, stop any in-progress speech
    window.speechSynthesis.cancel();
    setTtsOn(false);
  }, [activeIdx, pages]);

  // Track mouse/touch for ruler
  const updateRuler = (e) => {
    if (!rulerMode) return;
    const host = containerRef.current;
    if (!host) return;

    const rect = host.getBoundingClientRect();
    const clientY = e.touches?.[0]?.clientY ?? e.clientY;
    const y = clientY - rect.top;

    setRulerY(clamp(y, 60, rect.height - 60));
  };

  // --- TTS logic (sentence-by-sentence follow along) ---
  const speakCurrentSentence = () => {
    const sentence = ttsSentences[ttsIdx];
    if (!sentence) {
      setTtsOn(false);
      return;
    }

    const u = new SpeechSynthesisUtterance(sentence);
    u.rate = ttsRate;

    u.onend = () => {
      setTtsIdx((prev) => {
        const next = prev + 1;
        if (next >= ttsSentences.length) {
          setTtsOn(false);
          return prev;
        }
        return next;
      });
    };

    window.speechSynthesis.speak(u);
  };

  const startTTS = () => {
    if (!ttsSentences.length) return;
    window.speechSynthesis.cancel();
    setTtsIdx(0);
    setTtsOn(true);
  };

  function stopTTS() {
    window.speechSynthesis.cancel();
    setTtsOn(false);
    setTtsIdx(0);
  }

  // When ttsIdx changes during playback, speak the next sentence
  useEffect(() => {
    if (!ttsOn) return;
    speakCurrentSentence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttsIdx, ttsOn]);

  // --- ADHD minimal (so your app still runs) ---
  const total = pages.length;
  const current = pages[pageIdx] ?? "";
  const percent = total ? Math.round(((pageIdx + 1) / total) * 100) : 0;

  const next = () => {
    if (pageIdx >= total - 1) return;
    setDirection("next");
    setPageIdx((p) => clamp(p + 1, 0, total - 1));
  };

  const prev = () => {
    if (pageIdx <= 0) return;
    setDirection("prev");
    setPageIdx((p) => clamp(p - 1, 0, total - 1));
  };

  // =========================
  // ADHD UI (keep yours if you want)
  // =========================
  if (mode === "adhd") {
    return (
      <div className="converted kindle">
        <div className="readerTopbar">
          <div className="adhdControls">
            <button disabled={pageIdx <= 0} onClick={prev}>
              ◀
            </button>

            <div className="progressMeta">
              <div className="progressPill">
                Page {Math.min(pageIdx + 1, total)} / {total} • {percent}%
              </div>
            </div>

            <button disabled={pageIdx >= total - 1} onClick={next}>
              ▶
            </button>
          </div>

          <div className="rightTools">
            <div className="highlightPicker">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.name}
                  className="colorDot"
                  title={c.name}
                  style={{
                    background: c.value,
                    outline: highlightColor === c.value ? "2px solid #111" : "1px solid #ddd",
                  }}
                  onClick={() => setHighlightColor(c.value)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="readerControls">
          <label>
            Font
            <input
              type="range"
              min="16"
              max="34"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
            />
          </label>

          <label>
            Line
            <input
              type="range"
              min="1.3"
              max="2.4"
              step="0.1"
              value={lineHeight}
              onChange={(e) => setLineHeight(Number(e.target.value))}
            />
          </label>

          <label>
            Letter
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={letterSpacing}
              onChange={(e) => setLetterSpacing(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="pageFrame" ref={containerRef}>
          <div
            key={pageIdx}
            className={`pageCard ${direction} convertedText adhd`}
            style={{
              background: highlightColor,
              fontSize: `${fontSize}px`,
              lineHeight,
              letterSpacing: `${letterSpacing}px`,
            }}
          >
            {current}
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // ✅ FULL DYSLEXIA MODE (fixed)
  // =========================
  return (
    <div
      className="converted kindle dyslexiaScroll convertedText rulerHost"
      ref={containerRef}
      onMouseMove={updateRuler}
      onTouchMove={updateRuler}
    >
      {/* TOP BAR */}
      <div className="readerTopbar">
        <div className="hint">Dyslexia: readable spacing • Click paragraph to highlight</div>

        <div className="rightTools">
          {/* highlight colors */}
          <div className="highlightPicker">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.name}
                className="colorDot"
                title={c.name}
                style={{
                  background: c.value,
                  outline: highlightColor === c.value ? "2px solid #111" : "1px solid #ddd",
                }}
                onClick={() => setHighlightColor(c.value)}
              />
            ))}
          </div>

          {/* ruler toggle */}
          <button
            className={`rulerToggle ${rulerMode ? "on" : ""}`}
            onClick={() => setRulerMode((v) => !v)}
            title="Reading Ruler"
          >
            Ruler: {rulerMode ? "ON" : "OFF"}
          </button>

          {/* focus toggle */}
          <button
            className={`focusToggle ${focusMode ? "on" : ""}`}
            onClick={() => {
              // when switching modes, stop TTS so nothing continues in background
              stopTTS();
              setFocusMode((v) => !v);
            }}
            title="Toggle Focus Mode"
          >
            <span className="toggleLabel">Toggle</span>
            <span className="toggleState">{focusMode ? "ON" : "OFF"}</span>
          </button>
        </div>
      </div>

      {/* RULER OVERLAY */}
      {rulerMode && (
        <div className="rulerOverlay" aria-hidden="true">
          <div className="rulerShade top" style={{ height: `${Math.max(0, rulerY - 36)}px` }} />
          <div className="rulerBand" style={{ top: `${rulerY - 36}px` }} />
          <div className="rulerShade bottom" style={{ top: `${rulerY + 36}px` }} />
        </div>
      )}

      {/* TYPOGRAPHY CONTROLS */}
      <div className="readerControls">
        <label>
          Font
          <input
            type="range"
            min="16"
            max="34"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
          />
        </label>

        <label>
          Line
          <input
            type="range"
            min="1.3"
            max="2.4"
            step="0.1"
            value={lineHeight}
            onChange={(e) => setLineHeight(Number(e.target.value))}
          />
        </label>

        <label>
          Letter
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={letterSpacing}
            onChange={(e) => setLetterSpacing(Number(e.target.value))}
          />
        </label>
      </div>

      {/* FOCUS MODE */}
      {focusMode ? (
        <div className="focusWrap">
          <div className="focusControls">
            <button
              onClick={() => {
                stopTTS();
                setActiveIdx((i) => clamp(i - 1, 0, pages.length - 1));
              }}
              disabled={activeIdx <= 0}
            >
              ◀ Prev
            </button>

            <div className="focusMeta">
              Paragraph {activeIdx + 1} / {pages.length}
            </div>

            <button
              onClick={() => {
                stopTTS();
                setActiveIdx((i) => clamp(i + 1, 0, pages.length - 1));
              }}
              disabled={activeIdx >= pages.length - 1}
            >
              Next ▶
            </button>
          </div>

          {/* TTS CONTROLS */}
          <div className="ttsRow">
            <button onClick={startTTS} disabled={ttsOn || !ttsSentences.length}>
              {ttsOn ? "Reading..." : "Read Aloud"}
            </button>

            <button onClick={stopTTS} disabled={!ttsOn}>
              Stop
            </button>

            <label className="ttsSpeed">
              Speed
              <input
                type="range"
                min="0.6"
                max="1.6"
                step="0.1"
                value={ttsRate}
                onChange={(e) => setTtsRate(Number(e.target.value))}
              />
            </label>
          </div>

          {/* THE READER CARD (follow-along highlight) */}
          <div
            className="focusCard"
            style={{
              background: highlightColor,
              fontSize: `${fontSize}px`,
              lineHeight,
              letterSpacing: `${letterSpacing}px`,
            }}
          >
            {ttsSentences.length ? (
              ttsSentences.map((s, i) => (
                <span
                  key={i}
                  className={i === ttsIdx && ttsOn ? "ttsActive" : "ttsInactive"}
                >
                  {s + " "}
                </span>
              ))
            ) : (
              <span className="ttsInactive">{pages[activeIdx] ?? ""}</span>
            )}
          </div>
        </div>
      ) : (
        /* NORMAL SCROLL MODE */
        <div className="paraList">
          {pages.map((p, i) => (
            <p
              key={i}
              className={`paraRow ${i === activeIdx ? "active" : ""}`}
              onClick={() => setActiveIdx(i)}
              style={{
                background: i === activeIdx ? highlightColor : "transparent",
                fontSize: `${fontSize}px`,
                lineHeight,
                letterSpacing: `${letterSpacing}px`,
              }}
            >
              {p}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}