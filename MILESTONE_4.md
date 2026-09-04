# CareerCast AI Prediction — Milestone 4 Documentation

## 1. Project Overview

CareerCast AI Prediction is an AI-powered career guidance system that analyzes a user's resume or profile data to predict the most suitable career paths. The system uses Natural Language Processing (NLP) and Machine Learning (ML) to extract skills from resumes, match them against career requirements, and generate detailed skill-gap reports with personalized improvement plans.

---

## 2. What Was Accomplished in Milestone 4

### 2.1 Frontend Enhancements

| Feature | Description |
|---------|-------------|
| **Career Comparison Page** | Added a new `CareerComparisonPage` component that displays side-by-side comparison of the top 3 predicted careers. Each career card shows overall match score, score breakdown (ML Probability, SBERT Similarity, Combined Score, Skill Alignment), skill alignment bar, matched/missing skills, and top priority improvement items. A comparison summary table at the bottom allows direct metric comparison across careers. |
| **Cohort Analytics Section** | Enhanced `AnalyticsPage` with a new "Cohort Analytics" section that displays aggregate model performance statistics: models evaluated count, best model name, average Macro F1 score, dataset size, and a ranked model leaderboard. |
| **PDF Export** | Added an "Export Report (PDF)" button in the predictions panel. Generates a print-ready HTML document with all prediction data, skill gaps, score breakdowns, and summary tables, then triggers the browser's print dialog for Save as PDF. |
| **Navigation Updates** | Added a "Compare" button in the main header alongside "Analytics". Updated page routing to support `'main'`, `'analytics'`, and `'compare'` states. |

### 2.2 Backend Enhancements

| Feature | Description |
|---------|-------------|
| **Multi-Career Gap Reports** | Enhanced `/gap-report` endpoint to return structured reports for all top 3 predicted careers when called without a `target_role`. Each report includes `career_overview`, `score_breakdown`, `skill_alignment`, `priority_breakdown`, and `improvement_plan`. |
| **Structured Response Format** | Standardized JSON response format with `reports` array and `resume_stats` object for consistent frontend rendering. |

---

## 3. Software Tools & Technologies Used

### Frontend
| Tool / Library | Version / Notes | Purpose |
|----------------|-----------------|---------|
| **React** | 18+ | UI library for component-based frontend |
| **Vite** | Latest | Build tool and dev server |
| **JavaScript (ES6+)** | — | Frontend logic, state management, DOM manipulation |
| **CSS-in-JS (inline styles)** | — | Component styling without external CSS files |

### Backend
| Tool / Library | Version / Notes | Purpose |
|----------------|-----------------|---------|
| **Python** | 3.8+ | Core programming language |
| **FastAPI** | Latest | Web framework for REST APIs |
| **Uvicorn** | Latest | ASGI server |
| **spaCy** | >= 3.8.0 | NLP and keyword extraction |
| **en_core_web_sm** | 3.8.0 | Pre-trained spaCy model |
| **Sentence-BERT** | all-MiniLM-L6-v2 | Semantic text embeddings |
| **Scikit-learn** | 1.6.1 | ML utilities, cosine_similarity |
| **XGBoost** | Latest | Gradient boosting classifier |
| **Joblib** | Latest | Model serialization |
| **Pandas** | Latest | Data preprocessing |
| **NumPy** | Latest | Numerical operations |
| **PDFPlumber** | Latest | PDF text extraction |

### Documentation
| Tool | Purpose |
|------|---------|
| **python-docx** | 1.2.0 | Word document generation |
| **lxml** | 6.1.2 | XML processing for docx |

---

## 4. Challenges Faced & Solutions

### Challenge 1: Career Comparison Data Structure
**Problem:** The existing `/gap-report` endpoint only returned a single report for one target role. The comparison page needed data for all 3 careers simultaneously.

**Solution:** Modified `/gap-report` to accept an optional `target_role` parameter. When not provided, it returns reports for the top 3 predictions in a `reports` array. This allows the comparison page to fetch all data in one request.

### Challenge 2: Responsive Comparison Layout
**Problem:** Displaying 3 career cards side-by-side on all screen sizes without breaking the layout.

**Solution:** Used CSS Grid with `gridTemplateColumns: repeat(min(selectedCareers.length, 3), 1fr)` to create a responsive 3-column layout that adapts to the number of selected careers and screen width.

### Challenge 3: Cohort Analytics Data Availability
**Problem:** The analytics page needed aggregate statistics, but model metrics were only available as a list of individual model scores.

