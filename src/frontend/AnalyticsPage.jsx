import React, { useEffect, useMemo, useState } from 'react';

const MODEL_COLORS = {
  'Logistic Regression': '#3b82f6',
  'Random Forest': '#22c55e',
  'XGBoost': '#f97316',
};

export default function AnalyticsPage({ BACKEND_URL, resumeFile }) {
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState('');
  const [modelMetrics, setModelMetrics] = useState([]);
  const [evaluation, setEvaluation] = useState(null);
  const [tsneLoading, setTsneLoading] = useState(false);
  const [tsneError, setTsneError] = useState('');
  const [tsnePoints, setTsnePoints] = useState([]);
  const [tsneFilename, setTsneFilename] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch(`${BACKEND_URL}/model-metrics`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed to load Macro F1 scores');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setModelMetrics(Array.isArray(data?.metrics) ? data.metrics : []);
          setEvaluation(data?.evaluation || null);
        }
      })
      .catch((err) => { if (!cancelled) setMetricsError(err.message); })
      .finally(() => { if (!cancelled) setMetricsLoading(false); });
    return () => { cancelled = true; };
  }, [BACKEND_URL]);

  useEffect(() => {
    if (!resumeFile) {
      setTsnePoints([]);
      setTsneFilename('');
      setTsneError('');
      return undefined;
    }
    let cancelled = false;
    setTsneLoading(true);
    setTsneError('');
    const formData = new FormData();
    formData.append('file', resumeFile);
    fetch(`${BACKEND_URL}/resume-tsne-visualization`, { method: 'POST', body: formData })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed to generate t-SNE visualization');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setTsnePoints(Array.isArray(data?.points) ? data.points : []);
          setTsneFilename(data?.filename || resumeFile.name);
        }
      })
      .catch((err) => { if (!cancelled) setTsneError(err.message); })
      .finally(() => { if (!cancelled) setTsneLoading(false); });
    return () => { cancelled = true; };
  }, [BACKEND_URL, resumeFile]);

  const scaledPoints = useMemo(() => {
    if (!tsnePoints.length) return [];
    if (tsnePoints.length === 1) return [{ ...tsnePoints[0], sx: 340, sy: 190 }];
    const xs = tsnePoints.map((point) => point.x);
    const ys = tsnePoints.map((point) => point.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const pad = 55;
    return tsnePoints.map((point) => ({
      ...point,
      sx: pad + ((point.x - minX) / (maxX - minX || 1)) * (680 - pad * 2),
      sy: pad + ((point.y - minY) / (maxY - minY || 1)) * (380 - pad * 2),
    }));
  }, [tsnePoints]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '28px 32px', maxWidth: '1200px', margin: '0 auto' }}>
      <section style={{ backgroundColor: '#1e293b', borderRadius: '14px', padding: '24px', border: '1px solid #334155' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>Model Comparison - Macro F1</h3>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '16px' }}>Overall quality of each model on a held-out labelled test set. Higher is better.</p>
        {metricsLoading && <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Loading Macro F1 scores...</p>}
        {metricsError && <div style={{ backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', padding: '10px', borderRadius: '8px', fontSize: '0.82rem' }}>{metricsError}</div>}
        {!metricsLoading && !metricsError && modelMetrics.length > 0 && <div style={{ maxWidth: '700px' }}>
          <svg viewBox="0 0 680 360" role="img" aria-label="Macro F1 scores out of ten by model" style={{ width: '100%', height: 'auto', backgroundColor: '#0f172a', borderRadius: '10px', border: '1px solid #334155' }}>
            {[0, 2, 4, 6, 8, 10].map((tick) => {
              const y = 290 - tick * 24;
              return <g key={tick}><line x1="58" x2="650" y1={y} y2={y} stroke="#334155" strokeDasharray="4 4" /><text x="45" y={y + 4} fill="#94a3b8" fontSize="12" textAnchor="end">{tick}</text></g>;
            })}
            <text x="18" y="175" fill="#94a3b8" fontSize="12" textAnchor="middle" transform="rotate(-90 18 175)">Macro F1 / 10</text>
            {modelMetrics.map((metric, index) => {
              const score = Math.min(Math.max(Number(metric.score_out_of_10), 0), 10);
              const x = 115 + index * 180, height = score * 24, y = 290 - height;
              return <g key={metric.model}><rect x={x} y={y} width="100" height={height} rx="7" fill={MODEL_COLORS[metric.model] || '#64748b'}><title>{`${metric.model}: ${score.toFixed(1)} / 10.0`}</title></rect><text x={x + 50} y={y - 10} fill="#fff" fontSize="16" fontWeight="700" textAnchor="middle">{score.toFixed(1)}</text><text x={x + 50} y="315" fill="#cbd5e1" fontSize="12" textAnchor="middle">{metric.model}</text></g>;
            })}
            <line x1="58" x2="650" y1="290" y2="290" stroke="#64748b" />
          </svg>
          {evaluation && <p style={{ color: '#64748b', fontSize: '0.76rem', margin: '10px 0 0' }}>Evaluated on {evaluation.test_rows} held-out rows from {evaluation.dataset_rows} labelled profiles (20% test split, random state {evaluation.random_state}).</p>}
        </div>}
      </section>

      <section style={{ backgroundColor: '#1e293b', borderRadius: '14px', padding: '24px', border: '1px solid #334155' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>t-SNE Visualization - Submitted Resume Skills</h3>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '16px' }}>This visualization is generated from the skills detected in your submitted resume, so it changes when you submit a different resume.</p>
        {!resumeFile && <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Upload a resume on the main page to generate its t-SNE visualization.</p>}
        {tsneLoading && <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Extracting resume skills and generating t-SNE...</p>}
        {tsneError && <div style={{ backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', padding: '10px', borderRadius: '8px', fontSize: '0.82rem' }}>{tsneError}</div>}
        {!tsneLoading && !tsneError && resumeFile && scaledPoints.length === 0 && <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No supported technical skills were detected in this resume.</p>}
        {!tsneLoading && !tsneError && scaledPoints.length > 0 && <div>
          <p style={{ color: '#64748b', fontSize: '0.78rem', margin: '0 0 10px' }}>Skills from: <b style={{ color: '#cbd5e1' }}>{tsneFilename}</b></p>
          <svg viewBox="0 0 680 380" role="img" aria-label="t-SNE embedding of skills extracted from the submitted resume" style={{ width: '100%', maxWidth: '680px', height: 'auto', backgroundColor: '#0f172a', borderRadius: '10px', border: '1px solid #334155' }}>
            {scaledPoints.map((point) => <g key={point.skill}><circle cx={point.sx} cy={point.sy} r="8" fill="#22c55e" fillOpacity="0.9" stroke="#bbf7d0" strokeWidth="1"><title>{point.skill}</title></circle><text x={point.sx} y={point.sy - 14} fill="#e2e8f0" fontSize="12" textAnchor="middle">{point.skill}</text></g>)}
          </svg>
        </div>}
      </section>
    </div>
  );
}
