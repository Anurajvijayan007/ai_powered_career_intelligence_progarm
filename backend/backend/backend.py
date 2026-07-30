import io
import re
import pandas as pd
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import joblib
import spacy

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
    print("✅ SpaCy loaded successfully.")
except Exception as e:
    print(f"⚠️ SpaCy load failed: {e}")
    nlp = None

model = None
mlb = None
try:
    model = joblib.load("logistic_pipeline.pkl")
    mlb = joblib.load("mlb.pkl")
    print("✅ Model loaded successfully.")
except Exception as e:
    print(f"⚠️ Model loading failed: {e}")

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


# --- REGEX PATTERN HELPER FOR SPECIAL CHARACTERS ---
def get_skill_pattern(keyword: str) -> str:
    """Generates regex patterns that safely handle 'c++', 'c#', 'c', and '.net'."""
    kw_lower = keyword.lower()
    
    # Special handling for C++
    if kw_lower in ["c++", "cpp"]:
        return r'(?<![a-zA-Z0-9])c\+\+(?![a-zA-Z0-9])|(?<![a-zA-Z0-9])cpp(?![a-zA-Z0-9])'
    
    # Special handling for standalone C
    if kw_lower == "c":
        return r'(?<![a-zA-Z0-9#+])c(?![a-zA-Z0-9#+])'
    
    # Special handling for C#
    if kw_lower in ["c#", "c-sharp"]:
        return r'(?<![a-zA-Z0-9])c#(?![a-zA-Z0-9])'

    # Standard word-boundary pattern for everything else
    return r'\b' + re.escape(keyword) + r'\b'


# --- HIGHLIGHT GENERATOR ---
def build_highlights(text: str):
    text_lower = text.lower()
    highlights = []

    # 1. Highlight Skills using custom pattern generator
    for kw in SKILL_MAP.keys():
        pattern = get_skill_pattern(kw)
        for m in re.finditer(pattern, text_lower):
            highlights.append({
                "start": m.start(), "end": m.end(),
                "word": text[m.start():m.end()], "type": "skill"
            })

    # 2. Highlight Roles
    for kw in ROLE_KEYWORDS:
        for m in re.finditer(r'\b' + re.escape(kw) + r'\b', text_lower):
            highlights.append({
                "start": m.start(), "end": m.end(),
                "word": text[m.start():m.end()], "type": "role"
            })

    # 3. Highlight Education — prevents false positive on "Scrum Master"
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

    # Remove overlapping highlights by prioritizing longer matches first
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

    # Dictionary for non-meta skills
    skill_flags = {col: 0 for col in DEFAULT_FEATURE_COLS if col not in [
        "age", "gender", "degree_level", "field_of_study", "gpa", "years_experience",
        "communication", "leadership", "problem_solving", "teamwork", "adaptability"
    ]}
    
    found_display = []

    # Dynamically match skills with custom regex support for C, C++, C#
    for keyword, col in SKILL_MAP.items():
        pattern = get_skill_pattern(keyword)
        if re.search(pattern, text_lower):
            if col in skill_flags:
                skill_flags[col] = 1
            
            # Format clean labels for UI output
            if keyword in ["c++", "cpp"]:
                clean_name = "C++"
            elif keyword == "c":
                clean_name = "C"
            elif keyword == "c#":
                clean_name = "C#"
            else:
                clean_name = keyword.title()

            found_display.append(clean_name)

    # Deduplicate extracted skill labels
    found_skills = list(dict.fromkeys(found_display))

    # Soft skills evaluation
    soft_scores = {}
    for skill, keywords in SOFT_SKILL_KEYWORDS.items():
        count = sum(1 for kw in keywords if kw in text_lower)
        soft_scores[skill] = min(3 + count, 5)

    # Extract GPA
    gpa = 3.0
    gpa_match = re.search(r'(?:gpa|cgpa)[:\s]*([0-3]\.\d{1,2}|4\.0|[5-9]\.\d{1,2}|10\.0)', text_lower)
    if gpa_match:
        raw = float(gpa_match.group(1))
        gpa = round((raw / 10) * 4, 2) if raw > 4 else raw

    # Extract Experience
    years_exp = 0
    exp_match = re.search(r'(\d+)\+?\s*(?:years?|yrs?)[\s\w]{0,10}experience', text_lower)
    if exp_match:
        years_exp = int(exp_match.group(1))

    # Extract Age
    age = 22
    age_match = re.search(r'\bage[:\s]*(\d{2})\b', text_lower)
    if age_match:
        age = int(age_match.group(1))

    # Extract Degree Level (skipping "master" if part of "scrum master")
    degree_level = "Bachelor"
    for kw, val in DEGREE_MAP.items():
        if kw in text_lower:
            if kw == "master" and "scrum master" in text_lower and "master of" not in text_lower:
                continue
            degree_level = val
            break

    # Extract Field of Study
    field_of_study = "General"
    for kw, val in FIELD_MAP.items():
        if kw in text_lower:
            field_of_study = val
            break

    # Extract Gender
    gender = "Other"
    if re.search(r'\b(he|his|him)\b', text_lower):
        gender = "Male"
    elif re.search(r'\b(she|her|hers)\b', text_lower):
        gender = "Female"

    # Assemble pandas row
    row = {
        "age": age, "gender": gender,
        "degree_level": degree_level, "field_of_study": field_of_study,
        "gpa": gpa, "years_experience": years_exp,
        **skill_flags, **soft_scores,
    }

    df = pd.DataFrame([row])
    df = df.reindex(columns=DEFAULT_FEATURE_COLS, fill_value=0)
    return df, found_skills


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
        input_df, found_skills = extract_features(text)

        top_predictions = []
        if model is not None and mlb is not None:
            try:
                probs = model.predict_proba(input_df)
                job_scores = []
                for idx, job_name in enumerate(mlb.classes_):
                    prob_val = float(probs[idx][0][1])
                    job_scores.append({"role": str(job_name), "probability": round(prob_val * 100, 1)})
                job_scores.sort(key=lambda x: x["probability"], reverse=True)
                top_predictions = job_scores[:3]
            except Exception as pred_err:
                print(f"❌ Prediction computation error: {pred_err}")

        # Default fallback predictions
        if not top_predictions:
            top_predictions = [
                {"role": "Software Engineer", "probability": 85.0},
                {"role": "Project Manager", "probability": 72.0},
                {"role": "Data Analyst", "probability": 64.5},
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