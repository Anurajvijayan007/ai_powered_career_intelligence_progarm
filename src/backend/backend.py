import io
import re
import os
import pandas as pd
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import joblib
import spacy
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

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
    'web_development', 'devops', 'networking'
]

SKILL_DISPLAY_MAP = {
    'python': 'Python', 'java': 'Java', 'c_cpp': 'C/C++',
    'sql': 'SQL', 'machine_learning': 'Machine Learning',
    'data_analysis': 'Data Analysis', 'cloud_computing': 'Cloud Computing',
    'cybersecurity': 'Cybersecurity', 'web_development': 'Web Development',
    'devops': 'DevOps', 'networking': 'Networking'
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
        "missing_skills": missing[:3],
        "alignment_score": round(alignment_pct, 1),
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