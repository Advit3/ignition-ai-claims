# Empty placeholder
# Script to train and evaluate ML models for risk and fraud analysis
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import joblib

np.random.seed(42)

data = []

for _ in range(400):
    # Simulate DB-like fields
    claim_amount = np.random.randint(1000, 50000)
    frequency = np.random.randint(1, 10)  # number of past claims
    avg_amount = np.random.randint(1000, 20000)

    amount_ratio = claim_amount / avg_amount
    if np.random.rand() > 0.2:
        doc_match_score = np.random.uniform(0.7, 1.0)
    else:
        doc_match_score = np.random.uniform(0.0, 0.6)
    time_gap = np.random.randint(1, 120)  # days since last claim

    # Fraud logic (realistic pattern)
    fraud = 0

    if (
        frequency > 5 or
        amount_ratio > 2.5 or
        doc_match_score < 0.5 or
        time_gap < 5
    ):
        fraud = 1

    data.append([
        claim_amount,
        frequency,
        amount_ratio,
        doc_match_score,
        time_gap,
        fraud
    ])

# Create dataset
df = pd.DataFrame(data, columns=[
    "claim_amount",
    "frequency",
    "amount_ratio",
    "doc_match_score",
    "time_gap",
    "fraud"
])

# Save dataset
df.to_csv("dataset.csv", index=False)

# Train model
X = df.drop("fraud", axis=1)
y = df["fraud"]

model = RandomForestClassifier(n_estimators=100)
model.fit(X, y)

# Save model
joblib.dump(model, "model.pkl")

print("✅ Dataset + Model ready!")