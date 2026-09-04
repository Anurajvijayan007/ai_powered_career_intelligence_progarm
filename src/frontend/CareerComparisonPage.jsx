import React, { useEffect, useState } from 'react';

const MODEL_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#3b82f6',
};

export default function CareerComparisonPage({ BACKEND_URL, resumeFile, predictions, onBack }) {
  const [comparisonData, setComparisonData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCareers, setSelectedCareers] = useState([]);

  useEffect(() => {
    if (!resumeFile || !predictions.length) return;
    let cancelled = false;
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', resumeFile);

    fetch(`${BACKEND_URL}/gap-report`, { method: 'POST', body: formData })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed to load comparison data');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          const reports = data?.reports || [];
          setComparisonData(reports);
          setSelectedCareers(reports.slice(0, 3));
        }
      })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [BACKEND_URL, resumeFile, predictions]);

  const getScoreColor = (val) => {
    if (val >= 70) return '#34d399';
    if (val >= 40) return '#fbbf24';
    return '#f87171';
  };

  const getPriorityColor = (p) => {
    if (p === 'high') return { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', text: '#f87171' };
    if (p === 'medium') return { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', text: '#fbbf24' };
    return { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)', text: '#60a5fa' };
  };

  if (!resumeFile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '28px 32px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#fff', fontWeight: '800', fontSize: '1.3rem' }}>Career Comparison</h2>
          <button onClick={onBack} style={{ backgroundColor: '#334155', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '0.88rem' }}>← Back to App</button>
        </div>
        <div style={{ backgroundColor: '#1e293b', borderRadius: '14px', padding: '48px 24px', border: '1px solid #334155', textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Upload a resume on the main page to compare careers side-by-side.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '28px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ color: '#fff', fontWeight: '800', fontSize: '1.3rem' }}>Career Comparison</h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>Side-by-side comparison of your top career matches</p>
        </div>
        <button onClick={onBack} style={{ backgroundColor: '#334155', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '0.88rem' }}>← Back to App</button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ width: '40px', height: '40px', margin: '0 auto', border: '4px solid #334155', borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#94a3b8', marginTop: '16px', fontSize: '0.95rem' }}>Loading career comparison...</p>
        </div>
      )}

      {error && (
        <div style={{ backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', padding: '16px', borderRadius: '10px', fontSize: '0.9rem' }}>{error}</div>
      )}

      {!loading && !error && selectedCareers.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(selectedCareers.length, 3)}, 1fr)`, gap: '20px' }}>
          {selectedCareers.map((report, idx) => {
            const overview = report.career_overview || {};
            const breakdown = report.score_breakdown || [];
            const alignment = report.skill_alignment || {};
            const priorities = report.priority_breakdown || {};
            const plan = report.improvement_plan || [];

            return (
              <div key={overview.role || idx} style={{ backgroundColor: '#1e293b', borderRadius: '14px', padding: '24px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#2563eb', fontSize: '0.72rem', fontWeight: '700', marginBottom: '4px' }}>#{idx + 1}</div>
                  <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '800', marginBottom: '8px' }}>{overview.role}</div>
                  <div style={{ color: getScoreColor(overview.combined_score || 0), fontSize: '2rem', fontWeight: '900' }}>{overview.combined_score || 0}%</div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem' }}>Overall Match</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {breakdown.map((b, i) => (
                    <div key={i} style={{ backgroundColor: '#0f172a', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                      <div style={{ color: b.color || '#94a3b8', fontSize: '0.62rem', fontWeight: '700', marginBottom: '4px' }}>{b.label}</div>
                      <div style={{ color: '#fff', fontSize: '1rem', fontWeight: '800' }}>{b.value}{b.unit}</div>
                    </div>
                  ))}
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '600' }}>Skill Alignment</span>
                    <span style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: '700' }}>{alignment.alignment_percentage || 0}%</span>
                  </div>
                  <div style={{ backgroundColor: '#0f172a', borderRadius: '4px', height: '6px' }}>
                    <div style={{ width: `${Math.min(alignment.alignment_percentage || 0, 100)}%`, height: '6px', backgroundColor: '#34d399', borderRadius: '4px' }} />
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '6px', fontWeight: '600' }}>Matched ({alignment.matched_count || 0})</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {(alignment.matched_skills || []).slice(0, 6).map((skill, i) => (
                      <span key={i} style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.35)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.68rem', fontWeight: '500' }}>{skill}</span>
                    ))}
                    {(alignment.matched_skills || []).length > 6 && (
                      <span style={{ color: '#64748b', fontSize: '0.68rem', padding: '2px 4px' }}>+{alignment.matched_skills.length - 6} more</span>
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '6px', fontWeight: '600' }}>Missing ({alignment.missing_count || 0})</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {(alignment.missing_skills || []).slice(0, 6).map((skill, i) => (
                      <span key={i} style={{ backgroundColor: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.35)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.68rem', fontWeight: '500' }}>{skill}</span>
                    ))}
                    {(alignment.missing_skills || []).length > 6 && (
                      <span style={{ color: '#64748b', fontSize: '0.68rem', padding: '2px 4px' }}>+{alignment.missing_skills.length - 6} more</span>
                    )}
                  </div>
                </div>

                {plan.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '6px', fontWeight: '600' }}>Top Priority</div>
                    {plan.slice(0, 2).map((step, i) => {
                      const pStyle = getPriorityColor(step.priority);
                      return (
                        <div key={i} style={{ backgroundColor: '#0f172a', borderRadius: '6px', padding: '8px', marginBottom: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#fff', fontSize: '0.72rem', fontWeight: '600' }}>{step.skill}</span>
                            <span style={{ color: pStyle.text, fontSize: '0.6rem', fontWeight: '700', border: `1px solid ${pStyle.border}`, padding: '1px 6px', borderRadius: '8px' }}>{step.priority.toUpperCase()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && !error && selectedCareers.length >= 2 && (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '14px', padding: '24px', border: '1px solid #334155' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>Comparison Summary</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  <th style={{ color: '#94a3b8', textAlign: 'left', padding: '10px' }}>Metric</th>
                  {selectedCareers.map((report, idx) => (
                    <th key={idx} style={{ color: '#fff', textAlign: 'center', padding: '10px' }}>{report.career_overview?.role}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ color: '#94a3b8', padding: '10px' }}>Combined Score</td>
                  {selectedCareers.map((report, idx) => (
                    <td key={idx} style={{ color: getScoreColor(report.career_overview?.combined_score || 0), textAlign: 'center', padding: '10px', fontWeight: '700' }}>{report.career_overview?.combined_score || 0}%</td>
                  ))}
                </tr>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ color: '#94a3b8', padding: '10px' }}>ML Probability</td>
                  {selectedCareers.map((report, idx) => (
                    <td key={idx} style={{ color: '#fff', textAlign: 'center', padding: '10px' }}>{report.career_overview?.ml_probability || 0}%</td>
                  ))}
                </tr>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ color: '#94a3b8', padding: '10px' }}>SBERT Similarity</td>
                  {selectedCareers.map((report, idx) => (
                    <td key={idx} style={{ color: '#fff', textAlign: 'center', padding: '10px' }}>{report.career_overview?.sbert_similarity || 0}%</td>
                  ))}
                </tr>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ color: '#94a3b8', padding: '10px' }}>Skill Alignment</td>
                  {selectedCareers.map((report, idx) => (
                    <td key={idx} style={{ color: '#34d399', textAlign: 'center', padding: '10px', fontWeight: '700' }}>{report.skill_alignment?.alignment_percentage || 0}%</td>
                  ))}
                </tr>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ color: '#94a3b8', padding: '10px' }}>Skills Matched</td>
                  {selectedCareers.map((report, idx) => (
                    <td key={idx} style={{ color: '#fff', textAlign: 'center', padding: '10px' }}>{report.skill_alignment?.matched_count || 0}</td>
                  ))}
                </tr>
                <tr>
                  <td style={{ color: '#94a3b8', padding: '10px' }}>Skills to Learn</td>
                  {selectedCareers.map((report, idx) => (
                    <td key={idx} style={{ color: '#fbbf24', textAlign: 'center', padding: '10px', fontWeight: '700' }}>{report.skill_alignment?.missing_count || 0}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
