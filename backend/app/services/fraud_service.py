import os
import joblib
from datetime import datetime, timedelta

# Fraud detection service
# Analyzes claims for fraudulent patterns

# Load model relative to current file path
model_path = os.path.join(os.path.dirname(__file__), "../../../ml-model/model.pkl")
try:
    model = joblib.load(model_path)
except FileNotFoundError:
    model = None
    print("Warning: model.pkl not found. Please train the model first.")

def validate_date_score(bill_date):
    if not bill_date:
        return 0.0
    try:
        dt = datetime.strptime(bill_date, "%Y-%m-%d")
        now = datetime.now()
        delta_days = (now - dt).days
        
        if delta_days < 0:
            return 0.0
        elif delta_days > 90:
            return 0.5
        else:
            return 1.0
    except Exception:
        return 0.0

def build_features(claim_data, user_history):
    claim_amount = claim_data.get("claim_amount", 0.0)
    frequency = user_history.get("past_claims", 0)
    avg_claim_amount = user_history.get("avg_claim_amount", 0.0)
    
    # Safe division for amount_ratio
    if avg_claim_amount > 0:
        amount_ratio = claim_amount / avg_claim_amount
    else:
        amount_ratio = 1.0 if claim_amount > 0 else 0.0
        
    date_score = validate_date_score(claim_data.get("bill_date"))
    doc_match_score = claim_data.get("doc_match_score", 0.0)
    final_doc_score = doc_match_score * date_score
    
    time_gap = user_history.get("last_claim_days", 0)
    
    return [claim_amount, frequency, amount_ratio, final_doc_score, time_gap]

def predict_fraud(features):
    if model is None:
        return 0.5 # Default fallback
    return model.predict_proba([features])[0][1]

def calculate_trust_score(user_history):
    total_claims = user_history.get("total_claims", 0)
    fraud_count = user_history.get("fraud_count", 0)
    rejected_claims = user_history.get("rejected_claims", 0)
    
    # Handle divide by zero safely
    if total_claims == 0:
        return 1.0
        
    reduction = (fraud_count / total_claims) * 0.6 + (rejected_claims / total_claims) * 0.4
    trust_score = 1.0 - reduction
    
    return max(0.0, min(1.0, trust_score))

def compute_final_risk(fraud_probability, trust_score):
    # Trust score influence is capped to avoid overriding strong fraud signals
    trust_impact = 0.7 * trust_score
    adjusted_score = fraud_probability * (1.0 - trust_impact)
    return adjusted_score

if __name__ == "__main__":
    today_str = datetime.now().strftime("%Y-%m-%d")
    future_str = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
    old_str = (datetime.now() - timedelta(days=100)).strftime("%Y-%m-%d")

    sample_user_history = {
        "past_claims": 5,
        "avg_claim_amount": 2500.0,
        "last_claim_days": 120,
        "fraud_count": 0,
        "rejected_claims": 1,
        "total_claims": 5
    }

    print("--- Testing Valid Date ---")
    sample_claim_valid = {
        "claim_amount": 5000.0,
        "doc_match_score": 0.85,
        "bill_date": today_str
    }
    features_valid = build_features(sample_claim_valid, sample_user_history)
    date_score_valid = validate_date_score(today_str)
    print("Date Score:", date_score_valid)
    print("Final Doc Score:", features_valid[3])

    print("\n--- Testing Old Date ---")
    sample_claim_old = {
        "claim_amount": 5000.0,
        "doc_match_score": 0.85,
        "bill_date": old_str
    }
    features_old = build_features(sample_claim_old, sample_user_history)
    date_score_old = validate_date_score(old_str)
    print("Date Score:", date_score_old)
    print("Final Doc Score:", features_old[3])

    print("\n--- Testing Future Date ---")
    sample_claim_future = {
        "claim_amount": 5000.0,
        "doc_match_score": 0.85,
        "bill_date": future_str
    }
    features_future = build_features(sample_claim_future, sample_user_history)
    date_score_future = validate_date_score(future_str)
    print("Date Score:", date_score_future)
    print("Final Doc Score:", features_future[3])

    print("\n--- Full Pipeline Check (Using Valid Profile) ---")
    fraud_probability = predict_fraud(features_valid)
    print("Features:", features_valid)
    print("Fraud Probability:", fraud_probability)
    
    trust_score = calculate_trust_score(sample_user_history)
    print("Trust Score:", trust_score)
    
    adjusted_score = compute_final_risk(fraud_probability, trust_score)
    print("Adjusted Score:", adjusted_score)
