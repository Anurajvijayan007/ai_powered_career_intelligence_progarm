import React, { useState } from 'react';

// ── CONFIGURATION ──────────────────────────────────────────
// Change this to your deployed Render backend URL
const BACKEND_URL = 'https://career-intelligence-backend-2p7t.onrender.com';

// ── LOGIN MODAL ────────────────────────────────────────────
function LoginModal({ onClose }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!username || !password) { setError('Please fill in both fields.'); return; }
    // Simple demo auth — replace with real auth later
    if (username === 'admin' && password === 'admin123') {
      setLoggedIn(true);
      setError('');
      setTimeout(onClose, 1200);
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <div style={modal.overlay}>
      <div style={modal.box}>
        <button style={modal.closeBtn} onClick={onClose}>✕</button>
        <h2 style={modal.title}> Login</h2>
        {loggedIn ? (
          <p style={{ color: '#34d399', textAlign: 'center', fontWeight: 700 }}>
            ✅ Logged in successfully!
          </p>
        ) : (
          <>
            <p style={modal.hint}>Demo: username <b>admin</b> / password <b>admin123</b></p>
            {error && <p style={modal.error}>{error}</p>}
            <label style={modal.label}>Username</label>
            <input style={modal.input} value={username}
              onChange={e => setUsername(e.target.value)} placeholder="Enter username" />
            <label style={modal.label}>Password</label>
            <input style={modal.input} type="password" value={password}
              onChange={e => setPassword(e.target.value)} placeholder="Enter password" />
            <button style={modal.loginBtn} onClick={handleLogin}>Login</button>
            <button style={modal.cancelBtn} onClick={onClose}>Cancel</button>
          </>
        )}
      </div>
    </div>
  );
}

