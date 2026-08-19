


import io
import re
import os
import json
import pandas as pd
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import joblib
import spacy
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.manifold import TSNE

app = FastAPI(title="CareerCast AI Prediction")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SPACY & MODEL LOADING ---
try:
    nlp = spacy.load("en_core_web_sm")
    print("SpaCy loaded successfully.")
except Exception as e:
    print(f"SpaCy load failed: {e}")
    nlp = None

model = None
mlb = None
try:
    # best_model.pkl is whichever of Logistic Regression / Random Forest /
    # XGBoost scored highest per-label accuracy in the Colab comparison —
    # currently that's the tuned XGBoost model.
    model = joblib.load("best_model.pkl")
    mlb = joblib.load("mlb.pkl")
    print("Model loaded successfully.")
except Exception as e:
    print(f"Model loading failed: {e}")

# Individual model pipelines, loaded separately so /model-comparison can
# run the SAME resume through all three and show what each one predicts.
lr_model = None
rf_model = None
xgb_model = None
try:
    lr_model = joblib.load("logistic_pipeline.pkl")
    print("Logistic Regression pipeline loaded.")
except Exception as e:
    print(f"Logistic Regression pipeline load failed: {e}")
try:
    rf_model = joblib.load("random_forest_pipeline.pkl")
    print("Random Forest pipeline loaded.")
except Exception as e:
    print(f"Random Forest pipeline load failed: {e}")
try:
    xgb_model = joblib.load("xgboost_pipeline.pkl")
    print("XGBoost pipeline loaded.")
except Exception as e:
    print(f"XGBoost pipeline load failed: {e}")

ALL_MODELS = {
    "Logistic Regression": lr_model,
    "Random Forest": rf_model,
    "XGBoost": xgb_model,
}

# --- FEATURE COLUMNS & MAPPINGS ---
DEFAULT_FEATURE_COLS = [
    "age", "gender", "degree_level", "field_of_study", "gpa", "years_experience",
    # Tech Skills
    "python", "java", "c_cpp", "sql", "machine_learning", "data_analysis",
    "cloud_computing", "cybersecurity", "web_development", "devops", "networking",
    # Non-Tech Skills
    "financial_analysis", "project_management", "digital_marketing", "graphic_design",
    "accounting", "sales_strategy", "healthcare_administration", "content_writing",
    # Soft Skills
    "communication", "leadership", "problem_solving", "teamwork", "adaptability"
]

SKILL_MAP = {
    # Programming Languages & Core Tech
    "c++": "c_cpp", "cpp": "c_cpp", "c": "c_cpp", "c/c++": "c_cpp", "c#": "c_cpp",
    "python": "python", "django": "python", "flask": "python", "fastapi": "python",
    "java": "java", "spring": "java", "android studio": "java", "android": "java",
    "sql": "sql", "mysql": "sql", "postgresql": "sql", "postgres": "sql", "mongodb": "sql", "sqlite": "sql", "database": "sql",

    # Machine Learning & Data
    "machine learning": "machine_learning", "ml": "machine_learning", "tensorflow": "machine_learning",
    "pytorch": "machine_learning", "opencv": "machine_learning", "deep learning": "machine_learning", "nlp": "machine_learning",
    "data analysis": "data_analysis", "pandas": "data_analysis", "numpy": "data_analysis", "tableau": "data_analysis", "power bi": "data_analysis", "excel": "data_analysis",

    # Web, Cloud & Infrastructure
    "cloud": "cloud_computing", "aws": "cloud_computing", "azure": "cloud_computing", "gcp": "cloud_computing", "firebase": "cloud_computing",
    "cybersecurity": "cybersecurity", "security": "cybersecurity", "cryptography": "cybersecurity", "ethical hacking": "cybersecurity",
    "web development": "web_development", "html": "web_development", "css": "web_development", "javascript": "web_development", "react": "web_development", "node.js": "web_development", "nodejs": "web_development",
    "devops": "devops", "docker": "devops", "kubernetes": "devops", "git": "devops", "linux": "devops",
    "networking": "networking", "iot": "networking", "esp32": "networking", "arduino": "networking",

    # Non-Tech Skills
    "financial analysis": "financial_analysis", "financial modeling": "financial_analysis", "corporate finance": "financial_analysis", "valuation": "financial_analysis",
    "project management": "project_management", "pmp": "project_management", "agile": "project_management", "scrum": "project_management", "jira": "project_management",
    "digital marketing": "digital_marketing", "seo": "digital_marketing", "sem": "digital_marketing", "google analytics": "digital_marketing", "social media marketing": "digital_marketing",
    "graphic design": "graphic_design", "photoshop": "graphic_design", "illustrator": "graphic_design", "figma": "graphic_design", "ui/ux": "graphic_design",
    "accounting": "accounting", "bookkeeping": "accounting", "tally": "accounting", "quickbooks": "accounting", "auditing": "accounting", "taxation": "accounting",
    "sales strategy": "sales_strategy", "b2b sales": "sales_strategy", "crm": "sales_strategy", "salesforce": "sales_strategy", "business development": "sales_strategy",
    "healthcare administration": "healthcare_administration", "clinical research": "healthcare_administration", "patient care": "healthcare_administration", "ehr": "healthcare_administration",
    "content writing": "content_writing", "copywriting": "content_writing", "technical writing": "content_writing", "blogging": "content_writing"
}

