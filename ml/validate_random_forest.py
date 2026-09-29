"""Stratified 5-fold cross-validation of the project's existing classifiers.

Uses the EXACT model configs from src/train.py (no new models):
  - random_forest: RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)
  - logistic_regression: StandardScaler + LogisticRegression(max_iter=2000)
  - xgboost (if installed): n_estimators=200, max_depth=4, learning_rate=0.05

Uses the EXACT feature columns (src.feature_engineering.feature_columns) and
target (src.feature_engineering.targets) from the project. Read-only w.r.t. the
production model and database: only reads the feature CSV, writes new files:
  - random_forest_validation_results.csv
  - random_forest_validation_report.txt

Usage:
    python validate_random_forest.py --data datasets/rf_compare_features.csv
"""
from __future__ import annotations

import argparse
import time
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, confusion_matrix, f1_score,
                             precision_score, recall_score, roc_auc_score)
from sklearn.model_selection import StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

try:
    from xgboost import XGBClassifier
except ImportError:
    XGBClassifier = None

from src.feature_engineering import feature_columns, targets

HERE = Path(__file__).resolve().parent
METRICS = ["accuracy", "precision", "recall", "f1", "roc_auc"]


def make_models() -> dict:
    models = {
        "logistic_regression": Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
            ("clf", LogisticRegression(max_iter=2000)),
        ]),
        "random_forest": Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("clf", RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)),
        ]),
        # NOTE: median imputer precedes the scaler because the frame contains
        # NaNs (sparse signals); scaler/SVC cannot consume NaN. Scaling itself
        # is exactly StandardScaler() -> SVC() as specified.
        "svm": Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
            ("clf", SVC(kernel="rbf", C=1.0, gamma="scale", probability=True,
                        class_weight="balanced", random_state=42)),
        ]),
    }
    if XGBClassifier is not None:
        models["xgboost"] = XGBClassifier(
            n_estimators=200, max_depth=4, learning_rate=0.05,
            eval_metric="logloss", random_state=42, n_jobs=-1,
        )
    return models