**Solution:** Computed cohort statistics client-side from the existing `/model-metrics` response: calculated best model, average Macro F1, and sorted ranking. No backend changes required.

### Challenge 4: PDF Export Field Name Mismatches
**Problem:** The PDF export template used incorrect field names (`item.ml_prob`, `item.sbert_sim`) that didn't match the backend response format.

**Solution:** Updated the PDF HTML template to use the correct field names: `item.ml_probability` and `item.sbert_similarity`.

---

## 5. Architecture & Data Flow

### Career Comparison Flow
```
User clicks "Compare" in header
    ↓
CareerComparisonPage mounts
    ↓
Fetches /gap-report without target_role
    ↓
Backend returns reports for top 3 careers
    ↓
Frontend renders side-by-side cards + summary table
```

### Cohort Analytics Flow
```
User navigates to Analytics page
    ↓
AnalyticsPage fetches /model-metrics
    ↓
Client computes: best model, avg F1, ranking
    ↓
Renders cohort stats + model leaderboard
```

### PDF Export Flow
```
User clicks "Export Report (PDF)"
    ↓
exportPDF() reads React state
    ↓
Builds HTML template with embedded data
    ↓
Opens new tab, writes HTML
    ↓
Auto-triggers browser print dialog
    ↓
User saves as PDF
```

---

## 6. Input & Output Examples

### 6.1 Career Comparison Request
**Endpoint:** `POST /gap-report` (no target_role)

**Request:**
```bash
curl -X POST "http://127.0.0.1:8000/gap-report" -F "file=@resume.pdf"
```

**Response:**
```json
{
  "status": "success",
  "filename": "resume.pdf",
  "reports": [
    {
      "career_overview": {
        "role": "Data Scientist",
        "career_probability": 82.7,
        "alignment_score": 75.0,
        "ml_probability": 85.3,
        "sbert_similarity": 78.2,
        "combined_score": 82.7
      },
      "score_breakdown": [
        {"label": "ML Probability", "value": 85.3, "unit": "%", "color": "#3b82f6"},
        {"label": "Semantic Match", "value": 78.2, "unit": "%", "color": "#a855f7"},
        {"label": "Combined Score", "value": 82.7, "unit": "%", "color": "#2563eb"}
      ],
      "skill_alignment": {
        "alignment_percentage": 75.0,
        "matched_count": 4,
        "missing_count": 5,
        "matched_skills": ["Python", "Machine Learning", "Data Analysis", "SQL"],
        "missing_skills": ["TensorFlow", "PyTorch", "Deep Learning", "NLP", "Statistics"]
      },
      "priority_breakdown": {
        "high": ["Statistics", "Deep Learning"],
        "medium": ["TensorFlow", "NLP"],
        "low": ["PyTorch"]
      },
      "improvement_plan": [
        {
          "skill": "Statistics",
          "priority": "high",
          "recommended_resource": "Google Machine Learning Crash Course",
          "resource_url": "https://developers.google.com/machine-learning/crash-course",
          "practice_task": "Build a small portfolio project that demonstrates Statistics and document it in your resume."
        }
      ]
    }
  ],
  "resume_stats": {
    "total_skills_detected": 12,
    "top_skills": ["Python", "SQL", "Machine Learning", "Data Analysis", "Java"]
  }
}
```

### 6.2 Model Metrics for Cohort Analytics
**Endpoint:** `GET /model-metrics`

**Response:**
```json
{
  "metrics": [
    {"model": "Logistic Regression", "score_out_of_10": 9.5},
    {"model": "Random Forest", "score_out_of_10": 8.8},
    {"model": "XGBoost", "score_out_of_10": 9.2}
  ],
  "evaluation": {
    "test_rows": 200,
    "dataset_rows": 1000,
    "random_state": 42
  }
}
```

---

## 7. Screenshots & UI Walkthrough

> **Note:** Paste your screenshots in the sections below.

### 7.1 Career Comparison Page
![Career Comparison Screenshot]
> Paste screenshot showing side-by-side comparison of 3 careers with score cards and summary table.

### 7.2 Cohort Analytics Section
![Cohort Analytics Screenshot]
> Paste screenshot showing aggregate stats and model ranking in Analytics page.

### 7.3 PDF Export
![PDF Export Screenshot]
> Paste screenshot of exported PDF report.

---

*Documentation generated for Milestone 4 — CareerCast AI Prediction*
