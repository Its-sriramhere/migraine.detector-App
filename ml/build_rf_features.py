"""Build the classifier feature frame from ml/datasets/calibration.csv.

Maps calibration schema -> pipeline schema:
    patient_id -> user_id, episode -> migraine_within_next_60m
Then runs add_personal_baseline + build_feature_frame.

Usage:
    python build_rf_features.py --sample-frac 0.02 --output datasets/rf_compare_features.csv
    python build_rf_features.py --output datasets/rf_compare_features.csv   (full)
"""
from __future__ import annotations

import argparse
import time
from pathlib import Path

import pandas as pd

from src.feature_engineering import build_feature_frame
from src.preprocessing import add_personal_baseline

HERE = Path(__file__).resolve().parent


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default=str(HERE / "datasets" / "calibration.csv"))
    parser.add_argument("--output", default=str(HERE / "datasets" / "rf_compare_features.csv"))
    parser.add_argument("--sample-frac", type=float, default=1.0)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    t0 = time.perf_counter()
    df = pd.read_csv(args.input)
    print("raw rows:", len(df), "| cols:", list(df.columns))
    print("episode value counts:", df["episode"].value_counts(dropna=False).to_dict())
    print("n patients:", df["patient_id"].nunique())

    df = df.rename(columns={"patient_id": "user_id", "episode": "migraine_within_next_60m"})
    df = df.dropna(subset=["migraine_within_next_60m"])
    df["migraine_within_next_60m"] = df["migraine_within_next_60m"].astype(int)
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    df = df.dropna(subset=["timestamp"]).sort_values(["user_id", "timestamp"]).reset_index(drop=True)

    for col in ("heart_rate", "hrv", "systolic_bp", "diastolic_bp", "spo2", "temperature", "activity"):
        if col not in df:
            df[col] = float("nan")
        else:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    print("missingness per signal:")
    print(df[["heart_rate", "hrv", "systolic_bp", "diastolic_bp", "spo2", "temperature", "activity"]].isna().mean().round(3).to_dict())

    if args.sample_frac < 1.0:
        users = df["user_id"].drop_duplicates().sample(frac=args.sample_frac, random_state=args.seed)
        df = df[df["user_id"].isin(set(users))].reset_index(drop=True)
        print("sampled users:", len(users), "| rows:", len(df))

    df = add_personal_baseline(df)
    feats = build_feature_frame(df)
    feats.to_csv(args.output, index=False)
    print("wrote", args.output, len(feats), "rows x", len(feats.columns), "cols",
          f"in {time.perf_counter() - t0:.1f}s")
    print("label balance:", feats["migraine_within_next_60m"].value_counts(normalize=True).round(3).to_dict())


if __name__ == "__main__":
    main()