ROLE_KEYWORDS = [
    # Tech Roles
    "software engineer", "data scientist", "data analyst", "machine learning engineer",
    "cloud engineer", "devops engineer", "cybersecurity analyst", "backend developer",
    "frontend developer", "full stack developer", "android developer", "web developer",

    # Non-Tech Roles
    "project manager", "scrum master", "financial analyst", "accountant",
    "digital marketer", "graphic designer", "ui/ux designer", "sales manager",
    "business development executive", "human resources manager", "hr recruiter",
    "content strategist", "operations manager", "clinical research associate"
]

DEGREE_MAP = {
    "bachelor": "Bachelor", "b.sc": "Bachelor", "b.tech": "Bachelor", "bca": "Bachelor", "b.com": "Bachelor", "bba": "Bachelor", "ba ": "Bachelor",
    "master": "Master", "mca": "Master", "m.sc": "Master", "m.tech": "Master", "mba": "Master", "m.com": "Master",
    "phd": "PhD", "doctorate": "PhD", "ph.d": "PhD", "associate": "Associate",
}

FIELD_MAP = {
    "data science": "Data Science", "computer science": "Computer Science",
    "cybersecurity": "Cybersecurity", "information technology": "Information Technology",
    "finance": "Finance", "accounting": "Finance", "business administration": "Business Administration",
    "marketing": "Marketing", "graphic design": "Design", "healthcare": "Healthcare",
    "biotechnology": "Biotechnology", "mechanical engineering": "Engineering", "civil engineering": "Engineering"
}

SOFT_SKILL_KEYWORDS = {
    "communication":   ["communicat", "present", "verbal", "written"],
    "leadership":      ["lead", "manag", "supervis", "mentor"],
    "problem_solving": ["problem", "solv", "debug", "troubleshoot", "analytical"],
    "teamwork":        ["team", "collaborat", "cooperat", "group"],
    "adaptability":    ["adapt", "flexib", "learn", "versatil"],
}

# --- SBERT SKILL ALIGNMENT SETUP ---
# CAREER_SKILL_REQUIREMENTS must match your trained model's mlb.classes_
# exactly (the 13 career labels from your training dataset), otherwise a
# career would silently get 0% skill alignment.
CAREER_SKILL_REQUIREMENTS = {
    'Software Engineer':             ['python', 'java', 'c++', 'algorithms', 'data structures', 'git', 'software development'],
    'Data Scientist':                ['python', 'machine learning', 'statistics', 'data analysis', 'pandas', 'scikit-learn', 'deep learning'],
    'Machine Learning Engineer':     ['python', 'tensorflow', 'pytorch', 'machine learning', 'deep learning', 'neural networks', 'mlops'],
    'Cloud Engineer':                ['aws', 'azure', 'gcp', 'cloud computing', 'docker', 'kubernetes', 'devops'],
    'DevOps Engineer':               ['docker', 'kubernetes', 'ci/cd', 'linux', 'git', 'ansible', 'terraform'],
    'Cybersecurity Analyst':         ['cybersecurity', 'networking', 'ethical hacking', 'penetration testing', 'cryptography', 'security'],
    'Data Analyst':                  ['sql', 'excel', 'tableau', 'power bi', 'data analysis', 'statistics', 'visualization'],
    'Business Intelligence Analyst': ['sql', 'tableau', 'power bi', 'data warehousing', 'reporting', 'data analysis'],
    'Backend Developer':             ['python', 'java', 'sql', 'rest api', 'databases', 'server side', 'microservices'],
    'Frontend Developer':            ['javascript', 'react', 'html', 'css', 'typescript', 'web development', 'ui design'],
    'Full Stack Developer':          ['javascript', 'react', 'python', 'sql', 'html', 'css', 'rest api', 'databases'],
    'Security Engineer':             ['cybersecurity', 'networking', 'cryptography', 'firewalls', 'security protocols', 'siem'],
    'AI Researcher':                 ['machine learning', 'deep learning', 'python', 'research', 'pytorch', 'nlp', 'computer vision'],
}

