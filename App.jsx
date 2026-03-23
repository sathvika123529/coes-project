import { useState, useEffect, useRef } from "react";

const API_BASE = "http://localhost:8000";

const TOPIC_COLORS = [
  { bg: "#0ff", glow: "0 0 20px #0ff4" },
  { bg: "#f0f", glow: "0 0 20px #f0f4" },
  { bg: "#ff0", glow: "0 0 20px #ff04" },
  { bg: "#0f8", glow: "0 0 20px #0f84" },
  { bg: "#f80", glow: "0 0 20px #f804" },
  { bg: "#8f0", glow: "0 0 20px #8f04" },
  { bg: "#08f", glow: "0 0 20px #08f4" },
];

function BarChart({ data, color }) {
  const max = Math.max(...data.map((d) => d.weight || d.score || d.count || 0));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {data.slice(0, 10).map((d, i) => {
        const val = d.weight || d.score || d.count || 0;
        const pct = max > 0 ? (val / max) * 100 : 0;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 90, fontSize: 11, color: "#aaa", fontFamily: "monospace", textAlign: "right", flexShrink: 0 }}>
              {d.word}
            </span>
            <div style={{ flex: 1, background: "#ffffff12", borderRadius: 2, height: 14, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${color}99, ${color})`, borderRadius: 2, transition: "width 0.6s ease", boxShadow: `0 0 6px ${color}88` }} />
            </div>
            <span style={{ width: 52, fontSize: 10, color: "#666", fontFamily: "monospace", flexShrink: 0 }}>
              {typeof val === "number" && val < 1 ? val.toFixed(4) : val}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function HeatMap({ docAssignments, nTopics, colors }) {
  if (!docAssignments?.length) return null;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", fontFamily: "monospace", fontSize: 11 }}>
        <thead>
          <tr>
            <th style={{ padding: "4px 8px", color: "#555", textAlign: "left" }}>Chunk</th>
            {Array.from({ length: nTopics }, (_, k) => (
              <th key={k} style={{ padding: "4px 8px", color: colors[k % colors.length].bg }}>T{k + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {docAssignments.map((row, i) => (
            <tr key={i}>
              <td style={{ padding: "3px 8px", color: "#666" }}>#{row.chunk}</td>
              {row.distribution.map((val, k) => {
                const intensity = Math.floor(val * 255);
                const c = colors[k % colors.length].bg;
                return (
                  <td key={k} style={{ padding: "3px 8px", background: `${c}${intensity.toString(16).padStart(2, "0")}`, color: val > 0.5 ? "#000" : "#aaa", fontWeight: row.dominant_topic === k ? "bold" : "normal", border: row.dominant_topic === k ? `1px solid ${c}` : "1px solid transparent", borderRadius: 3, textAlign: "center" }}
                    title={`Chunk ${row.chunk}, Topic ${k + 1}: ${(val * 100).toFixed(1)}%`}>
                    {(val * 100).toFixed(0)}%
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RadarChart({ topics, colors }) {
  if (!topics || topics.length === 0) return null;
  const size = 260, cx = 130, cy = 130, r = 95, n = topics.length;
  const points = topics.map((t, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    const avgW = t.words.slice(0, 5).reduce((s, w) => s + w.weight, 0) / 5;
    const rr = r * Math.min(avgW * 80, 1);
    return { x: cx + rr * Math.cos(angle), y: cy + rr * Math.sin(angle), lx: cx + (r + 20) * Math.cos(angle), ly: cy + (r + 20) * Math.sin(angle) };
  });
  const polygon = points.map((p) => `${p.x},${p.y}`).join(" ");
  return (
    <svg width={size} height={size} style={{ overflow: "visible" }}>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={Array.from({ length: n }, (_, i) => { const a = (2 * Math.PI * i) / n - Math.PI / 2; return `${cx + r * f * Math.cos(a)},${cy + r * f * Math.sin(a)}`; }).join(" ")} fill="none" stroke="#ffffff18" strokeWidth="1" />
      ))}
      {Array.from({ length: n }, (_, i) => { const a = (2 * Math.PI * i) / n - Math.PI / 2; return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="#ffffff18" strokeWidth="1" />; })}
      <polygon points={polygon} fill="#0ff3" stroke="#0ff" strokeWidth="2" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill={colors[i % colors.length].bg} />
          <text x={p.lx} y={p.ly} fill={colors[i % colors.length].bg} fontSize="11" textAnchor="middle" dominantBaseline="middle" fontFamily="monospace">T{i + 1}</text>
        </g>
      ))}
    </svg>
  );
}

function ProgressBar({ value, message }) {
  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, fontFamily: "monospace" }}>
        <span style={{ color: "#0ff" }}>{message}</span>
        <span style={{ color: "#555" }}>{value}%</span>
      </div>
      <div style={{ background: "#ffffff0f", borderRadius: 4, height: 6, overflow: "hidden", border: "1px solid #ffffff18" }}>
        <div style={{ width: `${value}%`, height: "100%", background: "linear-gradient(90deg, #0ff, #0f8)", borderRadius: 4, transition: "width 0.3s ease", boxShadow: "0 0 10px #0ff8" }} />
      </div>
    </div>
  );
}

function btnStyle(color) {
  return { background: `${color}15`, border: `1px solid ${color}44`, color: color, borderRadius: 5, padding: "7px 16px", fontSize: 11, cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.1em" };
}

export default function App() {
  const [text, setText] = useState("");
  const [nTopics, setNTopics] = useState(5);
  const [nIter, setNIter] = useState(30);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ value: 0, message: "" });
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("topics");
  const [activeTopic, setActiveTopic] = useState(0);
  const [docName, setDocName] = useState("policy_document");
  const fileRef = useRef(null);

  const loadSample = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/sample`);
      const data = await res.json();
      setText(data.text);
      setDocName("sample_policy.txt");
    } catch {
      setError("Could not load sample. Make sure the backend is running on port 8000.");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setText(ev.target.result); setDocName(file.name); };
    reader.readAsText(file);
  };

  const analyze = async () => {
    if (!text.trim()) { setError("Please enter or upload a policy document."); return; }
    setError(""); setLoading(true); setResult(null);
    setProgress({ value: 10, message: "Sending to backend..." });
    try {
      setProgress({ value: 30, message: "Preprocessing text..." });
      await new Promise(r => setTimeout(r, 300));
      setProgress({ value: 50, message: "Running LDA Gibbs sampling..." });
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, n_topics: nTopics, n_iter: nIter, doc_name: docName }),
      });
      setProgress({ value: 90, message: "Computing results..." });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Analysis failed"); }
      const data = await res.json();
      setProgress({ value: 100, message: "Done!" });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = ["topics", "heatmap", "tfidf", "freq", "radar"];

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#e0e0e0", fontFamily: "'Courier New', monospace", padding: 0, margin: 0 }}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, #00000022 2px, #00000022 4px)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>

        <div style={{ marginBottom: 28, borderBottom: "1px solid #0ff3", paddingBottom: 18 }}>
          <h1 style={{ margin: 0, fontSize: "clamp(16px,3vw,26px)", letterSpacing: "0.2em", color: "#0ff", textShadow: "0 0 20px #0ff8,0 0 40px #0ff4", fontWeight: 400 }}>
            ◈ POLICY.TOPIC.MODELER
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#555", letterSpacing: "0.15em" }}>
            LATENT DIRICHLET ALLOCATION · REAL-TIME NLP ANALYSIS
          </p>
        </div>

        <div style={{ background: "#0a0a0f", border: "1px solid #0ff2", borderRadius: 8, padding: 20, marginBottom: 20, boxShadow: "0 0 30px #0ff1" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <button onClick={loadSample} style={btnStyle("#0ff")}>⬇ LOAD SAMPLE</button>
            <button onClick={() => fileRef.current?.click()} style={btnStyle("#f0f")}>📁 UPLOAD FILE</button>
            <input ref={fileRef} type="file" accept=".txt,.md" style={{ display: "none" }} onChange={handleFileUpload} />
            {docName && <span style={{ fontSize: 11, color: "#555", alignSelf: "center" }}>◈ {docName}</span>}
          </div>

          <textarea value={text} onChange={(e) => setText(e.target.value)}
            placeholder="Paste policy document text here, or use Load Sample above..."
            style={{ width: "100%", height: 150, background: "#05050a", border: "1px solid #ffffff18", borderRadius: 6, color: "#ccc", fontFamily: "monospace", fontSize: 12, padding: 12, resize: "vertical", boxSizing: "border-box", outline: "none", lineHeight: 1.6 }} />

          <div style={{ display: "flex", gap: 20, marginTop: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div>
              <label style={{ fontSize: 10, color: "#555", display: "block", marginBottom: 4, letterSpacing: "0.1em" }}>TOPICS · {nTopics}</label>
              <input type="range" min={2} max={7} value={nTopics} onChange={(e) => setNTopics(+e.target.value)} style={{ accentColor: "#0ff", width: 120 }} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: "#555", display: "block", marginBottom: 4, letterSpacing: "0.1em" }}>ITERATIONS · {nIter}</label>
              <input type="range" min={10} max={100} step={10} value={nIter} onChange={(e) => setNIter(+e.target.value)} style={{ accentColor: "#0ff", width: 120 }} />
            </div>
            <button onClick={analyze} disabled={loading} style={{ ...btnStyle("#0ff"), fontSize: 13, padding: "10px 28px", letterSpacing: "0.15em", opacity: loading ? 0.5 : 1, cursor: loading ? "not-allowed" : "pointer", marginLeft: "auto", boxShadow: loading ? "none" : "0 0 20px #0ff4" }}>
              {loading ? "◌ ANALYZING..." : "▶ ANALYZE"}
            </button>
          </div>

          {loading && <div style={{ marginTop: 16 }}><ProgressBar {...progress} /></div>}
          {error && <div style={{ marginTop: 12, padding: 10, background: "#ff000018", border: "1px solid #f004", borderRadius: 6, fontSize: 12, color: "#f88" }}>⚠ {error}</div>}
        </div>

        {result && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginBottom: 20 }}>
              {[["TOKENS", result.document.token_count], ["VOCAB", result.document.vocab_size], ["CHUNKS", result.document.chunks], ["TOPICS", result.parameters.n_topics], ["ITERATIONS", result.parameters.n_iter], ["TIME (s)", result.elapsed_seconds]].map(([l, v]) => (
                <div key={l} style={{ background: "#0a0a0f", border: "1px solid #0ff2", borderRadius: 6, padding: "12px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, color: "#0ff", fontWeight: "bold", textShadow: "0 0 10px #0ff8" }}>{v}</div>
                  <div style={{ fontSize: 9, color: "#444", letterSpacing: "0.15em", marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 2, marginBottom: 16, borderBottom: "1px solid #0ff2" }}>
              {tabs.map((t) => (
                <button key={t} onClick={() => setActiveTab(t)} style={{ background: activeTab === t ? "#0ff2" : "transparent", border: "none", borderBottom: activeTab === t ? "2px solid #0ff" : "2px solid transparent", color: activeTab === t ? "#0ff" : "#555", padding: "8px 14px", fontSize: 11, letterSpacing: "0.12em", cursor: "pointer", fontFamily: "monospace" }}>
                  {t.toUpperCase()}
                </button>
              ))}
            </div>

            {activeTab === "topics" && (
              <div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                  {result.topics.map((t, i) => (
                    <button key={i} onClick={() => setActiveTopic(i)} style={{ background: activeTopic === i ? `${TOPIC_COLORS[i % TOPIC_COLORS.length].bg}22` : "#0a0a0f", border: `1px solid ${activeTopic === i ? TOPIC_COLORS[i % TOPIC_COLORS.length].bg : "#ffffff18"}`, color: TOPIC_COLORS[i % TOPIC_COLORS.length].bg, borderRadius: 5, padding: "6px 14px", fontSize: 11, cursor: "pointer", fontFamily: "monospace", boxShadow: activeTopic === i ? TOPIC_COLORS[i % TOPIC_COLORS.length].glow : "none" }}>
                      T{i + 1}
                    </button>
                  ))}
                </div>
                {result.topics[activeTopic] && (
                  <div style={{ background: "#0a0a0f", border: `1px solid ${TOPIC_COLORS[activeTopic % TOPIC_COLORS.length].bg}44`, borderRadius: 8, padding: 20, boxShadow: TOPIC_COLORS[activeTopic % TOPIC_COLORS.length].glow }}>
                    <h3 style={{ margin: "0 0 4px", fontSize: 14, color: TOPIC_COLORS[activeTopic % TOPIC_COLORS.length].bg, letterSpacing: "0.1em" }}>{result.topics[activeTopic].label}</h3>
                    <p style={{ margin: "0 0 16px", fontSize: 11, color: "#444" }}>Dominant in {result.topics[activeTopic].dominant_docs} of {result.document.chunks} chunks</p>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                      {result.topics[activeTopic].words.map((w, i) => (
                        <div key={i} style={{ background: `${TOPIC_COLORS[activeTopic % TOPIC_COLORS.length].bg}${Math.floor((1 - i * 0.07) * 40).toString(16).padStart(2, "0")}`, border: `1px solid ${TOPIC_COLORS[activeTopic % TOPIC_COLORS.length].bg}44`, borderRadius: 4, padding: "4px 10px", fontSize: 12, color: TOPIC_COLORS[activeTopic % TOPIC_COLORS.length].bg, fontFamily: "monospace" }}>
                          {w.word} <span style={{ fontSize: 9, opacity: 0.6 }}>{(w.weight * 100).toFixed(2)}%</span>
                        </div>
                      ))}
                    </div>
                    <BarChart data={result.topics[activeTopic].words} color={TOPIC_COLORS[activeTopic % TOPIC_COLORS.length].bg} />
                  </div>
                )}
              </div>
            )}

            {activeTab === "heatmap" && (
              <div style={{ background: "#0a0a0f", border: "1px solid #ffffff18", borderRadius: 8, padding: 20 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 13, color: "#0ff", letterSpacing: "0.1em" }}>DOCUMENT-TOPIC DISTRIBUTION HEATMAP</h3>
                <HeatMap docAssignments={result.doc_assignments} nTopics={result.parameters.n_topics} colors={TOPIC_COLORS} />
              </div>
            )}

            {activeTab === "tfidf" && (
              <div style={{ background: "#0a0a0f", border: "1px solid #ffffff18", borderRadius: 8, padding: 20 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 13, color: "#f0f", letterSpacing: "0.1em" }}>TOP TF-IDF KEYWORDS</h3>
                <BarChart data={result.top_tfidf_words} color="#f0f" />
              </div>
            )}

            {activeTab === "freq" && (
              <div style={{ background: "#0a0a0f", border: "1px solid #ffffff18", borderRadius: 8, padding: 20 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 13, color: "#ff0", letterSpacing: "0.1em" }}>WORD FREQUENCY DISTRIBUTION</h3>
                <BarChart data={result.word_frequency.map((w) => ({ ...w, weight: w.count }))} color="#ff0" />
              </div>
            )}

            {activeTab === "radar" && (
              <div style={{ background: "#0a0a0f", border: "1px solid #ffffff18", borderRadius: 8, padding: 20 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 13, color: "#0f8", letterSpacing: "0.1em" }}>TOPIC STRENGTH RADAR</h3>
                <div style={{ display: "flex", gap: 40, flexWrap: "wrap", alignItems: "flex-start" }}>
                  <RadarChart topics={result.topics} colors={TOPIC_COLORS} />
                  <div style={{ flex: 1, minWidth: 200 }}>
                    {result.topics.map((t, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: TOPIC_COLORS[i % TOPIC_COLORS.length].bg, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 11, color: TOPIC_COLORS[i % TOPIC_COLORS.length].bg }}>{t.label}</div>
                          <div style={{ fontSize: 10, color: "#444" }}>Top: {t.words.slice(0, 3).map(w => w.word).join(", ")}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 40, borderTop: "1px solid #0ff1", paddingTop: 16, fontSize: 10, color: "#333", textAlign: "center", letterSpacing: "0.1em" }}>
          POLICY TOPIC MODELER · LDA + GIBBS SAMPLING · PURE PYTHON 3.14
        </div>
      </div>
      <style>{`* { box-sizing: border-box; } ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #050508; } ::-webkit-scrollbar-thumb { background: #0ff4; border-radius: 3px; } textarea:focus { border-color: #0ff4 !important; }`}</style>
    </div>
  );
}