const modal = {
  overlay: {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  box: {
    backgroundColor: '#1e293b', borderRadius: '16px', padding: '36px',
    width: '360px', border: '1px solid #334155', position: 'relative',
  },
  closeBtn: {
    position: 'absolute', top: '14px', right: '16px',
    background: 'none', border: 'none', color: '#94a3b8',
    fontSize: '1.2rem', cursor: 'pointer',
  },
  title: { color: '#fff', marginBottom: '8px', textAlign: 'center' },
  hint: { color: '#64748b', fontSize: '0.8rem', marginBottom: '16px', textAlign: 'center' },
  error: { color: '#f87171', fontSize: '0.85rem', marginBottom: '12px' },
  label: { display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '4px' },
  input: {
    width: '100%', padding: '10px', marginBottom: '14px',
    backgroundColor: '#0f172a', border: '1px solid #334155',
    borderRadius: '8px', color: '#fff', fontSize: '0.95rem',
    boxSizing: 'border-box',
  },
  loginBtn: {
    width: '100%', padding: '11px', backgroundColor: '#2563eb',
    color: '#fff', border: 'none', borderRadius: '8px',
    fontWeight: '700', cursor: 'pointer', marginBottom: '8px',
  },
  cancelBtn: {
    width: '100%', padding: '11px', backgroundColor: '#334155',
    color: '#fff', border: 'none', borderRadius: '8px',
    fontWeight: '600', cursor: 'pointer',
  },
};

// ── NER HIGHLIGHTER ────────────────────────────────────────
function HighlightedText({ text, highlights }) {
  if (!text || !highlights || highlights.length === 0) {
    return <p style={ner.plain}>{text}</p>;
  }

  const colorMap = {
    skill:     { bg: 'rgba(59,130,246,0.3)', border: '#3b82f6', label: 'SKILL' },
    role:      { bg: 'rgba(34,197,94,0.3)',  border: '#22c55e', label: 'ROLE'  },
    education: { bg: 'rgba(234,179,8,0.3)',  border: '#eab308', label: 'EDU'   },
  };

  const parts = [];
  let last = 0;

  highlights.forEach((h, i) => {
    if (h.start > last) parts.push({ type: 'text', content: text.slice(last, h.start) });
    parts.push({ type: 'highlight', content: text.slice(h.start, h.end), htype: h.type });
    last = h.end;
  });
  if (last < text.length) parts.push({ type: 'text', content: text.slice(last) });

  return (
    <div style={ner.container}>
      {/* Legend */}
      <div style={ner.legend}>
        {Object.entries(colorMap).map(([type, style]) => (
          <span key={type} style={{ ...ner.legendItem, borderColor: style.border, backgroundColor: style.bg }}>
            {style.label}
          </span>
        ))}
      </div>
      {/* Text */}
      <div style={ner.textBox}>
        {parts.map((p, i) =>
          p.type === 'text'
            ? <span key={i}>{p.content}</span>
            : (
              <mark key={i} title={colorMap[p.htype]?.label}
                style={{
                  backgroundColor: colorMap[p.htype]?.bg,
                  border: `1px solid ${colorMap[p.htype]?.border}`,
                  borderRadius: '4px', padding: '1px 3px',
                  color: '#fff', fontWeight: '600',
                }}>
                {p.content}
              </mark>
            )
        )}
      </div>
    </div>
  );
}

const ner = {
  container: { marginTop: '12px' },
  legend: { display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' },
  legendItem: {
    padding: '3px 10px', borderRadius: '12px', border: '1px solid',
    fontSize: '0.75rem', fontWeight: '700', color: '#fff',
  },
  textBox: {
    backgroundColor: '#0f172a', borderRadius: '8px', padding: '14px',
    fontSize: '0.82rem', lineHeight: '1.8', color: '#cbd5e1',
    maxHeight: '280px', overflowY: 'auto', whiteSpace: 'pre-wrap',
    border: '1px solid #1e293b',
  },
  plain: { color: '#94a3b8', fontSize: '0.85rem' },
};

// ── MAIN APP ───────────────────────────────────────────────
export default function App() {
  const [uploading, setUploading]         = useState(false);
  const [predictions, setPredictions]     = useState([]);
  const [extractedSkills, setExtractedSkills] = useState([]);
  const [filename, setFilename]           = useState('');
  const [error, setError]                 = useState('');
  const [resumeText, setResumeText]       = useState('');
  const [highlights, setHighlights]       = useState([]);
  const [showLogin, setShowLogin]         = useState(false);
  const [hasResult, setHasResult]         = useState(false);

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setUploading(true);
    setError('');
    setHasResult(false);

    const formData = new FormData();
    formData.append('file', selectedFile);
    setFilename(selectedFile.name);

    try {
      // ✅ Updated to call the live Render backend
      const response = await fetch(`${BACKEND_URL}/upload-resume`, {
        method: 'POST', 
        body: formData,
      });
      
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Upload failed');
      }
      const data = await response.json();

      let skillsArray = Array.isArray(data?.extracted_skills)
        ? data.extracted_skills
        : (data?.extracted_skills || '').split(/[\s,]+/);
      setExtractedSkills(skillsArray.filter(Boolean));
      setPredictions(Array.isArray(data?.predictions) ? data.predictions : []);
      setResumeText(data?.resume_text || '');
      setHighlights(data?.highlights || []);
      setHasResult(true);
    } catch (err) {
      setError(`${err.message}. Please check if the Render backend is live.`);
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setPredictions([]); setExtractedSkills([]);
    setFilename(''); setError('');
    setResumeText(''); setHighlights([]);
    setHasResult(false);
  };

  const getBadgeColor = (prob) => {
    if (prob >= 70) return { bg: 'rgba(16,185,129,0.2)', text: '#34d399' };
    if (prob >= 40) return { bg: 'rgba(245,158,11,0.2)', text: '#fbbf24' };
    return { bg: 'rgba(239,68,68,0.2)', text: '#f87171' };
  };

  return (
    <div style={s.page}>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      {/* ── HEADER ── */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          <div>
            <div style={s.logoTitle}>CareerCast AI Prediction</div>
            <div style={s.logoSub}>Powered by SpaCy NER + Logistic Regression</div>
          </div>
        </div>
        <button style={s.loginBtn} onClick={() => setShowLogin(true)}>
          Login
        </button>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main style={s.main}>

        {/* ── LEFT PANEL ── */}
        <div style={s.leftPanel}>
          {/* Upload Card */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>Upload Resume</h3>
            <p style={s.cardDesc}>Upload a PDF or TXT resume to extract skills and predict careers.</p>

            {error && <div style={s.errorBox}>{error}</div>}

            <label style={{ ...s.uploadBtn, opacity: uploading ? 0.7 : 1 }}>
              {uploading ? ' Analyzing...' : 'Choose Resume (PDF / TXT)'}
              <input type="file" accept=".pdf,.txt" style={{ display: 'none' }}
                onChange={handleFileUpload} disabled={uploading} />
            </label>

            {uploading && (
              <div style={s.loadingBox}>
                <div style={s.spinner} />
                <p style={{ color: '#94a3b8', marginTop: '10px', fontSize: '0.85rem' }}>
                  SpaCy NER extracting keywords...<br />Running AI prediction...
                </p>
              </div>
            )}

            {filename && !uploading && (
              <div style={s.fileTag}>📎 {filename}
                <button style={s.resetBtn} onClick={reset}>✕ Clear</button>
              </div>
            )}
          </div>

          {/* NER Highlight Card */}
          {hasResult && (
            <div style={s.card}>
              <h3 style={s.cardTitle}> SpaCy NER — Keyword Extraction</h3>
              <p style={s.cardDesc}>
                Keywords extracted from your resume text, highlighted by category:
              </p>
              <HighlightedText text={resumeText} highlights={highlights} />
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={s.rightPanel}>
          {!hasResult ? (
            <div style={{ ...s.card, textAlign: 'center', padding: '48px 24px' }}>
              <h3 style={{ color: '#64748b', fontWeight: 600 }}>
                Upload a resume to see predictions
              </h3>
              <p style={{ color: '#475569', fontSize: '0.85rem', marginTop: '8px' }}>
                Your top 3 career matches will appear here
              </p>
            </div>
          ) : (
            <>
              {/* Extracted Skills */}
              <div style={s.card}>
                <h3 style={s.cardTitle}>
                   Extracted Skills
                  <span style={s.badge}>{extractedSkills.length} found</span>
                </h3>
                <div style={s.skillGrid}>
                  {extractedSkills.length > 0
                    ? extractedSkills.map((skill, i) => (
                        <span key={i} style={s.skillChip}>{skill}</span>
                      ))
                    : <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No skills detected.</p>
                  }
                </div>
              </div>

              {/* Predictions */}
              <div style={s.card}>
                <h3 style={s.cardTitle}> Predicted Careers</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {predictions.map((item, idx) => {
                    const c = getBadgeColor(item.probability);
                    return (
                      <div key={idx} style={s.predCard}>
                        <div style={s.predRank}>#{idx + 1}</div>
                        <div style={{ flex: 1 }}>
                          <div style={s.predRole}>{item.role}</div>
                          <div style={s.barBg}>
                            <div style={{
                              ...s.barFill,
                              width: `${Math.min(item.probability, 100)}%`,
                              backgroundColor: c.text,
                            }} />
                          </div>
                        </div>
                        <span style={{ ...s.probBadge, backgroundColor: c.bg, color: c.text }}>
                          {item.probability}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// ── STYLES ─────────────────────────────────────────────────
const s = {
  page: {
    minHeight: '100vh', backgroundColor: '#0f172a',
    color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 32px', backgroundColor: '#1e293b',
    borderBottom: '1px solid #334155', position: 'sticky', top: 0, zIndex: 100,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '14px' },
  logo: { fontSize: '2rem' },
  logoTitle: { fontSize: '1.25rem', fontWeight: '800', color: '#fff' },
  logoSub: { fontSize: '0.75rem', color: '#64748b' },
  loginBtn: {
    backgroundColor: '#2563eb', color: '#fff',
    padding: '9px 20px', borderRadius: '8px',
    border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem',
  },
  main: {
    display: 'flex', gap: '24px', padding: '28px 32px',
    maxWidth: '1200px', margin: '0 auto',
    flexWrap: 'wrap',
  },
  leftPanel: { flex: '1 1 420px', display: 'flex', flexDirection: 'column', gap: '20px' },
  rightPanel: { flex: '1 1 360px', display: 'flex', flexDirection: 'column', gap: '20px' },
  card: {
    backgroundColor: '#1e293b', borderRadius: '14px',
    padding: '24px', border: '1px solid #334155',
  },
  cardTitle: {
    fontSize: '1rem', fontWeight: '700', color: '#fff',
    marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px',
  },
  cardDesc: { color: '#64748b', fontSize: '0.85rem', marginBottom: '16px' },
  uploadBtn: {
    display: 'block', width: '100%', padding: '14px',
    backgroundColor: '#2563eb', color: '#fff', borderRadius: '10px',
    fontWeight: '700', cursor: 'pointer', textAlign: 'center',
    fontSize: '0.95rem', boxSizing: 'border-box',
  },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
    color: '#f87171', padding: '10px', borderRadius: '8px',
    marginBottom: '12px', fontSize: '0.82rem',
  },
  loadingBox: { textAlign: 'center', marginTop: '20px' },
  spinner: {
    width: '32px', height: '32px', margin: '0 auto',
    border: '4px solid #334155', borderTop: '4px solid #2563eb',
    borderRadius: '50%', animation: 'spin 1s linear infinite',
  },
  fileTag: {
    marginTop: '12px', padding: '8px 12px', backgroundColor: '#0f172a',
    borderRadius: '8px', fontSize: '0.82rem', color: '#94a3b8',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  resetBtn: {
    background: 'none', border: 'none', color: '#f87171',
    cursor: 'pointer', fontWeight: '700',
  },
  badge: {
    backgroundColor: 'rgba(37,99,235,0.2)', color: '#93c5fd',
    padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem',
    fontWeight: '600',
  },
  skillGrid: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  skillChip: {
    backgroundColor: 'rgba(30,58,138,0.6)', color: '#93c5fd',
    border: '1px solid rgba(59,130,246,0.4)',
    padding: '5px 12px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: '500',
  },
  predCard: {
    backgroundColor: '#0f172a', borderRadius: '10px',
    padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px',
    border: '1px solid #1e293b',
  },
  predRank: {
    backgroundColor: '#1e40af', color: '#93c5fd',
    borderRadius: '6px', padding: '4px 8px',
    fontSize: '0.8rem', fontWeight: '700', minWidth: '32px', textAlign: 'center',
  },
  predRole: { fontWeight: '600', color: '#f8fafc', marginBottom: '6px', fontSize: '0.95rem' },
  barBg: { backgroundColor: '#1e293b', borderRadius: '4px', height: '5px' },
  barFill: { height: '5px', borderRadius: '4px', transition: 'width 0.6s ease' },
  probBadge: {
    padding: '4px 10px', borderRadius: '6px',
    fontSize: '0.82rem', fontWeight: '700', whiteSpace: 'nowrap',
  },
};