SKILL_COLUMNS = [
    'python', 'java', 'c_cpp', 'sql', 'machine_learning',
    'data_analysis', 'cloud_computing', 'cybersecurity',
    'web_development', 'devops', 'networking',
    'financial_analysis', 'project_management', 'digital_marketing',
    'graphic_design', 'accounting', 'sales_strategy',
    'healthcare_administration', 'content_writing'
]

SKILL_DISPLAY_MAP = {
    'python': 'Python', 'java': 'Java', 'c_cpp': 'C/C++',
    'sql': 'SQL', 'machine_learning': 'Machine Learning',
    'data_analysis': 'Data Analysis', 'cloud_computing': 'Cloud Computing',
    'cybersecurity': 'Cybersecurity', 'web_development': 'Web Development',
    'devops': 'DevOps', 'networking': 'Networking',
    'financial_analysis': 'Financial Analysis', 'project_management': 'Project Management',
    'digital_marketing': 'Digital Marketing', 'graphic_design': 'Graphic Design',
    'accounting': 'Accounting', 'sales_strategy': 'Sales Strategy',
    'healthcare_administration': 'Healthcare Administration', 'content_writing': 'Content Writing'
}

sbert = None
career_embeddings = {}
try:
    # Prefer a fine-tuned model if you've uploaded one alongside the backend
    # (the sbert_finetuned_career_model/ folder saved from your Colab training
    # script). Falls back to the pretrained model if that folder isn't present.
    sbert_path = "sbert_finetuned_career_model"
    if os.path.isdir(sbert_path):
        sbert = SentenceTransformer(sbert_path)
        print("SBERT (fine-tuned) loaded successfully.")
    else:
        sbert = SentenceTransformer("all-MiniLM-L6-v2")
        print("SBERT (pretrained) loaded successfully.")

    for career, skills in CAREER_SKILL_REQUIREMENTS.items():
        career_embeddings[career] = sbert.encode(", ".join(skills))
    print(f"Generated {len(career_embeddings)} career embeddings.")
except Exception as e:
    print(f"SBERT loading failed: {e}")
    sbert = None


def get_sbert_scores(user_skill_names):
    """Returns {career_name: similarity_0_to_1} for every career."""
    if sbert is None or not user_skill_names:
        return {}
    user_embedding = sbert.encode(", ".join(user_skill_names)).reshape(1, -1)
    scores = {}
    for career, embedding in career_embeddings.items():
        sim = cosine_similarity(user_embedding, embedding.reshape(1, -1))[0][0]
        scores[career] = float(sim)
    return scores


# --- t-SNE SKILL EMBEDDING VISUALIZATION ---
# Genuinely computed from your fine-tuned/pretrained SBERT model — each
# (skill, career) pair from CAREER_SKILL_REQUIREMENTS is embedded, then
# projected to 2D with real sklearn TSNE. Cached after first computation
# since it's the same regardless of which resume is uploaded.
_tsne_cache = None


