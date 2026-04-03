# Decision service
# Contains business logic for overall routing of claims based on risk signals

def make_decision(final_risk, trust_score, fraud_probability):
    if final_risk > 0.8 or fraud_probability > 0.85:
        return {
            "decision": "REJECTED",
            "reason": "High fraud probability detected - automatic rejection"
        }

    if trust_score > 0.8:
        approve_threshold = 0.4
    else:
        approve_threshold = 0.3
        
    if final_risk < approve_threshold:
        decision = "APPROVED"
        reason = "Risk is within acceptable threshold for automatic approval."
    elif final_risk < 0.6:
        decision = "REVIEW"
        reason = "Risk is moderate, claim flagged for manual reviewer verification."
    else:
        decision = "REJECTED"
        reason = "Risk score exceeds maximum allowable limit for this profile."
        
    return {
        "decision": decision,
        "reason": f"Based on risk ({final_risk:.2f}) and trust score ({trust_score:.2f}) - {reason}"
    }

if __name__ == "__main__":
    test_cases = [
        {"name": "Low Risk + High Trust", "risk": 0.2, "trust": 0.9},
        {"name": "Medium Risk + Low Trust", "risk": 0.5, "trust": 0.5},
        {"name": "High Risk", "risk": 0.8, "trust": 0.4},
    ]

    print("=== DECISION ENGINE TESTS ===\n")
    for tc in test_cases:
        result = make_decision(tc["risk"], tc["trust"], tc.get("fraud_prob", tc["risk"]))
        print(f"--- {tc['name']} ---")
        print(f"Final Risk:  {tc['risk']}")
        print(f"Trust Score: {tc['trust']}")
        print(f"-> Decision: {result['decision']}")
        print(f"-> Reason:   {result['reason']}\n")
