import React, { useEffect, useState } from 'react';
import AnalyticsPage from './AnalyticsPage';

// NOTE: left exactly as-is per request — do not change this line.
const BACKEND_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// ── VALIDATION ─────────────────────────────────────────────
function validateProfile(form) {
  const errors = {};
  if (!form.full_name.trim()) errors.full_name = 'Full name is required';
  if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Valid email required';
  if (!form.age || form.age < 16 || form.age > 75) errors.age = 'Age must be between 16 and 75';
  if (!form.gpa || form.gpa < 0 || form.gpa > 4.0) errors.gpa = 'GPA must be between 0.0 and 4.0';
  if (form.years_experience === '' || form.years_experience < 0) errors.years_experience = 'Enter valid experience (0 or more)';
  if (!form.degree_level) errors.degree_level = 'Select a degree level';
  if (!form.field_of_study) errors.field_of_study = 'Select a field of study';
  const skillsSelected = [...TECH_SKILLS, ...PROFESSIONAL_SKILLS].some(s => form[s.key] === 1);
  if (!skillsSelected) errors.skills = 'Select at least one computer or professional skill';
  return errors;
}

const TECH_SKILLS = [
  { key: 'python', label: 'Python' },
  { key: 'java', label: 'Java' },
  { key: 'c_cpp', label: 'C / C++' },
  { key: 'sql', label: 'SQL' },
  { key: 'machine_learning', label: 'Machine Learning' },
  { key: 'data_analysis', label: 'Data Analysis' },
  { key: 'cloud_computing', label: 'Cloud Computing' },
  { key: 'cybersecurity', label: 'Cybersecurity' },
  { key: 'web_development', label: 'Web Development' },
  { key: 'devops', label: 'DevOps' },
  { key: 'networking', label: 'Networking' },
];

const PROFESSIONAL_SKILLS = [
  { key: 'financial_analysis', label: 'Financial Analysis' },
  { key: 'project_management', label: 'Project Management' },
  { key: 'digital_marketing', label: 'Digital Marketing' },
  { key: 'graphic_design', label: 'Graphic Design' },
  { key: 'accounting', label: 'Accounting' },
  { key: 'sales_strategy', label: 'Sales Strategy' },
  { key: 'healthcare_administration', label: 'Healthcare Administration' },
  { key: 'content_writing', label: 'Content Writing' },
];

const SOFT_SKILLS = [
  { key: 'communication', label: 'Communication' },
  { key: 'leadership', label: 'Leadership' },
  { key: 'problem_solving', label: 'Problem Solving' },
  { key: 'teamwork', label: 'Teamwork' },
  { key: 'adaptability', label: 'Adaptability' },
];

const DEGREES = ['Bachelor', 'Master', 'PhD', 'Associate'];
const FIELDS = [
  'Computer Science', 'Data Science', 'Information Technology',
  'Software Engineering', 'Cybersecurity', 'Artificial Intelligence',
  'Electronics', 'Electrical Engineering', 'Finance', 'Business Administration',
  'Marketing', 'Design', 'Healthcare', 'Biotechnology', 'Engineering', 'Other'
];

// ── LOGIN MODAL ─────────────────────────────────────────────
function LoginModal({ onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!username || !password) { setError('Please fill in both fields.'); return; }
    if (username === 'admin' && password === 'admin123') {
      onLoginSuccess();
      onClose();
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '36px', width: '360px', border: '1px solid #334155', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '14px', right: '16px', background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
        <h2 style={{ color: '#fff', marginBottom: '8px', textAlign: 'center' }}>Login</h2>
        <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '16px', textAlign: 'center' }}>
          Demo: username <b>admin</b> / password <b>admin123</b>
        </p>
        {error && <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</p>}
        <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '4px' }}>Username</label>
        <input
          style={{ width: '100%', padding: '10px', marginBottom: '14px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', boxSizing: 'border-box' }}
          value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username"
        />
        <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '4px' }}>Password</label>
        <input
          style={{ width: '100%', padding: '10px', marginBottom: '14px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', boxSizing: 'border-box' }}
          type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password"
        />
        <button onClick={handleLogin} style={{ width: '100%', padding: '11px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', marginBottom: '8px' }}>Login</button>
        <button onClick={onClose} style={{ width: '100%', padding: '11px', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  );
}

