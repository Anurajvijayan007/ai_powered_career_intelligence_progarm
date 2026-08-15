"""Evaluate the three career models on a reproducible held-out dataset split.

Usage:
    python evaluate_models.py "C:\\path\\to\\career_multilabel_dataset.csv"

The command retrains clones of the existing pipelines on 80% of the labelled
dataset, evaluates the remaining 20%, and writes model_metrics.json for the
Analytics dashboard. It never overwrites the deployed model .pkl files.
"""

import json
import sys
from pathlib import Path

import joblib
import pandas as pd
from sklearn.base import clone
from sklearn.metrics import f1_score
from sklearn.model_selection import train_test_split


DATASET_LABEL_COLUMNS = [
    "recommended_job_1",
    "recommended_job_2",
    "recommended_job_3",
]
MODEL_FILES = {
    "Logistic Regression": "logistic_pipeline.pkl",
    "Random Forest": "random_forest_pipeline.pkl",
    "XGBoost": "xgboost_pipeline.pkl",
}
RANDOM_STATE = 42
TEST_SIZE = 0.20


def main(dataset_path: str) -> None:
    dataset = Path(dataset_path)
    if not dataset.is_file():
        raise FileNotFoundError(f"Dataset not found: {dataset}")

    df = pd.read_csv(dataset)
    missing_labels = [column for column in DATASET_LABEL_COLUMNS if column not in df.columns]
    if missing_labels:
        raise ValueError(f"Dataset is missing label columns: {', '.join(missing_labels)}")

    mlb = joblib.load("mlb.pkl")
    labels = df[DATASET_LABEL_COLUMNS].fillna("").values.tolist()
    y = mlb.transform([[label for label in row if label] for row in labels])

    # The pipelines contain their preprocessing, so use the exact saved input
    # column order instead of reimplementing categorical encoding here.
    sample_pipeline = joblib.load("logistic_pipeline.pkl")
    feature_columns = list(sample_pipeline.feature_names_in_)
    missing_features = [column for column in feature_columns if column not in df.columns]
    if missing_features:
        raise ValueError(f"Dataset is missing feature columns: {', '.join(missing_features)}")
    X = df[feature_columns]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE
    )

    metrics = []
    for model_name, model_file in MODEL_FILES.items():
        saved_pipeline = joblib.load(model_file)
        evaluation_pipeline = clone(saved_pipeline)
        evaluation_pipeline.fit(X_train, y_train)
        y_pred = evaluation_pipeline.predict(X_test)
        macro_f1 = f1_score(y_test, y_pred, average="macro", zero_division=0)
        metrics.append({
            "model": model_name,
            "macro_f1": round(float(macro_f1), 4),
            "score_out_of_10": round(float(macro_f1) * 10, 1),
        })

    output = {
        "metric": "Macro F1",
        "scale": {"min": 0.0, "max": 10.0},
        "evaluation": {
            "dataset_rows": int(len(df)),
            "test_rows": int(len(X_test)),
            "test_size": TEST_SIZE,
            "random_state": RANDOM_STATE,
        },
        "metrics": metrics,
    }
    Path("model_metrics.json").write_text(json.dumps(output, indent=2), encoding="utf-8")
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python evaluate_models.py <dataset.csv>")
    main(sys.argv[1])
