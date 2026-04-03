import joblib

# Load model
model = joblib.load("model.pkl")

# Test samples
samples = [
    [12000, 2, 1.5, 0.9, 30],   # normal claim
    [45000, 8, 3.0, 0.2, 2],    # fraud-like
]

for i, sample in enumerate(samples):
    prob = model.predict_proba([sample])[0][1]
    print(f"Sample {i+1} Fraud Probability: {prob:.2f}")