// ── PROFILE FORM MODAL ─────────────────────────────────────
function ProfileFormModal({ onClose, onSubmit }) {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    full_name: '', email: '', age: '', gender: 'Male',
    degree_level: '', field_of_study: '', gpa: '', years_experience: '',
    python: 0, java: 0, c_cpp: 0, sql: 0, machine_learning: 0,
    data_analysis: 0, cloud_computing: 0, cybersecurity: 0,
    web_development: 0, devops: 0, networking: 0,
    financial_analysis: 0, project_management: 0, digital_marketing: 0,
    graphic_design: 0, accounting: 0, sales_strategy: 0,
    healthcare_administration: 0, content_writing: 0,
    communication: 3, leadership: 3, problem_solving: 3,
    teamwork: 3, adaptability: 3,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const toggleSkill = (key) => {
    setForm(prev => ({ ...prev, [key]: prev[key] === 1 ? 0 : 1 }));
    if (errors.skills) setErrors(prev => ({ ...prev, skills: '' }));
  };

  const nextStep = () => {
    const allErrors = validateProfile(form);
    // Step 1: validate personal info
    if (step === 1) {
      const step1Keys = ['full_name', 'email', 'age', 'degree_level', 'field_of_study', 'gpa', 'years_experience'];
      const step1Errors = Object.fromEntries(Object.entries(allErrors).filter(([k]) => step1Keys.includes(k)));
      if (Object.keys(step1Errors).length > 0) { setErrors(step1Errors); return; }
    }
    // Step 2: validate skills
    if (step === 2) {
      if (allErrors.skills) { setErrors({ skills: allErrors.skills }); return; }
    }
    setStep(prev => prev + 1);
  };

  const handleSubmit = () => {
    onSubmit(form);
    onClose();
  };

  const inputStyle = (err) => ({
    width: '100%', padding: '10px 12px', borderRadius: '8px',
    border: `1px solid ${err ? '#f87171' : '#334155'}`,
    backgroundColor: '#0f172a', color: '#fff', fontSize: '0.92rem',
    boxSizing: 'border-box', outline: 'none',
  });

  const labelStyle = { display: 'block', color: '#94a3b8', fontSize: '0.82rem', marginBottom: '5px', fontWeight: '600' };
  const errStyle = { color: '#f87171', fontSize: '0.78rem', marginTop: '3px' };
  const fieldBox = { marginBottom: '14px' };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px', boxSizing: 'border-box' }}>
      <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #334155', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #334155', position: 'sticky', top: 0, backgroundColor: '#1e293b', zIndex: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#fff', fontWeight: '800', fontSize: '1.1rem' }}>User Profile</div>
              <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '2px' }}>Step {step} of 3</div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '1.3rem', cursor: 'pointer' }}>✕</button>
          </div>
          {/* Progress bar */}
          <div style={{ marginTop: '12px', backgroundColor: '#0f172a', borderRadius: '4px', height: '5px' }}>
            <div style={{ width: `${(step / 3) * 100}%`, height: '5px', backgroundColor: '#2563eb', borderRadius: '4px', transition: 'width 0.3s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            {['Personal Info', 'Skills', 'Confirm'].map((label, i) => (
              <span key={i} style={{ fontSize: '0.72rem', color: step > i ? '#2563eb' : '#475569', fontWeight: step === i + 1 ? '700' : '400' }}>{label}</span>
            ))}
          </div>
        </div>

        <div style={{ padding: '20px 24px' }}>

          {/* ── STEP 1: PERSONAL INFO ── */}
          {step === 1 && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <div style={fieldBox}>
                  <label style={labelStyle}>Full Name *</label>
                  <input style={inputStyle(errors.full_name)} name="full_name"  value={form.full_name} onChange={handleChange} />
                  {errors.full_name && <div style={errStyle}>{errors.full_name}</div>}
                </div>
                <div style={fieldBox}>
                  <label style={labelStyle}>Email *</label>
                  <input style={inputStyle(errors.email)} name="email" type="email"value={form.email} onChange={handleChange} />
                  {errors.email && <div style={errStyle}>{errors.email}</div>}
                </div>
                <div style={fieldBox}>
                  <label style={labelStyle}>Age *</label>
                  <input style={inputStyle(errors.age)} name="age" type="number" min="16" max="75"  value={form.age} onChange={handleChange} />
                  {errors.age && <div style={errStyle}>{errors.age}</div>}
                </div>
                <div style={fieldBox}>
                  <label style={labelStyle}>Gender</label>
                  <select style={inputStyle()} name="gender" value={form.gender} onChange={handleChange}>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div style={fieldBox}>
                  <label style={labelStyle}>Degree Level *</label>
                  <select style={inputStyle(errors.degree_level)} name="degree_level" value={form.degree_level} onChange={handleChange}>
                    <option value="">-- Select --</option>
                    {DEGREES.map(d => <option key={d}>{d}</option>)}
                  </select>
                  {errors.degree_level && <div style={errStyle}>{errors.degree_level}</div>}
                </div>
                <div style={fieldBox}>
                  <label style={labelStyle}>Field of Study *</label>
                  <select style={inputStyle(errors.field_of_study)} name="field_of_study" value={form.field_of_study} onChange={handleChange}>
                    <option value="">-- Select --</option>
                    {FIELDS.map(f => <option key={f}>{f}</option>)}
                  </select>
                  {errors.field_of_study && <div style={errStyle}>{errors.field_of_study}</div>}
                </div>
                <div style={fieldBox}>
                  <label style={labelStyle}>GPA (0.0 – 4.0) *</label>
                  <input style={inputStyle(errors.gpa)} name="gpa" type="number" step="0.01" min="0" max="4"  value={form.gpa} onChange={handleChange} />
                  {errors.gpa && <div style={errStyle}>{errors.gpa}</div>}
                </div>
                <div style={fieldBox}>
                  <label style={labelStyle}>Years of Experience *</label>
                  <input style={inputStyle(errors.years_experience)} name="years_experience" type="number" min="0"  value={form.years_experience} onChange={handleChange} />
                  {errors.years_experience && <div style={errStyle}>{errors.years_experience}</div>}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: SKILLS ── */}
          {step === 2 && (
            <div>
              <div style={{ marginBottom: '18px' }}>
                <div style={{ color: '#fff', fontWeight: '700', marginBottom: '6px', fontSize: '0.95rem' }}>Computer Skills</div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '12px' }}>Select all that apply</div>
                {errors.skills && <div style={{ ...errStyle, marginBottom: '10px', padding: '8px', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.3)' }}>{errors.skills}</div>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {TECH_SKILLS.map(skill => (
                    <button key={skill.key} onClick={() => toggleSkill(skill.key)}
                      style={{
                        padding: '7px 14px', borderRadius: '20px', border: '1px solid',
                        borderColor: form[skill.key] ? '#2563eb' : '#334155',
                        backgroundColor: form[skill.key] ? '#2563eb' : 'transparent',
                        color: form[skill.key] ? '#fff' : '#94a3b8',
                        fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s'
                      }}>
                      {form[skill.key] ? '✓ ' : ''}{skill.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '18px', borderTop: '1px solid #334155', paddingTop: '18px' }}>
                <div style={{ color: '#fff', fontWeight: '700', marginBottom: '6px', fontSize: '0.95rem' }}>Professional & Non-Computer Skills</div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '12px' }}>Select the professional skills you have. Choose at least one skill from either section.</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {PROFESSIONAL_SKILLS.map(skill => (
                    <button key={skill.key} type="button" onClick={() => toggleSkill(skill.key)}
                      style={{
                        padding: '7px 14px', borderRadius: '20px', border: '1px solid',
                        borderColor: form[skill.key] ? '#a855f7' : '#334155',
                        backgroundColor: form[skill.key] ? '#7e22ce' : 'transparent',
                        color: form[skill.key] ? '#fff' : '#94a3b8',
                        fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s'
                      }}>
                      {form[skill.key] ? '✓ ' : ''}{skill.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid #334155', paddingTop: '18px' }}>
                <div style={{ color: '#fff', fontWeight: '700', marginBottom: '6px', fontSize: '0.95rem' }}>Soft Skills</div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '14px' }}>Rate your proficiency (1 = Low, 5 = High)</div>
                {SOFT_SKILLS.map(skill => (
                  <div key={skill.key} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', gap: '12px' }}>
                    <label style={{ width: '130px', color: '#94a3b8', fontSize: '0.84rem', flexShrink: 0 }}>{skill.label}</label>
                    <input type="range" min="1" max="5" name={skill.key} value={form[skill.key]} onChange={handleChange}
                      style={{ flex: 1, accentColor: '#2563eb' }} />
                    <span style={{ width: '20px', textAlign: 'center', color: '#2563eb', fontWeight: '700', fontSize: '0.9rem' }}>{form[skill.key]}</span>
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {[1,2,3,4,5].map(n => (
                        <div key={n} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: n <= form[skill.key] ? '#2563eb' : '#1e293b', border: '1px solid #334155' }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 3: CONFIRM ── */}
          {step === 3 && (
            <div>
              <div style={{ backgroundColor: '#0f172a', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ color: '#2563eb', fontWeight: '700', marginBottom: '12px', fontSize: '0.88rem' }}>PERSONAL INFORMATION</div>
                {[
                  ['Full Name', form.full_name],
                  ['Email', form.email],
                  ['Age', form.age],
                  ['Gender', form.gender],
                  ['Degree', form.degree_level],
                  ['Field', form.field_of_study],
                  ['GPA', form.gpa],
                  ['Experience', `${form.years_experience} years`],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1e293b' }}>
                    <span style={{ color: '#64748b', fontSize: '0.82rem' }}>{label}</span>
                    <span style={{ color: '#fff', fontSize: '0.82rem', fontWeight: '600' }}>{value}</span>
                  </div>
                ))}
              </div>

              <div style={{ backgroundColor: '#0f172a', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ color: '#2563eb', fontWeight: '700', marginBottom: '10px', fontSize: '0.88rem' }}>TECHNICAL SKILLS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {TECH_SKILLS.filter(s => form[s.key] === 1).map(s => (
                    <span key={s.key} style={{ backgroundColor: '#2563eb', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: '600' }}>{s.label}</span>
                  ))}
                  {TECH_SKILLS.filter(s => form[s.key] === 1).length === 0 && <span style={{ color: '#64748b', fontSize: '0.82rem' }}>None selected</span>}
                </div>
              </div>

              <div style={{ backgroundColor: '#0f172a', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ color: '#a855f7', fontWeight: '700', marginBottom: '10px', fontSize: '0.88rem' }}>PROFESSIONAL SKILLS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {PROFESSIONAL_SKILLS.filter(s => form[s.key] === 1).map(s => (
                    <span key={s.key} style={{ backgroundColor: '#7e22ce', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: '600' }}>{s.label}</span>
                  ))}
                  {PROFESSIONAL_SKILLS.filter(s => form[s.key] === 1).length === 0 && <span style={{ color: '#64748b', fontSize: '0.82rem' }}>None selected</span>}
                </div>
              </div>

              <div style={{ backgroundColor: '#0f172a', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ color: '#2563eb', fontWeight: '700', marginBottom: '10px', fontSize: '0.88rem' }}>SOFT SKILLS</div>
                {SOFT_SKILLS.map(s => (
                  <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' }}>
                    <span style={{ color: '#64748b', fontSize: '0.82rem' }}>{s.label}</span>
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {[1,2,3,4,5].map(n => (
                        <div key={n} style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: n <= form[s.key] ? '#2563eb' : '#334155' }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ backgroundColor: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: '8px', padding: '12px', marginBottom: '4px' }}>
                <div style={{ color: '#93c5fd', fontSize: '0.82rem' }}>Profile validated! Click <strong>Submit Profile</strong> to get your career predictions.</div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)}
                style={{ flex: 1, padding: '11px', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.92rem' }}>
                ← Back
              </button>
            )}
            {step < 3 && (
              <button onClick={nextStep}
                style={{ flex: 1, padding: '11px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.92rem' }}>
                Next →
              </button>
            )}
            {step === 3 && (
              <button onClick={handleSubmit}
                style={{ flex: 1, padding: '11px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.92rem' }}>
                Submit Profile & Predict
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── NER HIGHLIGHTER ────────────────────────────────────────
function HighlightedText({ text, highlights }) {
  if (!text || !highlights || highlights.length === 0) {
    return <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{text}</p>;
  }
  const colorMap = {
    skill:     { bg: 'rgba(59,130,246,0.3)', border: '#3b82f6', label: 'SKILL' },
    role:      { bg: 'rgba(34,197,94,0.3)',  border: '#22c55e', label: 'ROLE' },
    education: { bg: 'rgba(234,179,8,0.3)',  border: '#eab308', label: 'EDU' },
  };
  const parts = [];
  let last = 0;
  highlights.forEach((h) => {
    if (h.start > last) parts.push({ type: 'text', content: text.slice(last, h.start) });
    parts.push({ type: 'highlight', content: text.slice(h.start, h.end), htype: h.type });
    last = h.end;
  });
  if (last < text.length) parts.push({ type: 'text', content: text.slice(last) });
  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
        {Object.entries(colorMap).map(([type, style]) => (
          <span key={type} style={{ padding: '3px 10px', borderRadius: '12px', border: `1px solid ${style.border}`, backgroundColor: style.bg, fontSize: '0.72rem', fontWeight: '700', color: '#fff' }}>{style.label}</span>
        ))}
      </div>
      <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', padding: '14px', fontSize: '0.82rem', lineHeight: '1.8', color: '#cbd5e1', maxHeight: '280px', overflowY: 'auto', whiteSpace: 'pre-wrap', border: '1px solid #1e293b' }}>
        {parts.map((p, i) =>
          p.type === 'text'
            ? <span key={i}>{p.content}</span>
            : <mark key={i} style={{ backgroundColor: colorMap[p.htype]?.bg, border: `1px solid ${colorMap[p.htype]?.border}`, borderRadius: '4px', padding: '1px 3px', color: '#fff', fontWeight: '600' }}>{p.content}</mark>
        )}
      </div>
    </div>
  );
}

// ── SKILL ALIGNMENT DETAIL (new) ────────────────────────────
// Renders matched skills, missing skills, alignment %, and the
// ML-probability-vs-combined-score breakdown for one career card.
function PredictionDetail({ item }) {
  const hasMl = typeof item.ml_probability === 'number';
  const hasSbert = typeof item.sbert_similarity === 'number';
  const hasCombined = typeof item.combined_score === 'number';
  const hasAlignment = typeof item.alignment_score === 'number';
  const hasMatched = Array.isArray(item.matched_skills) && item.matched_skills.length > 0;
  const hasMissing = Array.isArray(item.missing_skills) && item.missing_skills.length > 0;
  const [showSkillGap, setShowSkillGap] = useState(false);

  if (!hasMl && !hasAlignment && !hasMatched && !hasMissing) return null;

  return (
    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #1e293b' }}>
      {/* Score breakdown: ML vs SBERT vs Combined */}
      {(hasMl || hasSbert || hasCombined) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '8px', fontSize: '0.72rem', color: '#94a3b8' }}>
          {hasMl && <span>ML: <b style={{ color: '#cbd5e1' }}>{item.ml_probability}%</b></span>}
          {hasSbert && <span>Semantic match: <b style={{ color: '#cbd5e1' }}>{item.sbert_similarity}%</b></span>}
          {hasCombined && <span>Combined: <b style={{ color: '#93c5fd' }}>{item.combined_score}%</b></span>}
        </div>
      )}

      {/* Skill alignment bar */}
      {hasAlignment && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Skill alignment</span>
            <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: '700' }}>{item.alignment_score}%</span>
          </div>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '4px', height: '4px' }}>
            <div style={{ width: `${Math.min(item.alignment_score, 100)}%`, height: '4px', backgroundColor: '#34d399', borderRadius: '4px', transition: 'width 0.6s ease' }} />
          </div>
        </div>
      )}

      {/* Matched skills */}
      {hasMatched && (
        <div style={{ marginBottom: hasMissing ? '6px' : 0 }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b', marginRight: '6px' }}>Matched:</span>
          <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '5px', marginTop: '4px' }}>
            {item.matched_skills.map((skill, i) => (
              <span key={i} style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.35)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '500' }}>
                {skill}
              </span>
            ))}
          </span>
        </div>
      )}

      {hasMissing && (
        <div style={{ marginTop: '10px' }}>
          <button
            type="button"
            onClick={() => setShowSkillGap((shown) => !shown)}
            style={{ backgroundColor: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: '7px', color: '#fbbf24', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700', padding: '7px 10px' }}
          >
            {showSkillGap ? 'Hide skill gap' : `View skill gap (${item.missing_skills.length} skills)`}
          </button>
          {showSkillGap && (
            <div style={{ marginTop: '8px', padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.25)' }}>
              <div style={{ color: '#fef3c7', fontSize: '0.76rem', fontWeight: '700', marginBottom: '7px' }}>Skills needed for 100% alignment</div>
              <div style={{ color: '#94a3b8', fontSize: '0.72rem', marginBottom: '8px' }}>Build all of these skills to close this career's identified skill gap.</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {item.missing_skills.map((skill, i) => (
                  <span key={i} style={{ backgroundColor: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.35)', padding: '3px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '500' }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {hasAlignment && !hasMissing && item.alignment_score >= 100 && (
        <div style={{ marginTop: '9px', color: '#34d399', fontSize: '0.74rem', fontWeight: '700' }}>No skill gap - this career is already at 100% alignment.</div>
      )}
    </div>
  );
}

// ── CAREER REPORTS PAGE ─────────────────────────────────────
function CareerReportBlock({ report, index }) {
  const overview = report?.career_overview || {};
  const breakdown = report?.score_breakdown || [];
  const alignment = report?.skill_alignment || {};
  const priorities = report?.priority_breakdown || {};
  const plan = report?.improvement_plan || [];

  const getScoreColor = (val) => {
    if (val >= 70) return '#34d399';
    if (val >= 40) return '#fbbf24';
    return '#f87171';
  };

  const getPriorityStyle = (p) => {
    if (p === 'high') return { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', text: '#f87171', label: 'HIGH' };
    if (p === 'medium') return { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', text: '#fbbf24', label: 'MEDIUM' };
    return { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)', text: '#60a5fa', label: 'LOW' };
  };

  return (
    <div style={{ backgroundColor: '#1e293b', borderRadius: '14px', padding: '24px', border: '1px solid #334155' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ color: '#2563eb', fontSize: '0.78rem', fontWeight: '700', marginBottom: '4px' }}>#{index + 1} TARGET ROLE</div>
          <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '800' }}>{overview.role}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: getScoreColor(overview.combined_score || overview.career_probability || 0), fontSize: '1.8rem', fontWeight: '900' }}>{overview.combined_score || overview.career_probability || 0}%</div>
          <div style={{ color: '#64748b', fontSize: '0.78rem' }}>Overall Match</div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: '700', marginBottom: '10px' }}>SCORE BREAKDOWN</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {breakdown.map((b, i) => (
            <div key={i} style={{ backgroundColor: '#0f172a', borderRadius: '8px', padding: '12px', textAlign: 'center', border: '1px solid #1e293b' }}>
              <div style={{ color: b.color || '#94a3b8', fontSize: '0.68rem', fontWeight: '700', marginBottom: '4px' }}>{b.label}</div>
              <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '800' }}>{b.value}{b.unit}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Skill Alignment */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '700' }}>SKILL ALIGNMENT</span>
          <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: '700' }}>{alignment.alignment_percentage || 0}%</span>
        </div>
        <div style={{ backgroundColor: '#1e293b', borderRadius: '4px', height: '6px', marginBottom: '10px' }}>
          <div style={{ width: `${Math.min(alignment.alignment_percentage || 0, 100)}%`, height: '6px', backgroundColor: '#34d399', borderRadius: '4px', transition: 'width 0.6s ease' }} />
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '0.82rem', color: '#64748b', marginBottom: '10px' }}>
          <span><b style={{ color: '#34d399' }}>{alignment.matched_count || 0}</b> matched</span>
          <span><b style={{ color: '#fbbf24' }}>{alignment.missing_count || 0}</b> missing</span>
        </div>
        {alignment.matched_skills?.length > 0 && (
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '6px', fontWeight: '600' }}>Matched Skills</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {alignment.matched_skills.map((skill, i) => (
                <span key={i} style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.35)', padding: '3px 10px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '500' }}>{skill}</span>
              ))}
            </div>
          </div>
        )}
        {alignment.missing_skills?.length > 0 && (
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '6px', fontWeight: '600' }}>Missing Skills</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {alignment.missing_skills.map((skill, i) => (
                <span key={i} style={{ backgroundColor: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.35)', padding: '3px 10px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '500' }}>{skill}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Priority Breakdown */}
      {(priorities.high?.length > 0 || priorities.medium?.length > 0 || priorities.low?.length > 0) && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: '700', marginBottom: '10px' }}>PRIORITY BREAKDOWN</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {['high', 'medium', 'low'].map((level) => {
              const skills = priorities[level] || [];
              if (skills.length === 0) return null;
              const style = getPriorityStyle(level);
              return (
                <div key={level} style={{ backgroundColor: style.bg, border: `1px solid ${style.border}`, borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ color: style.text, fontSize: '0.68rem', fontWeight: '700', marginBottom: '4px' }}>{style.label} PRIORITY ({skills.length})</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {skills.map((skill, i) => (
                      <span key={i} style={{ color: style.text, border: `1px solid ${style.border}`, padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '500' }}>{skill}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Improvement Plan */}
      {plan.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: '700', marginBottom: '10px' }}>IMPROVEMENT PLAN</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {plan.map((step, i) => {
              const pStyle = getPriorityStyle(step.priority);
              return (
                <div key={i} style={{ backgroundColor: '#0f172a', borderRadius: '8px', padding: '12px', border: '1px solid #1e293b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '700' }}>{i + 1}. {step.skill}</span>
                    <span style={{ color: pStyle.text, border: `1px solid ${pStyle.border}`, padding: '2px 8px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: '700', backgroundColor: pStyle.bg }}>{pStyle.label}</span>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginBottom: '4px' }}>
                    Resource: <a href={step.resource_url} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'none' }}>{step.recommended_resource}</a>
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.78rem', fontStyle: 'italic' }}>{step.practice_task}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CareerReportsPage({ loading, data, error, onBack }) {
  const reports = data?.reports || [];
  const stats = data?.resume_stats || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '28px 32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#fff', fontWeight: '800', fontSize: '1.3rem' }}>Career Gap Reports</div>
          <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>Detailed skill-gap analysis for your top {Math.min(reports.length, 3)} predicted careers</div>
        </div>
        <button onClick={onBack} style={{ backgroundColor: '#334155', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '0.88rem' }}>
          ← Back to Predictions
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ width: '40px', height: '40px', margin: '0 auto', border: '4px solid #334155', borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#94a3b8', marginTop: '16px', fontSize: '0.95rem' }}>Generating career gap reports...</p>
        </div>
      )}

      {error && !loading && (
        <div style={{ backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', padding: '16px', borderRadius: '10px', fontSize: '0.9rem' }}>{error}</div>
      )}

      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {reports.map((report, idx) => (
            <CareerReportBlock key={report.career_overview?.role || idx} report={report} index={idx} />
          ))}

          {/* Resume Stats */}
          <div style={{ backgroundColor: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: '10px', padding: '16px' }}>
            <div style={{ color: '#93c5fd', fontSize: '0.78rem', fontWeight: '700', marginBottom: '6px' }}>RESUME INSIGHTS</div>
            <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              <span style={{ color: '#fff', fontWeight: '700' }}>{stats.total_skills_detected || 0}</span> skills detected from resume
              {stats.top_skills?.length > 0 && (
                <span style={{ marginLeft: '10px' }}>Top: <b style={{ color: '#cbd5e1' }}>{stats.top_skills.slice(0, 5).join(', ')}</b></span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ───────────────────────────────────────────────
export default function App() {
  const [page, setPage]                       = useState('main'); // 'main' | 'analytics' | 'reports'
  const [isLoggedIn, setIsLoggedIn]           = useState(false);
  const [showLogin, setShowLogin]             = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [uploading, setUploading]             = useState(false);
  const [predictions, setPredictions]         = useState([]);
  const [extractedSkills, setExtractedSkills] = useState([]);
  const [filename, setFilename]               = useState('');
  const [uploadedResumeFile, setUploadedResumeFile] = useState(null);
  const [error, setError]                     = useState('');
  const [resumeText, setResumeText]           = useState('');
  const [highlights, setHighlights]           = useState([]);
  const [hasResult, setHasResult]             = useState(false);
  const [userProfile, setUserProfile]         = useState(null);
  const [activeTab, setActiveTab]             = useState('resume'); // 'resume' | 'profile'
  const [reportsLoading, setReportsLoading]   = useState(false);
  const [reportsData, setReportsData]         = useState(null);
  const [reportsError, setReportsError]       = useState('');

  useEffect(() => {
    if (page !== 'reports' || !uploadedResumeFile) return;
    let cancelled = false;
    setReportsLoading(true);
    setReportsError('');
    setReportsData(null);
    const formData = new FormData();
    formData.append('file', uploadedResumeFile);
    fetch(`${BACKEND_URL}/gap-report`, { method: 'POST', body: formData })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed to load reports');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setReportsData(data);
      })
      .catch((err) => { if (!cancelled) setReportsError(err.message); })
      .finally(() => { if (!cancelled) setReportsLoading(false); });
    return () => { cancelled = true; };
  }, [page, uploadedResumeFile, BACKEND_URL]);

   // ── PDF EXPORT ─────────────────────────────────────────────
const exportPDF = () => {
  const date = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <title>CareerCast AI - Career Prediction Report</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; padding: 40px; }
        .header { border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
        .logo { font-size: 22px; font-weight: 800; color: #1e3a8a; }
        .subtitle { font-size: 12px; color: #64748b; margin-top: 3px; }
        .meta { font-size: 11px; color: #94a3b8; margin-top: 6px; }
        h2 { font-size: 16px; color: #1e3a8a; margin: 24px 0 10px; border-left: 4px solid #2563eb; padding-left: 10px; }
        h3 { font-size: 14px; color: #2563eb; margin: 16px 0 8px; }
        .skills-grid { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
        .skill-badge { background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .career-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 14px; page-break-inside: avoid; }
        .career-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .career-rank { background: #1e40af; color: #fff; border-radius: 6px; padding: 3px 9px; font-size: 12px; font-weight: 700; }
        .career-title { font-size: 15px; font-weight: 700; color: #0f172a; }
        .score-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 10px; }
        .score-box { background: #f8fafc; border-radius: 6px; padding: 8px; text-align: center; border: 1px solid #e2e8f0; }
        .score-label { font-size: 9px; color: #94a3b8; font-weight: 600; text-transform: uppercase; }
        .score-val { font-size: 16px; font-weight: 800; margin-top: 2px; }
        .bar-row { margin-bottom: 6px; }
        .bar-label { font-size: 10px; color: #64748b; margin-bottom: 3px; font-weight: 600; }
        .bar-bg { background: #f1f5f9; border-radius: 4px; height: 8px; }
        .bar-fill { height: 8px; border-radius: 4px; }
        .skills-row { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
        .matched { background: #dcfce7; color: #166534; border: 1px solid #86efac; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; }
        .missing  { background: #fef9c3; color: #854d0e; border: 1px solid #fde047; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; }
        .summary-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
        .summary-table th { background: #1e3a8a; color: #fff; padding: 8px 10px; text-align: left; }
        .summary-table td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
        .summary-table tr:nth-child(even) td { background: #f8fafc; }
        .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
        .green { color: #16a34a; } .blue { color: #2563eb; } .purple { color: #7c3aed; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>

      <!-- HEADER -->
      <div class="header">
        <div class="logo">CareerCast AI Prediction</div>
        <div class="subtitle">Powered by SpaCy NER + Sentence-BERT + Logistic Regression</div>
        <div class="meta">Report generated: ${date} &nbsp;|&nbsp; File: ${filename || 'User Profile'} &nbsp;|&nbsp; Model: Logistic Regression (Per-label Accuracy: 95.4%)</div>
      </div>

      <!-- EXTRACTED SKILLS -->
      <h2>Extracted Skills (${extractedSkills.length} detected)</h2>
      <div class="skills-grid">
        ${extractedSkills.map(s => `<span class="skill-badge">${s}</span>`).join('')}
        ${extractedSkills.length === 0 ? '<span style="color:#94a3b8;font-size:12px">No skills detected</span>' : ''}
      </div>

      <!-- CAREER PREDICTIONS -->
      <h2>Top ${predictions.length} Career Predictions</h2>
      ${predictions.map((item, idx) => {
        const combined = item.combined || item.probability;
        const scoreColor = combined >= 70 ? '#16a34a' : combined >= 40 ? '#d97706' : '#dc2626';
        const barColor   = combined >= 70 ? '#22c55e' : combined >= 40 ? '#f59e0b' : '#ef4444';
        return `
        <div class="career-card">
          <div class="career-header">
            <div style="display:flex;align-items:center;gap:10px">
              <span class="career-rank">#${idx+1}</span>
              <span class="career-title">${item.role}</span>
            </div>
            <span style="font-size:20px;font-weight:800;color:${scoreColor}">${combined}%</span>
          </div>

          <div class="score-grid">
              <div class="score-box">
              <div class="score-label">ML Score</div>
              <div class="score-val blue">${item.ml_probability ?? combined}%</div>
            </div>
            <div class="score-box">
              <div class="score-label">SBERT Sim</div>
              <div class="score-val purple">${item.sbert_similarity ?? 0}%</div>
            </div>
            <div class="score-box">
              <div class="score-label">Combined</div>
              <div class="score-val" style="color:${scoreColor}">${combined}%</div>
            </div>
            <div class="score-box">
              <div class="score-label">Skill Align</div>
              <div class="score-val green">${item.alignment_score ?? 0}%</div>
            </div>
          </div>

          <div class="bar-row">
            <div class="bar-label">Confidence</div>
            <div class="bar-bg"><div class="bar-fill" style="width:${Math.min(combined,100)}%;background:${barColor}"></div></div>
          </div>
          <div class="bar-row">
            <div class="bar-label">Skill Alignment</div>
            <div class="bar-bg"><div class="bar-fill" style="width:${Math.min(item.alignment_score??0,100)}%;background:#22c55e"></div></div>
          </div>

          ${item.matched_skills && item.matched_skills.length > 0 ? `
          <div style="margin-top:8px">
            <div class="bar-label">Matched Skills</div>
            <div class="skills-row">${item.matched_skills.map(s=>`<span class="matched">${s}</span>`).join('')}</div>
          </div>` : ''}

          ${item.missing_skills && item.missing_skills.length > 0 ? `
          <div style="margin-top:8px">
            <div class="bar-label">Skills to Learn</div>
            <div class="skills-row">${item.missing_skills.map(s=>`<span class="missing">${s}</span>`).join('')}</div>
          </div>` : ''}
        </div>`;
      }).join('')}

      <!-- SKILL GAP SUMMARY TABLE -->
      <h2>Skill Gap Analysis Summary</h2>
      <table class="summary-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Career</th>
            <th>Combined Score</th>
            <th>Skill Alignment</th>
            <th>Matched</th>
            <th>To Learn</th>
          </tr>
        </thead>
        <tbody>
          ${predictions.map((item,idx) => `
          <tr>
            <td><strong>#${idx+1}</strong></td>
            <td><strong>${item.role}</strong></td>
            <td style="color:${(item.combined||item.probability)>=70?'#16a34a':'#d97706'};font-weight:700">${item.combined||item.probability}%</td>
            <td>${item.alignment_score ?? 0}%</td>
            <td>${(item.matched_skills||[]).join(', ') || '-'}</td>
            <td>${(item.missing_skills||[]).join(', ') || '-'}</td>
          </tr>`).join('')}
        </tbody>
      </table>

      <!-- FOOTER -->
      <div class="footer">
        <span>CareerCast AI Prediction &nbsp;|&nbsp; Anuraj Vijayan K &nbsp;|&nbsp; Amrita Vishwa Vidyapeetham</span>
        <span>${date}</span>
      </div>

    </body>
    </html>
  `;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 500);
};
  // Gate for anything that should require login before opening
  const requireLogin = (action) => {
    if (!isLoggedIn) {
      setError('Please log in to continue.');
      setShowLogin(true);
      return;
    }
    action();
  };

  // Submit profile → generate predictions from profile data
  const handleProfileSubmit = async (profileData) => {
    if (!isLoggedIn) {
      setError('Please log in to submit your profile.');
      setShowLogin(true);
      return;
    }
    setUserProfile(profileData);
    setActiveTab('profile');
    setUploading(true);
    setError('');
    setHasResult(false);

    try {
      // Build a text summary from profile to send to backend for prediction
      const skillNames = TECH_SKILLS.filter(s => profileData[s.key] === 1).map(s => s.label);
      const professionalSkillNames = PROFESSIONAL_SKILLS.filter(s => profileData[s.key] === 1).map(s => s.label);
      const softNames  = SOFT_SKILLS.map(s => `${s.label} level ${profileData[s.key]}`);

      const profileText = `
        Name: ${profileData.full_name}
        Age: ${profileData.age}
        Gender: ${profileData.gender}
        Education: ${profileData.degree_level} in ${profileData.field_of_study}
        GPA: ${profileData.gpa}
        Experience: ${profileData.years_experience} years experience
        Technical Skills: ${skillNames.join(', ')}
        Professional Skills: ${professionalSkillNames.join(', ')}
        Soft Skills: ${softNames.join(', ')}
      `.trim();

      // Convert profile text to a Blob/File for the backend
      const blob = new Blob([profileText], { type: 'text/plain' });
      const file = new File([blob], 'profile.txt', { type: 'text/plain' });

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${BACKEND_URL}/upload-resume`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Prediction failed');
      }

      const data = await response.json();
      setExtractedSkills([...skillNames, ...professionalSkillNames]); // show the selected profile skills, not NER-extracted
      setPredictions(Array.isArray(data?.predictions) ? data.predictions : []);
      setResumeText('');
      setHighlights([]);
      setUploadedResumeFile(file);
      setHasResult(true);
    } catch (err) {
      setError(`${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Upload resume → NER pipeline (requires login)
  const handleFileUpload = async (e) => {
    if (!isLoggedIn) {
      setError('Please log in to upload your resume.');
      setShowLogin(true);
      return;
    }

    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setUploading(true);
    setError('');
    setHasResult(false);
    setActiveTab('resume');
    setFilename(selectedFile.name);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`${BACKEND_URL}/upload-resume`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Upload failed');
      }
      const data = await response.json();
      let skillsArray = Array.isArray(data?.extracted_skills) ? data.extracted_skills : (data?.extracted_skills || '').split(/[\s,]+/);
      setExtractedSkills(skillsArray.filter(Boolean));
      setPredictions(Array.isArray(data?.predictions) ? data.predictions : []);
      setResumeText(data?.resume_text || '');
      setHighlights(data?.highlights || []);
      setUploadedResumeFile(selectedFile);
      setHasResult(true);
    } catch (err) {
      setError(`${err.message}. Make sure backend is running.`);
    } finally {
      setUploading(false);
    }
  };

  // Intercepts the click on the upload label BEFORE the native file picker opens
  const handleUploadLabelClick = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      setError('Please log in to upload your resume.');
      setShowLogin(true);
    }
  };

  const reset = () => {
    setPredictions([]); setExtractedSkills([]);
    setFilename(''); setError('');
    setUploadedResumeFile(null);
    setResumeText(''); setHighlights([]);
    setHasResult(false); setUserProfile(null);
  };

  // Uses combined_score when the backend provides it (SBERT-enhanced
  // response), otherwise falls back to plain probability so this still
  // works against an older backend that hasn't been redeployed yet.
  const getBadgeColor = (item) => {
    const prob = typeof item.combined_score === 'number' ? item.combined_score : item.probability;
    if (prob >= 70) return { bg: 'rgba(16,185,129,0.2)', text: '#34d399' };
    if (prob >= 40) return { bg: 'rgba(245,158,11,0.2)', text: '#fbbf24' };
    return { bg: 'rgba(239,68,68,0.2)', text: '#f87171' };
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLoginSuccess={() => { setIsLoggedIn(true); setError(''); }} />}
      {showProfileForm && <ProfileFormModal onClose={() => setShowProfileForm(false)} onSubmit={handleProfileSubmit} />}

      {/* HEADER */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px', backgroundColor: '#1e293b', borderBottom: '1px solid #334155', position: 'sticky', top: 0, zIndex: 100 }}>
        <div>
          <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff' }}>CareerCast AI Prediction</div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Powered by SpaCy NER + Logistic Regression + SBERT</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {page === 'main' ? (
            <>
              <button onClick={() => setPage('analytics')}
                style={{ backgroundColor: '#334155', color: '#fff', padding: '9px 18px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '0.88rem' }}>
                Analytics
              </button>
              <button onClick={() => setPage('reports')}
                style={{ backgroundColor: '#334155', color: '#fff', padding: '9px 18px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '0.88rem' }}>
                Report
              </button>
            </>
          ) : (
            <button onClick={() => setPage('main')}
              style={{ backgroundColor: '#334155', color: '#fff', padding: '9px 18px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '0.88rem' }}>
              ← Back to App
            </button>
          )}
          {isLoggedIn && (
            <button onClick={() => setShowProfileForm(true)}
              style={{ backgroundColor: '#334155', color: '#fff', padding: '9px 18px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '0.88rem' }}>
              Fill Profile
            </button>
          )}
          {isLoggedIn ? (
            <button onClick={() => setIsLoggedIn(false)}
              style={{ backgroundColor: '#334155', color: '#fff', padding: '9px 18px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '0.88rem' }}>
              Logout
            </button>
          ) : (
            <button onClick={() => setShowLogin(true)}
              style={{ backgroundColor: '#2563eb', color: '#fff', padding: '9px 18px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '0.88rem' }}>
              Login
            </button>
          )}
        </div>
      </header>

      {/* MAIN */}
      {page === 'reports' ? (
        <CareerReportsPage
          loading={reportsLoading}
          data={reportsData}
          error={reportsError}
          onBack={() => setPage('main')}
        />
      ) : page === 'analytics' ? (
        <AnalyticsPage BACKEND_URL={BACKEND_URL} resumeFile={uploadedResumeFile} />
      ) : (
      <main style={{ display: 'flex', gap: '24px', padding: '28px 32px', maxWidth: '1200px', margin: '0 auto', flexWrap: 'wrap' }}>

        {/* LEFT PANEL */}
        <div style={{ flex: '1 1 420px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: '8px', backgroundColor: '#1e293b', padding: '6px', borderRadius: '10px', border: '1px solid #334155' }}>
            {[
              { id: 'resume', label: 'Upload Resume' },
              { id: 'profile', label: 'User Profile' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ flex: 1, padding: '8px', borderRadius: '7px', border: 'none', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', backgroundColor: activeTab === tab.id ? '#2563eb' : 'transparent', color: activeTab === tab.id ? '#fff' : '#64748b', transition: 'all 0.2s' }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Resume Upload Tab */}
          {activeTab === 'resume' && (
            <div style={{ backgroundColor: '#1e293b', borderRadius: '14px', padding: '24px', border: '1px solid #334155' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>Upload Resume</h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '16px' }}>
                {isLoggedIn
                  ? 'Upload a PDF or TXT resume — SpaCy NER will extract skills, roles and education automatically.'
                  : 'Log in to upload a resume and get AI-powered career predictions.'}
              </p>

              {error && <div style={{ backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', padding: '10px', borderRadius: '8px', marginBottom: '12px', fontSize: '0.82rem' }}>{error}</div>}

              <label
                onClick={handleUploadLabelClick}
                style={{ display: 'block', width: '100%', padding: '14px', backgroundColor: uploading ? '#334155' : (isLoggedIn ? '#2563eb' : '#334155'), color: '#fff', borderRadius: '10px', fontWeight: '700', cursor: uploading ? 'not-allowed' : 'pointer', textAlign: 'center', fontSize: '0.95rem', boxSizing: 'border-box' }}
              >
                {uploading ? 'Analyzing...' : (isLoggedIn ? 'Choose Resume (PDF / TXT)' : 'Login to Upload Resume')}
                <input type="file" accept=".pdf,.txt" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading || !isLoggedIn} />
              </label>

              {uploading && (
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <div style={{ width: '32px', height: '32px', margin: '0 auto', border: '4px solid #334155', borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <p style={{ color: '#94a3b8', marginTop: '10px', fontSize: '0.85rem' }}>SpaCy NER extracting keywords...<br />Running AI prediction...</p>
                </div>
              )}

              {filename && !uploading && (
                <div style={{ marginTop: '12px', padding: '8px 12px', backgroundColor: '#0f172a', borderRadius: '8px', fontSize: '0.82rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {filename}
                  <button style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: '700' }} onClick={reset}>✕ Clear</button>
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div style={{ backgroundColor: '#1e293b', borderRadius: '14px', padding: '24px', border: '1px solid #334155' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>User Profile</h3>
              {userProfile ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                    {[
                      ['Name', userProfile.full_name],
                      ['Email', userProfile.email],
                      ['Age', userProfile.age],
                      ['Gender', userProfile.gender],
                      ['Degree', userProfile.degree_level],
                      ['Field', userProfile.field_of_study],
                      ['GPA', userProfile.gpa],
                      ['Experience', `${userProfile.years_experience} yrs`],
                    ].map(([label, value]) => (
                      <div key={label} style={{ backgroundColor: '#0f172a', borderRadius: '8px', padding: '8px 12px' }}>
                        <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '600' }}>{label}</div>
                        <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '600', marginTop: '2px' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => requireLogin(() => setShowProfileForm(true))}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.88rem' }}>
                    Edit Profile
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '14px' }}>
                    {isLoggedIn
                      ? 'No profile created yet.\nFill in your details to get personalized career predictions.'
                      : 'Log in to create a profile and get personalized career predictions.'}
                  </p>
                  <button onClick={() => requireLogin(() => setShowProfileForm(true))}
                    style={{ padding: '10px 24px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                    {isLoggedIn ? '+ Create Profile' : 'Login to Continue'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* NER Highlights */}
          {hasResult && resumeText && (
            <div style={{ backgroundColor: '#1e293b', borderRadius: '14px', padding: '24px', border: '1px solid #334155' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>SpaCy NER — Keyword Extraction</h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '12px' }}>Keywords extracted from resume text:</p>
              <HighlightedText text={resumeText} highlights={highlights} />
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div style={{ flex: '1 1 360px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!hasResult ? (
            <div style={{ backgroundColor: '#1e293b', borderRadius: '14px', padding: '48px 24px', border: '1px solid #334155', textAlign: 'center' }}>
              <h3 style={{ color: '#64748b', fontWeight: 600, marginBottom: '8px' }}>
                {isLoggedIn ? 'Upload a resume or fill your profile' : 'Login to get started'}
              </h3>
              <p style={{ color: '#475569', fontSize: '0.85rem' }}>Your top 3 career matches will appear here</p>
            </div>
          ) : (
            <>
              {/* Profile Summary Card if from profile */}
              {userProfile && activeTab === 'profile' && (
                <div style={{ backgroundColor: '#1e293b', borderRadius: '14px', padding: '20px', border: '1px solid #334155' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>Coverage Report</h3>
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#64748b', fontSize: '0.82rem' }}>Profile completeness</span>
                      <span style={{ color: '#34d399', fontSize: '0.82rem', fontWeight: '700' }}>
                        {Math.round((TECH_SKILLS.filter(s => userProfile[s.key] === 1).length / TECH_SKILLS.length) * 100)}%
                      </span>
                    </div>
                    <div style={{ backgroundColor: '#0f172a', borderRadius: '4px', height: '6px' }}>
                      <div style={{ width: `${(TECH_SKILLS.filter(s => userProfile[s.key] === 1).length / TECH_SKILLS.length) * 100}%`, height: '6px', backgroundColor: '#34d399', borderRadius: '4px', transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {TECH_SKILLS.filter(s => userProfile[s.key] === 1).length} of {TECH_SKILLS.length} technical skills selected
                  </div>
                </div>
              )}

              {/* Extracted Skills */}
              <div style={{ backgroundColor: '#1e293b', borderRadius: '14px', padding: '20px', border: '1px solid #334155' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Extracted Skills
                  <span style={{ backgroundColor: 'rgba(37,99,235,0.2)', color: '#93c5fd', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '600' }}>{extractedSkills.length} found</span>
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                  {extractedSkills.length > 0
                    ? extractedSkills.map((skill, i) => (
                        <span key={i} style={{ backgroundColor: 'rgba(30,58,138,0.6)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.4)', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '500' }}>{skill}</span>
                      ))
                    : <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No skills detected.</p>
                  }
                </div>
              </div>

              {/* Predictions */}
              <div style={{ backgroundColor: '#1e293b', borderRadius: '14px', padding: '20px', border: '1px solid #334155' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>Predicted Careers</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {predictions.map((item, idx) => {
                    const c = getBadgeColor(item);
                    const displayScore = typeof item.combined_score === 'number' ? item.combined_score : item.probability;
                    return (
                      <div key={idx} style={{ backgroundColor: '#0f172a', borderRadius: '10px', padding: '14px 16px', border: '1px solid #1e293b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ backgroundColor: '#1e40af', color: '#93c5fd', borderRadius: '6px', padding: '4px 8px', fontSize: '0.78rem', fontWeight: '700', minWidth: '32px', textAlign: 'center' }}>#{idx + 1}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', color: '#f8fafc', marginBottom: '6px', fontSize: '0.92rem' }}>{item.role}</div>
                            <div style={{ backgroundColor: '#1e293b', borderRadius: '4px', height: '5px' }}>
                              <div style={{ width: `${Math.min(displayScore, 100)}%`, height: '5px', backgroundColor: c.text, borderRadius: '4px', transition: 'width 0.6s ease' }} />
                            </div>
                          </div>
                          <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700', whiteSpace: 'nowrap', backgroundColor: c.bg, color: c.text }}>{displayScore}%</span>
                        </div>

                        {/* New: matched/missing skills, alignment score, ML vs combined breakdown */}
                        <PredictionDetail item={item} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {hasResult && (
                <button onClick={exportPDF} style={{ width: '100%', padding: '11px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '10px' }}>
                  Export Report (PDF)
                </button>
              )}
              <button onClick={reset} style={{ width: '100%', padding: '11px', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>
                Start Over
              </button>
            </>
          )}
        </div>
      </main>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}


