from app.services.fraud_service import (
    build_features,
    predict_fraud,
    calculate_trust_score,
    compute_final_risk
)
from app.services.decision_service import make_decision
from datetime import datetime, timedelta

print("\n===== FULL PIPELINE TEST =====\n")

# ===== TEST CASES =====

test_cases = [
    {
        "name": "Normal Trusted User",
        "claim_data": {
            "claim_amount": 12000,
            "doc_match_score": 0.9,
            "bill_date": (datetime.now() - timedelta(days=10)).strftime("%Y-%m-%d")
        },
        "user_history": {
            "past_claims": 2,
            "avg_claim_amount": 10000,
            "last_claim_days": 30,
            "fraud_count": 0,
            "rejected_claims": 0,
            "total_claims": 2
        }
    },
    {
        "name": "Suspicious User",
        "claim_data": {
            "claim_amount": 45000,
            "doc_match_score": 0.2,
            "bill_date": (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d")
        },
        "user_history": {
            "past_claims": 8,
            "avg_claim_amount": 15000,
            "last_claim_days": 2,
            "fraud_count": 2,
            "rejected_claims": 2,
            "total_claims": 8
        }
    },
    {
        "name": "Old Bill Case",
        "claim_data": {
            "claim_amount": 15000,
            "doc_match_score": 0.9,
            "bill_date": (datetime.now() - timedelta(days=120)).strftime("%Y-%m-%d")
        },
        "user_history": {
            "past_claims": 3,
            "avg_claim_amount": 12000,
            "last_claim_days": 100,
            "fraud_count": 0,
            "rejected_claims": 1,
            "total_claims": 3
        }
    },
    {
        "name": "Future Date Fraud",
        "claim_data": {
            "claim_amount": 20000,
            "doc_match_score": 0.8,
            "bill_date": (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d")
        },
        "user_history": {
            "past_claims": 1,
            "avg_claim_amount": 10000,
            "last_claim_days": 200,
            "fraud_count": 0,
            "rejected_claims": 0,
            "total_claims": 1
        }
    }
]

# ===== RUN TEST =====

for case in test_cases:
    print(f"--- {case['name']} ---")

    features = build_features(case["claim_data"], case["user_history"])
    print("Features:", features)

    fraud_prob = predict_fraud(features)
    print("Fraud Probability:", round(fraud_prob, 3))

    trust = calculate_trust_score(case["user_history"])
    print("Trust Score:", round(trust, 3))

    final = compute_final_risk(fraud_prob, trust)
    decision_output = make_decision(final, trust, fraud_prob)
    print("Final Risk Score:", round(final, 3))
    print("Decision:", decision_output["decision"])
    print("Reason:", decision_output["reason"])

    print()