def fold_scores(y_true, y_pred, y_prob) -> dict:
    return {
        "accuracy": accuracy_score(y_true, y_pred),
        "precision": precision_score(y_true, y_pred, zero_division=0),
        "recall": recall_score(y_true, y_pred, zero_division=0),
        "f1": f1_score(y_true, y_pred, zero_division=0),
        "roc_auc": roc_auc_score(y_true, y_prob),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default=str(HERE / "datasets" / "rf_compare_features.csv"))
    parser.add_argument("--out-dir", default=str(HERE))
    args = parser.parse_args()
    out_dir = Path(args.out_dir)

    df = pd.read_csv(args.data)
    feats = feature_columns(df)
    X = df[feats].copy()
    y = targets(df).to_numpy()

    # heart_rate/hrv/activity are fully missing in calibration data -> their
    # derived features are all-NaN and unusable; drop and report them.
    all_nan = [c for c in X.columns if X[c].isna().all()]
    usable = [c for c in X.columns if c not in all_nan]
    X = X[usable]
    n_samples = len(X)
    n_pos, n_neg = int((y == 1).sum()), int((y == 0).sum())

    models = make_models()
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    splits = list(skf.split(X, y))

    results: dict[str, dict] = {}
    for name, model in models.items():
        fold_rows, cms, imps = [], [], []
        train_t, pred_t = 0.0, 0.0
        for i, (tr, te) in enumerate(splits):
            t0 = time.perf_counter()
            model.fit(X.iloc[tr], y[tr])
            train_t += time.perf_counter() - t0
            t0 = time.perf_counter()
            y_pred = model.predict(X.iloc[te])
            y_prob = model.predict_proba(X.iloc[te])[:, 1]
            pred_t += time.perf_counter() - t0
            s = fold_scores(y[te], y_pred, y_prob)
            s["fold"] = i + 1
            fold_rows.append(s)
            cms.append(confusion_matrix(y[te], y_pred, labels=[0, 1]))
            est = model.named_steps["clf"] if hasattr(model, "named_steps") else model
            if hasattr(est, "feature_importances_"):
                imps.append(np.asarray(est.feature_importances_, dtype=float))
        cm_total = sum(cms)
        tn, fp, fn, tp = (int(v) for v in cm_total.ravel())
        agg = {m: (float(np.mean([r[m] for r in fold_rows])),
                   float(np.std([r[m] for r in fold_rows], ddof=1))) for m in METRICS}
        fi = None
        if imps:
            arr = np.vstack(imps)
            order = np.argsort(arr.mean(axis=0))[::-1]
            fi = [(usable[j], float(arr[:, j].mean()), float(arr[:, j].std(ddof=1)))
                  for j in order]
        results[name] = {"folds": fold_rows, "mean_std": agg,
                         "cm": {"tn": tn, "fp": fp, "fn": fn, "tp": tp},
                         "train_time": train_t, "predict_time": pred_t,
                         "importances": fi}

    # ---- CSV: per-fold rows + mean/std rows ----
    rows = []
    for name, r in results.items():
        for f in r["folds"]:
            rows.append({"model": name, "fold": f["fold"],
                         **{m: round(f[m], 4) for m in METRICS}})
        rows.append({"model": name, "fold": "mean",
                     **{m: round(r["mean_std"][m][0], 4) for m in METRICS}})
        rows.append({"model": name, "fold": "std",
                     **{m: round(r["mean_std"][m][1], 4) for m in METRICS}})
    pd.DataFrame(rows).to_csv(out_dir / "random_forest_validation_results.csv", index=False)

    # ---- TXT report + terminal output ----
    L = []
    rf = results["random_forest"]
    L.append("RANDOM FOREST VALIDATION")
    L.append("========================")
    L.append(f"Dataset: {args.data}")
    L.append(f"Samples: {n_samples}")
    L.append(f"Features: {len(usable)} usable ({len(all_nan)} all-NaN dropped: "
             + (", ".join(sorted({c.rsplit('_', 2)[0] for c in all_nan})) or "none") + ")")
    L.append(f"Migraine samples: {n_pos}")
    L.append(f"Non-migraine samples: {n_neg}")
    L.append("")
    L.append("5-FOLD CROSS VALIDATION (stratified, random_state=42)")
    L.append("-----------------------------------------------------")
    for f in rf["folds"]:
        L.append(f"Fold {f['fold']}:")
        L.append(f"Accuracy: {f['accuracy']:.4f}")
        L.append(f"Precision: {f['precision']:.4f}")
        L.append(f"Recall: {f['recall']:.4f}")
        L.append(f"F1: {f['f1']:.4f}")
        L.append(f"ROC-AUC: {f['roc_auc']:.4f}")
        L.append("")
    L.append("FINAL RESULTS (random_forest)")
    L.append("-----------------------------")
    for m, label in [("accuracy", "Accuracy"), ("precision", "Precision"),
                     ("recall", "Recall"), ("f1", "F1-score"), ("roc_auc", "ROC-AUC")]:
        mu, sd = rf["mean_std"][m]
        L.append(f"{label}: {mu:.4f} ± {sd:.4f}")
    L.append("")
    L.append("MODEL CONSISTENCY (random_forest)")
    L.append("-----------------")
    L.append(f"Accuracy STD: {rf['mean_std']['accuracy'][1]:.4f}")
    L.append(f"Recall STD: {rf['mean_std']['recall'][1]:.4f}")
    L.append(f"F1 STD: {rf['mean_std']['f1'][1]:.4f}")
    L.append("")
    c = rf["cm"]
    L.append("CONFUSION MATRIX (aggregate over 5 folds)")
    L.append(f"TN: {c['tn']}  FP: {c['fp']}")
    L.append(f"FN: {c['fn']}  TP: {c['tp']}")
    L.append("")
    L.append("TIMING (random_forest, 5 folds total)")
    L.append(f"Training time: {rf['train_time']:.2f}s")
    L.append(f"Prediction/inference time: {rf['predict_time']:.3f}s")
    L.append("")
    L.append("FEATURE IMPORTANCE (random_forest, mean ± std across folds)")
    L.append("------------------")
    for name_, mu, sd in rf["importances"]:
        L.append(f"{name_}: {mu:.4f} ± {sd:.4f}")
    L.append("")
    L.append("COMPARISON MODELS (same 5 folds)")
    L.append("-------------------------------")
    for name, r in results.items():
        if name == "random_forest":
            continue
        parts = "  ".join(f"{m}={r['mean_std'][m][0]:.4f}±{r['mean_std'][m][1]:.4f}"
                          for m in METRICS)
        L.append(f"{name}: {parts}")
        L.append(f"  train={r['train_time']:.2f}s predict={r['predict_time']:.3f}s "
                 f"cm=[TN {r['cm']['tn']} FP {r['cm']['fp']} FN {r['cm']['fn']} TP {r['cm']['tp']}]")
    report = "\n".join(L)
    (out_dir / "random_forest_validation_report.txt").write_text(report)
    print(report)

    # ---- model_comparison_results.csv: mean/std summary for every model ----
    comp_rows = []
    for name, r in results.items():
        row = {"model": name}
        for m in METRICS:
            row[f"{m}_mean"] = round(r["mean_std"][m][0], 4)
            row[f"{m}_std"] = round(r["mean_std"][m][1], 4)
        comp_rows.append(row)
    pd.DataFrame(comp_rows).to_csv(out_dir / "model_comparison_results.csv", index=False)

    # ---- SVM fold lines in exact requested format ----
    print("")
    for f in results["svm"]["folds"]:
        print(f"svm,{f['fold']}," + ",".join(f"{f[m]:.4f}" for m in METRICS))
    mu = results["svm"]["mean_std"]
    print("svm,mean," + ",".join(f"{mu[m][0]:.4f}" for m in METRICS))
    print("svm,std," + ",".join(f"{mu[m][1]:.4f}" for m in METRICS))

    # ---- MODEL COMPARISON block ----
    print("")
    print("MODEL COMPARISON")
    print("================")
    print("")
    for name in results:
        r = results[name]
        print(name.replace("_", " ").title())
        for m, label in [("accuracy", "Mean Accuracy"), ("precision", "Mean Precision"),
                         ("recall", "Mean Recall"), ("f1", "Mean F1"),
                         ("roc_auc", "Mean ROC-AUC")]:
            print(f"{label}: {r['mean_std'][m][0]:.4f}")
        print(f"Standard deviation: accuracy={r['mean_std']['accuracy'][1]:.4f}, "
              f"precision={r['mean_std']['precision'][1]:.4f}, "
              f"recall={r['mean_std']['recall'][1]:.4f}, "
              f"f1={r['mean_std']['f1'][1]:.4f}, "
              f"roc_auc={r['mean_std']['roc_auc'][1]:.4f}")
        print("")


if __name__ == "__main__":
    main()
