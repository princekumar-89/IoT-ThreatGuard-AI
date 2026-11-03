import numpy as np
import joblib
from pathlib import Path
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler


# ============================================================
# IoT Sentinel AI - ML Model Training
# AI-Based IoT Cyberattack and Device Anomaly Detection
# ============================================================

print("=" * 60)
print("IoT Sentinel AI - ML Model Training")
print("=" * 60)


# ------------------------------------------------------------
# 1. Project paths
# ------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "ml_model"

MODEL_PATH = MODEL_DIR / "model.pkl"
SCALER_PATH = MODEL_DIR / "scaler.pkl"


# ------------------------------------------------------------
# 2. Generate NORMAL IoT device data
#
# IMPORTANT:
# Isolation Forest should learn NORMAL behaviour.
# We are NOT training it with attack/anomaly samples.
# ------------------------------------------------------------

np.random.seed(42)

number_of_samples = 2000

normal_data = np.column_stack([
    np.random.normal(35, 5, number_of_samples),     # temperature
    np.random.normal(50, 10, number_of_samples),    # humidity
    np.random.normal(40, 10, number_of_samples),    # cpu_usage
    np.random.normal(55, 10, number_of_samples),    # memory_usage
    np.random.normal(120, 30, number_of_samples),   # network_traffic
    np.random.normal(40, 10, number_of_samples),    # packet_rate
    np.random.normal(10, 4, number_of_samples),     # connection_count
    np.random.normal(25, 8, number_of_samples),     # latency
    np.random.normal(2, 1.5, number_of_samples),    # failed_login_attempts
    np.random.normal(80, 20, number_of_samples)     # data_transmission_rate
])

# Make sure values do not become negative
normal_data = np.maximum(normal_data, 0)


# ------------------------------------------------------------
# 3. Scale the NORMAL data
# ------------------------------------------------------------

scaler = StandardScaler()

X_normal = scaler.fit_transform(normal_data)


# ------------------------------------------------------------
# 4. Train Isolation Forest
# ------------------------------------------------------------

model = IsolationForest(
    n_estimators=300,
    contamination=0.02,
    random_state=42,
    n_jobs=-1
)

model.fit(X_normal)


# ------------------------------------------------------------
# 5. Save model and scaler
# ------------------------------------------------------------

MODEL_DIR.mkdir(parents=True, exist_ok=True)

joblib.dump(model, MODEL_PATH)
joblib.dump(scaler, SCALER_PATH)


# ------------------------------------------------------------
# 6. Test the trained model
# ------------------------------------------------------------

test_normal = np.array([[
    35,     # temperature
    50,     # humidity
    40,     # cpu_usage
    55,     # memory_usage
    120,    # network_traffic
    40,     # packet_rate
    10,     # connection_count
    25,     # latency
    2,      # failed_login_attempts
    80      # data_transmission_rate
]])


test_anomaly = np.array([[
    72,     # temperature
    30,     # humidity
    95,     # cpu_usage
    90,     # memory_usage
    700,    # network_traffic
    180,    # packet_rate
    70,     # connection_count
    250,    # latency
    15,     # failed_login_attempts
    700     # data_transmission_rate
]])


normal_scaled = scaler.transform(test_normal)
anomaly_scaled = scaler.transform(test_anomaly)


normal_prediction = model.predict(normal_scaled)[0]
normal_score = model.decision_function(normal_scaled)[0]

anomaly_prediction = model.predict(anomaly_scaled)[0]
anomaly_score = model.decision_function(anomaly_scaled)[0]


# ------------------------------------------------------------
# 7. Display test results
# ------------------------------------------------------------

print()
print("MODEL TEST RESULTS")
print("-" * 60)

print(
    f"Normal Device   -> "
    f"{'Normal' if normal_prediction == 1 else 'Anomaly'} "
    f"(Score: {normal_score:.4f})"
)

print(
    f"Anomaly Device  -> "
    f"{'Normal' if anomaly_prediction == 1 else 'Anomaly'} "
    f"(Score: {anomaly_score:.4f})"
)

print()
print("MODEL:")
print(MODEL_PATH)

print()
print("SCALER:")
print(SCALER_PATH)

print()
print("=" * 60)
print("Training completed successfully.")
print("=" * 60)