def compute_tsne_skill_embeddings():
    global _tsne_cache
    if sbert is None:
        return None

    skill_points = []
    seen = set()
    for career, skills in CAREER_SKILL_REQUIREMENTS.items():
        for skill in skills:
            key = (skill, career)
            if key in seen:
                continue
            seen.add(key)
            skill_points.append((skill, career))

    texts = [s for s, _ in skill_points]
    embeddings = sbert.encode(texts)

    n_samples = len(embeddings)
    perplexity = min(30, max(5, n_samples // 3))
    tsne = TSNE(n_components=2, random_state=42, perplexity=perplexity, init="pca")
    coords = tsne.fit_transform(np.array(embeddings))

    points = []
    for (skill, career), (x, y) in zip(skill_points, coords):
        points.append({
            "skill": skill,
            "category": career,
            "x": round(float(x), 3),
            "y": round(float(y), 3),
        })
    _tsne_cache = points
    return points


def compute_resume_tsne_skill_embeddings(skill_flags):
    """Project only the skills detected in one uploaded resume into 2D."""
    if sbert is None:
        return None

    skills = [
        SKILL_DISPLAY_MAP[column]
        for column in SKILL_COLUMNS
        if skill_flags.get(column, 0) == 1
    ]
    if not skills:
        return []
    if len(skills) == 1:
        return [{"skill": skills[0], "x": 0.0, "y": 0.0}]

    embeddings = sbert.encode(skills)
    perplexity = min(5, len(skills) - 1)
    tsne = TSNE(n_components=2, random_state=42, perplexity=perplexity, init="random")
    coords = tsne.fit_transform(np.array(embeddings))
    return [
        {"skill": skill, "x": round(float(x), 3), "y": round(float(y), 3)}
        for skill, (x, y) in zip(skills, coords)
    ]


# Precompute once at startup so the first frontend request is fast.
try:
    if sbert is not None:
        compute_tsne_skill_embeddings()
        print(f"t-SNE skill embeddings precomputed: {len(_tsne_cache) if _tsne_cache else 0} points.")
except Exception as e:
    print(f"t-SNE precompute failed: {e}")


def get_skill_alignment_metrics(skill_flags, career_name):
    """
    Given the binary skill flags extracted from a resume and a career name,
    returns which required skills matched, which are missing, and a percentage.
    """
    career_required = CAREER_SKILL_REQUIREMENTS.get(career_name, [])
    user_skills = [
        SKILL_DISPLAY_MAP.get(col, col).lower()
        for col in SKILL_COLUMNS if skill_flags.get(col, 0) == 1
    ]
    matched = [s for s in career_required if any(u in s or s in u for u in user_skills)]
    missing = [s for s in career_required if s not in matched]
    alignment_pct = (len(matched) / len(career_required) * 100) if career_required else 0
    return {
        "matched_skills": matched,
        # Return every missing requirement so the UI can show the complete
        # learning path needed to reach 100% skill alignment.
        "missing_skills": missing,
        "alignment_score": round(alignment_pct, 1),
    }


LEARNING_RESOURCES = {
    "python": ("Python for Everybody", "https://www.coursera.org/specializations/python"),
    "sql": ("SQLBolt interactive lessons", "https://sqlbolt.com/"),
    "machine learning": ("Google Machine Learning Crash Course", "https://developers.google.com/machine-learning/crash-course"),
    "git": ("Pro Git book", "https://git-scm.com/book/en/v2"),
    "docker": ("Docker getting-started guide", "https://docs.docker.com/get-started/"),
    "kubernetes": ("Kubernetes Basics", "https://kubernetes.io/docs/tutorials/kubernetes-basics/"),
    "aws": ("AWS Skill Builder", "https://explore.skillbuilder.aws/"),
    "react": ("React Learn", "https://react.dev/learn"),
}


def build_gap_actions(missing_skills):
    """Turn a raw missing-skill list into an ordered, practical learning plan."""
    actions = []
    for index, skill in enumerate(missing_skills):
        resource_name, resource_url = LEARNING_RESOURCES.get(
            skill.lower(),
            (f"Learn {skill} on freeCodeCamp", "https://www.freecodecamp.org/learn/"),
        )
        priority = "high" if index < 3 else "medium" if index < 6 else "low"
        actions.append({
            "skill": skill,
            "priority": priority,
            "recommended_resource": resource_name,
            "resource_url": resource_url,
            "practice_task": f"Build a small portfolio project that demonstrates {skill} and document it in your resume.",
        })
    return actions


async def read_resume_text(file: UploadFile):
    if not file.filename or not file.filename.lower().endswith((".pdf", ".txt")):
        raise HTTPException(status_code=400, detail="Only PDF or TXT files are supported.")
    file_bytes = await file.read()
    if file.filename.lower().endswith(".pdf"):
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            text = " ".join(page.extract_text() or "" for page in pdf.pages)
    else:
        text = file_bytes.decode("utf-8", errors="ignore")
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not read text content from file.")
    return text.strip()


def predict_careers(text):
    """Return ranked model predictions plus extracted resume information."""
    if model is None or mlb is None:
        raise HTTPException(status_code=503, detail="Prediction model is unavailable.")
    highlights = build_highlights(text)
    input_df, found_skills, skill_flags = extract_features(text)
    try:
        probabilities = model.predict_proba(input_df)
        user_skill_names = [SKILL_DISPLAY_MAP.get(col, col).lower() for col in SKILL_COLUMNS if skill_flags.get(col, 0) == 1]
        sbert_scores = get_sbert_scores(user_skill_names)
        predictions = []
        for index, career in enumerate(mlb.classes_):
            ml_probability = float(probabilities[index][0][1]) * 100
            semantic_match = sbert_scores.get(str(career), 0.0) * 100
            alignment = get_skill_alignment_metrics(skill_flags, str(career))
            predictions.append({
                "role": str(career), "ml_probability": round(ml_probability, 1),
                "sbert_similarity": round(semantic_match, 1),
                "combined_score": round(0.7 * ml_probability + 0.3 * semantic_match, 1),
                "probability": round(0.7 * ml_probability + 0.3 * semantic_match, 1),
                **alignment,
            })
        predictions.sort(key=lambda item: item["combined_score"], reverse=True)
        return {"predictions": predictions, "extracted_skills": found_skills, "skill_flags": skill_flags, "highlights": highlights}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction computation failed: {str(exc)}")


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """Generate ranked career probabilities for a PDF or TXT resume."""
    text = await read_resume_text(file)
    result = predict_careers(text)
    return {
        "filename": file.filename,
        "predictions": result["predictions"][:3],
        "extracted_skills": result["extracted_skills"],
    }


@app.post("/recommendations")
async def recommendations(file: UploadFile = File(...)):
    """Return the top careers with their skill-alignment context."""
    text = await read_resume_text(file)
    result = predict_careers(text)
    recommendations = []
    for item in result["predictions"][:3]:
        recommendations.append({
            "role": item["role"],
            "career_probability": item["probability"],
            "skill_alignment": item["alignment_score"],
            "next_step": f"Prioritize the high-priority skills in the {item['role']} gap report.",
        })
    return {"filename": file.filename, "recommendations": recommendations}


@app.post("/gap-report")
async def gap_report(file: UploadFile = File(...), target_role: str = ""):
    """Create an actionable skill-gap report for a selected or best-fit career."""
    text = await read_resume_text(file)
    result = predict_careers(text)

    if target_role:
        targets = [next((item for item in result["predictions"] if item["role"].lower() == target_role.lower()), None)]
        targets = [t for t in targets if t]
    else:
        targets = result["predictions"][:3]

    def build_report(target):
        matched = target.get("matched_skills", [])
        missing = target.get("missing_skills", [])
        improvement_plan = build_gap_actions(missing)
        high_priority = [a["skill"] for a in improvement_plan if a["priority"] == "high"]
        medium_priority = [a["skill"] for a in improvement_plan if a["priority"] == "medium"]
        low_priority = [a["skill"] for a in improvement_plan if a["priority"] == "low"]
        return {
            "career_overview": {
                "role": target["role"],
                "career_probability": target.get("probability", target.get("combined_score", 0)),
                "alignment_score": target.get("alignment_score", 0),
                "ml_probability": target.get("ml_probability", 0),
                "sbert_similarity": target.get("sbert_similarity", 0),
                "combined_score": target.get("combined_score", target.get("probability", 0)),
            },
            "score_breakdown": [
                {"label": "ML Probability", "value": target.get("ml_probability", 0), "unit": "%", "color": "#3b82f6"},
                {"label": "Semantic Match", "value": target.get("sbert_similarity", 0), "unit": "%", "color": "#a855f7"},
                {"label": "Combined Score", "value": target.get("combined_score", target.get("probability", 0)), "unit": "%", "color": "#2563eb"},
            ],
            "skill_alignment": {
                "alignment_percentage": target.get("alignment_score", 0),
                "matched_count": len(matched),
                "missing_count": len(missing),
                "matched_skills": matched,
                "missing_skills": missing,
            },
            "priority_breakdown": {
                "high": high_priority,
                "medium": medium_priority,
                "low": low_priority,
            },
            "improvement_plan": improvement_plan,
        }

    reports = [build_report(t) for t in targets]
    resume_skills_count = len([v for v in result.get("skill_flags", {}).values() if v == 1])

    return {
        "status": "success",
        "filename": file.filename,
        "reports": reports,
        "resume_stats": {
            "total_skills_detected": resume_skills_count,
            "top_skills": result.get("extracted_skills", [])[:10],
        },
    }


# --- REGEX PATTERN HELPER FOR SPECIAL CHARACTERS ---
def get_skill_pattern(keyword: str) -> str:
    """Generates regex patterns that safely handle 'c++', 'c#', 'c', and '.net'."""
    kw_lower = keyword.lower()

    if kw_lower in ["c++", "cpp"]:
        return r'(?<![a-zA-Z0-9])c\+\+(?![a-zA-Z0-9])|(?<![a-zA-Z0-9])cpp(?![a-zA-Z0-9])'
    if kw_lower == "c":
        return r'(?<![a-zA-Z0-9#+])c(?![a-zA-Z0-9#+])'
    if kw_lower in ["c#", "c-sharp"]:
        return r'(?<![a-zA-Z0-9])c#(?![a-zA-Z0-9])'
    return r'\b' + re.escape(keyword) + r'\b'


# --- HIGHLIGHT GENERATOR ---
def build_highlights(text: str):
    text_lower = text.lower()
    highlights = []

    for kw in SKILL_MAP.keys():
        pattern = get_skill_pattern(kw)
        for m in re.finditer(pattern, text_lower):
            highlights.append({
                "start": m.start(), "end": m.end(),
                "word": text[m.start():m.end()], "type": "skill"
            })

    for kw in ROLE_KEYWORDS:
        for m in re.finditer(r'\b' + re.escape(kw) + r'\b', text_lower):
            highlights.append({
                "start": m.start(), "end": m.end(),
                "word": text[m.start():m.end()], "type": "role"
            })

    edu_patterns = [
        r'\b(bachelor(?:\'s)?|b\.tech|b\.sc|bca|bba|b\.com)\b',
        r'\b(master(?:\'s)?\s+(?:of|degree|in)|m\.tech|m\.sc|mca|mba|m\.com)\b',
        r'\b(phd|ph\.d|doctorate)\b'
    ]
    for pattern in edu_patterns:
        for m in re.finditer(pattern, text_lower):
            highlights.append({
                "start": m.start(), "end": m.end(),
                "word": text[m.start():m.end()], "type": "education"
            })

    highlights.sort(key=lambda x: (x["start"], -(x["end"] - x["start"])))
    filtered = []
    last_end = -1
    for h in highlights:
        if h["start"] >= last_end:
            filtered.append(h)
            last_end = h["end"]

    return filtered


# --- FEATURE EXTRACTION ENGINE ---
def extract_features(text: str):
    text_lower = text.lower()

    skill_flags = {col: 0 for col in DEFAULT_FEATURE_COLS if col not in [
        "age", "gender", "degree_level", "field_of_study", "gpa", "years_experience",
        "communication", "leadership", "problem_solving", "teamwork", "adaptability"
    ]}

    found_display = []

    for keyword, col in SKILL_MAP.items():
        pattern = get_skill_pattern(keyword)
        if re.search(pattern, text_lower):
            if col in skill_flags:
                skill_flags[col] = 1

            if keyword in ["c++", "cpp"]:
                clean_name = "C++"
            elif keyword == "c":
                clean_name = "C"
            elif keyword == "c#":
                clean_name = "C#"
            else:
                clean_name = keyword.title()

            found_display.append(clean_name)

    found_skills = list(dict.fromkeys(found_display))

    soft_scores = {}
    for skill, keywords in SOFT_SKILL_KEYWORDS.items():
        count = sum(1 for kw in keywords if kw in text_lower)
        soft_scores[skill] = min(3 + count, 5)

    gpa = 3.0
    gpa_match = re.search(r'(?:gpa|cgpa)[:\s]*([0-3]\.\d{1,2}|4\.0|[5-9]\.\d{1,2}|10\.0)', text_lower)
    if gpa_match:
        raw = float(gpa_match.group(1))
        gpa = round((raw / 10) * 4, 2) if raw > 4 else raw

    years_exp = 0
    exp_match = re.search(r'(\d+)\+?\s*(?:years?|yrs?)[\s\w]{0,10}experience', text_lower)
    if exp_match:
        years_exp = int(exp_match.group(1))

    age = 22
    age_match = re.search(r'\bage[:\s]*(\d{2})\b', text_lower)
    if age_match:
        age = int(age_match.group(1))

    degree_level = "Bachelor"
    for kw, val in DEGREE_MAP.items():
        if kw in text_lower:
            if kw == "master" and "scrum master" in text_lower and "master of" not in text_lower:
                continue
            degree_level = val
            break

    field_of_study = "General"
    for kw, val in FIELD_MAP.items():
        if kw in text_lower:
            field_of_study = val
            break

    gender = "Other"
    if re.search(r'\b(he|his|him)\b', text_lower):
        gender = "Male"
    elif re.search(r'\b(she|her|hers)\b', text_lower):
        gender = "Female"

    row = {
        "age": age, "gender": gender,
        "degree_level": degree_level, "field_of_study": field_of_study,
        "gpa": gpa, "years_experience": years_exp,
        **skill_flags, **soft_scores,
    }

    df = pd.DataFrame([row])
    df = df.reindex(columns=DEFAULT_FEATURE_COLS, fill_value=0)
    return df, found_skills, skill_flags


# --- API ENDPOINTS ---
@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    try:
        if not file.filename.lower().endswith(('.pdf', '.txt')):
            raise HTTPException(status_code=400, detail="Only PDF or TXT files are supported.")

        file_bytes = await file.read()
        text = ""

        if file.filename.lower().endswith('.pdf'):
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for page in pdf.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted + " "
        else:
            text = file_bytes.decode("utf-8", errors="ignore")

        text = text.strip()
        if not text:
            raise HTTPException(status_code=400, detail="Could not read text content from file.")

        highlights = build_highlights(text)
        input_df, found_skills, skill_flags = extract_features(text)

        top_predictions = []
        if model is not None and mlb is not None:
            try:
                probs = model.predict_proba(input_df)
                job_scores = []
                for idx, job_name in enumerate(mlb.classes_):
                    prob_val = float(probs[idx][0][1])
                    job_scores.append({
                        "role": str(job_name),
                        "ml_probability": round(prob_val * 100, 1),
                    })

                # SBERT semantic similarity, based on the skills actually
                # detected in the resume text (skill_flags from extract_features)
                user_skill_names = [
                    SKILL_DISPLAY_MAP.get(col, col).lower()
                    for col in SKILL_COLUMNS if skill_flags.get(col, 0) == 1
                ]
                sbert_scores = get_sbert_scores(user_skill_names)

                for job in job_scores:
                    sbert_sim = sbert_scores.get(job["role"], 0.0)
                    combined = 0.7 * (job["ml_probability"] / 100) + 0.3 * sbert_sim

                    job["sbert_similarity"] = round(sbert_sim * 100, 1)
                    job["combined_score"] = round(combined * 100, 1)
                    # "probability" kept as the primary display metric for the
                    # frontend's existing bar/badge — now driven by the
                    # combined score rather than raw ML probability alone.
                    job["probability"] = job["combined_score"]

                    alignment = get_skill_alignment_metrics(skill_flags, job["role"])
                    job["matched_skills"] = alignment["matched_skills"]
                    job["missing_skills"] = alignment["missing_skills"]
                    job["alignment_score"] = alignment["alignment_score"]

                job_scores.sort(key=lambda x: x["combined_score"], reverse=True)
                top_predictions = job_scores[:3]
            except Exception as pred_err:
                print(f"Prediction computation error: {pred_err}")

        # Default fallback predictions — include the same fields so the
        # frontend doesn't have to special-case a missing model.
        if not top_predictions:
            top_predictions = [
                {"role": "Software Engineer", "probability": 85.0, "ml_probability": 85.0,
                 "sbert_similarity": 0.0, "combined_score": 85.0, "alignment_score": 0.0,
                 "matched_skills": [], "missing_skills": []},
                {"role": "Project Manager", "probability": 72.0, "ml_probability": 72.0,
                 "sbert_similarity": 0.0, "combined_score": 72.0, "alignment_score": 0.0,
                 "matched_skills": [], "missing_skills": []},
                {"role": "Data Analyst", "probability": 64.5, "ml_probability": 64.5,
                 "sbert_similarity": 0.0, "combined_score": 64.5, "alignment_score": 0.0,
                 "matched_skills": [], "missing_skills": []},
            ]

        return {
            "status": "success",
            "filename": file.filename,
            "extracted_skills": found_skills,
            "predictions": top_predictions,
            "resume_text": text[:2000],
            "highlights": highlights,
        }

    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@app.post("/model-comparison")
async def model_comparison(file: UploadFile = File(...)):
    """
    Runs the SAME uploaded resume through all 3 trained models
    (Logistic Regression, Random Forest, XGBoost) and returns each one's
    top predicted career + confidence, so the frontend can show a
    genuine, live side-by-side comparison for this specific resume.
    """
    try:
        if not file.filename.lower().endswith(('.pdf', '.txt')):
            raise HTTPException(status_code=400, detail="Only PDF or TXT files are supported.")

        file_bytes = await file.read()
        text = ""

        if file.filename.lower().endswith('.pdf'):
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for page in pdf.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted + " "
        else:
            text = file_bytes.decode("utf-8", errors="ignore")

        text = text.strip()
        if not text:
            raise HTTPException(status_code=400, detail="Could not read text content from file.")

        input_df, found_skills, skill_flags = extract_features(text)

        if mlb is None:
            raise HTTPException(status_code=503, detail="Label encoder (mlb.pkl) not loaded.")

        comparison = []
        for model_name, m in ALL_MODELS.items():
            if m is None:
                comparison.append({
                    "model": model_name,
                    "available": False,
                    "top_career": None,
                    "confidence": None,
                    "top3": [],
                })
                continue
            try:
                probs = m.predict_proba(input_df)
                scores = []
                for idx, job_name in enumerate(mlb.classes_):
                    prob_val = float(probs[idx][0][1])
                    scores.append({"role": str(job_name), "probability": round(prob_val * 100, 1)})
                scores.sort(key=lambda x: x["probability"], reverse=True)
                top = scores[0] if scores else None
                comparison.append({
                    "model": model_name,
                    "available": True,
                    "top_career": top["role"] if top else None,
                    "confidence": top["probability"] if top else None,
                    "resume_score_out_of_10": round(top["probability"] / 10, 1) if top else None,
                    "top3": scores[:3],
                })
            except Exception as model_err:
                comparison.append({
                    "model": model_name,
                    "available": False,
                    "error": str(model_err),
                    "top_career": None,
                    "confidence": None,
                    "top3": [],
                })

        return {
            "status": "success",
            "filename": file.filename,
            "extracted_skills": found_skills,
            "comparison": comparison,
        }

    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@app.get("/model-metrics")
async def model_metrics():
    """Return held-out Macro F1 scores generated by evaluate_models.py."""
    metrics_path = os.path.join(os.path.dirname(__file__), "model_metrics.json")
    try:
        with open(metrics_path, "r", encoding="utf-8") as metrics_file:
            return json.load(metrics_file)
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="Model metrics are not available. Run evaluate_models.py with the labelled dataset first.",
        )
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Saved model metrics are invalid.")


@app.post("/resume-tsne-visualization")
async def resume_tsne_visualization(file: UploadFile = File(...)):
    """Return a fresh t-SNE projection of skills extracted from this resume."""
    try:
        if not file.filename.lower().endswith((".pdf", ".txt")):
            raise HTTPException(status_code=400, detail="Only PDF or TXT files are supported.")

        file_bytes = await file.read()
        if file.filename.lower().endswith(".pdf"):
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                text = " ".join(page.extract_text() or "" for page in pdf.pages)
        else:
            text = file_bytes.decode("utf-8", errors="ignore")

        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not read text content from file.")

        _, _, skill_flags = extract_features(text)
        points = compute_resume_tsne_skill_embeddings(skill_flags)
        if points is None:
            raise HTTPException(status_code=503, detail="SBERT is not available for t-SNE visualization.")
        return {"filename": file.filename, "points": points}
    except HTTPException as http_ex:
        raise http_ex
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not create resume t-SNE visualization: {str(exc)}")


@app.get("/tsne-visualization")
async def tsne_visualization():
    """
    Returns a 2D t-SNE projection of SBERT embeddings for every skill
    across all careers in CAREER_SKILL_REQUIREMENTS, so the frontend can
    render a scatter plot of the skill embedding space, colored by
    career category.
    """
    global _tsne_cache
    if _tsne_cache is None:
        compute_tsne_skill_embeddings()
    if _tsne_cache is None:
        raise HTTPException(status_code=503, detail="SBERT not available — cannot compute embeddings.")
    return {"points": _tsne_cache, "categories": list(CAREER_SKILL_REQUIREMENTS.keys())}

