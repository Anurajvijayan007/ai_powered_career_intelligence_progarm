import React, { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const PRIORITY_STYLES = {
  high:   { bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.4)',   text: '#f87171', label: 'HIGH' },
  medium: { bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.4)',  text: '#fbbf24', label: 'MEDIUM' },
  low:    { bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.4)',  text: '#60a5fa', label: 'LOW' },
};

function CircularProgress({ value, max = 100, size = 110, strokeWidth = 8, color = '#34d399', trackColor = '#1e293b' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value, max) / max;
  const offset = circumference - progress * circumference;
  const center = size / 2;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle cx={center} cy={center} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#fff', fontSize: '1.4rem', fontWeight: '900' }}>{Math.round(value)}%</span>
        <span style={{ color: '#64748b', fontSize: '0.6rem', fontWeight: '600', marginTop: '2px' }}>ALIGNMENT</span>
      </div>
    </div>
  );
}

function SkillBadge({ skill, type = 'matched' }) {
  const isMatched = type === 'matched';
  const bg = isMatched ? 'rgba(16,185,129,0.15)' : 'rgba(251,191,36,0.15)';
  const border = isMatched ? 'rgba(16,185,129,0.35)' : 'rgba(251,191,36,0.35)';
  const text = isMatched ? '#34d399' : '#fbbf24';
  return (
    <span style={{ backgroundColor: bg, color: text, border: `1px solid ${border}`, padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '500' }}>{skill}</span>
  );
}

function PriorityBadge({ priority }) {
  const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.low;
  return (
    <span style={{ color: style.text, fontSize: '0.6rem', fontWeight: '700', border: `1px solid ${style.border}`, padding: '1px 8px', borderRadius: '8px', backgroundColor: style.bg }}>{style.label}</span>
  );
}

function ReportCard({ report, rank }) {
  const overview = report.career_overview || {};
  const alignment = report.skill_alignment || {};
  const priorities = report.priority_breakdown || {};
  const plan = report.improvement_plan || [];

  const alignmentColor = (alignment.alignment_percentage || 0) >= 70 ? '#34d399' : (alignment.alignment_percentage || 0) >= 40 ? '#fbbf24' : '#f87171';

  return (
    <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '24px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ backgroundColor: '#1e40af', color: '#93c5fd', borderRadius: '8px', padding: '6px 12px', fontSize: '0.82rem', fontWeight: '700', minWidth: '36px', textAlign: 'center' }}>#{rank}</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: '1.15rem', fontWeight: '800' }}>{overview.role}</div>
          <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '2px' }}>Overall match score</div>
        </div>
        <div style={{ color: '#34d399', fontSize: '2.2rem', fontWeight: '900', lineHeight: 1 }}>{overview.combined_score || 0}<span style={{ fontSize: '1rem', color: '#64748b' }}>%</span></div>
      </div>

      {/* Circular alignment */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <CircularProgress value={alignment.alignment_percentage || 0} color={alignmentColor} />
        <div style={{ flex: 1, minWidth: '180px' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: '600', marginBottom: '6px' }}>SCORE BREAKDOWN</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <div style={{ color: '#3b82f6', fontSize: '0.6rem', fontWeight: '700', marginBottom: '4px' }}>ML PROB</div>
              <div style={{ color: '#fff', fontSize: '0.95rem', fontWeight: '800' }}>{overview.ml_probability || 0}%</div>
            </div>
            <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <div style={{ color: '#a855f7', fontSize: '0.6rem', fontWeight: '700', marginBottom: '4px' }}>SEMANTIC</div>
              <div style={{ color: '#fff', fontSize: '0.95rem', fontWeight: '800' }}>{overview.sbert_similarity || 0}%</div>
            </div>
            <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <div style={{ color: '#2563eb', fontSize: '0.6rem', fontWeight: '700', marginBottom: '4px' }}>COMBINED</div>
              <div style={{ color: '#fff', fontSize: '0.95rem', fontWeight: '800' }}>{overview.combined_score || 0}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Matched skills */}
      <div>
        <div style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: '600', marginBottom: '8px' }}>
          MATCHED SKILLS ({alignment.matched_count || 0})
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {(alignment.matched_skills || []).length > 0
            ? alignment.matched_skills.map((skill, i) => <SkillBadge key={i} skill={skill} type="matched" />)
            : <span style={{ color: '#64748b', fontSize: '0.82rem' }}>No matched skills detected</span>}
        </div>
      </div>

      {/* Missing skills */}
      <div>
        <div style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: '600', marginBottom: '8px' }}>
          MISSING SKILLS ({alignment.missing_count || 0})
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {(alignment.missing_skills || []).length > 0
            ? alignment.missing_skills.map((skill, i) => <SkillBadge key={i} skill={skill} type="missing" />)
            : <span style={{ color: '#34d399', fontSize: '0.82rem', fontWeight: '700' }}>100% alignment — no skill gap</span>}
        </div>
      </div>

      {/* Priority breakdown */}
      {(priorities.high?.length > 0 || priorities.medium?.length > 0 || priorities.low?.length > 0) && (
        <div>
          <div style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: '600', marginBottom: '8px' }}>PRIORITY BREAKDOWN</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {['high', 'medium', 'low'].map((level) => {
              const skills = priorities[level] || [];
              const style = PRIORITY_STYLES[level];
              return (
                <div key={level} style={{ backgroundColor: '#0f172a', borderRadius: '10px', padding: '12px', border: `1px solid ${style.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <PriorityBadge priority={level} />
                    <span style={{ color: style.text, fontSize: '0.7rem', fontWeight: '700' }}>{skills.length} skill{skills.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {skills.length > 0 ? skills.map((skill, i) => (
                      <div key={i} style={{ color: '#cbd5e1', fontSize: '0.72rem', fontWeight: '500' }}>{skill}</div>
                    )) : <div style={{ color: '#64748b', fontSize: '0.72rem' }}>None</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Improvement plan */}
      {plan.length > 0 && (
        <div>
          <div style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: '600', marginBottom: '10px' }}>LEARNING PLAN</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {plan.map((step, i) => {
              const pStyle = PRIORITY_STYLES[step.priority] || PRIORITY_STYLES.low;
              return (
                <div key={i} style={{ backgroundColor: '#0f172a', borderRadius: '10px', padding: '14px', border: `1px solid ${pStyle.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#fff', fontSize: '0.82rem', fontWeight: '700' }}>{step.skill}</span>
                      <PriorityBadge priority={step.priority} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                      <span style={{ color: '#64748b', fontWeight: '600' }}>Resource: </span>
                      <a href={step.resource_url} target="_blank" rel="noreferrer" style={{ color: '#93c5fd', textDecoration: 'none' }}>{step.recommended_resource}</a>
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.72rem' }}>
                      <span style={{ color: '#64748b', fontWeight: '600' }}>Task: </span>
                      {step.practice_task}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GapReportPage({ BACKEND_URL, resumeFile, onBack }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reports, setReports] = useState([]);
  const [resumeStats, setResumeStats] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const reportRef = useRef(null);

  const handleDownloadPdf = async () => {
    if (!reportRef.current || downloading) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#0f172a',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('career-gap-report.pdf');
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (!resumeFile) {
      setReports([]);
      setResumeStats(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', resumeFile);

    fetch(`${BACKEND_URL}/gap-report`, { method: 'POST', body: formData })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed to load gap report');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setReports(Array.isArray(data?.reports) ? data.reports : []);
          setResumeStats(data?.resume_stats || null);
        }
      })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [BACKEND_URL, resumeFile]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '28px 32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ color: '#fff', fontWeight: '800', fontSize: '1.3rem' }}>Skill Gap Report</h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>Detailed skill alignment and learning roadmap for your top career matches</p>
        </div>
        <button onClick={onBack} style={{ backgroundColor: '#334155', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '0.88rem' }}>← Back to App</button>
        {reports.length > 0 && (
          <button onClick={handleDownloadPdf} disabled={downloading} style={{ backgroundColor: downloading ? '#334155' : '#2563eb', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: downloading ? 'not-allowed' : 'pointer', fontSize: '0.88rem', opacity: downloading ? 0.7 : 1 }}>
            {downloading ? 'Generating PDF...' : 'Download PDF'}
          </button>
        )}
      </div>

      {resumeStats && (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '14px', padding: '16px 20px', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.82rem', fontWeight: '600' }}>Resume Stats:</div>
          <div style={{ color: '#fff', fontSize: '0.82rem', fontWeight: '600' }}>{resumeStats.total_skills_detected} skills detected</div>
          <div style={{ color: '#64748b', fontSize: '0.78rem' }}>
            Top skills: {resumeStats.top_skills?.slice(0, 5).join(', ')}{resumeStats.top_skills?.length > 5 ? '...' : ''}
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ width: '40px', height: '40px', margin: '0 auto', border: '4px solid #334155', borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#94a3b8', marginTop: '16px', fontSize: '0.95rem' }}>Analyzing skill gaps...</p>
        </div>
      )}

      {error && (
        <div style={{ backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', padding: '16px', borderRadius: '10px', fontSize: '0.9rem' }}>{error}</div>
      )}

      {!loading && !error && reports.length === 0 && (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '14px', padding: '48px 24px', border: '1px solid #334155', textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Upload a resume on the main page to generate a skill gap report.</p>
        </div>
      )}

      {!loading && !error && reports.length > 0 && (
        <div ref={reportRef} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {reports.map((report, idx) => (
            <ReportCard key={report.career_overview?.role || idx} report={report} rank={idx + 1} />
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
