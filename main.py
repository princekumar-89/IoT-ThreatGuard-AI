from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# ============================================================
# IoT Sentinel AI
# AI-Based IoT Cyberattack and Device Anomaly Detection
# ============================================================

app = FastAPI(
    title="IoT Sentinel AI",
    description="AI-Based IoT Cyberattack and Device Anomaly Detection API",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# PROJECT PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_DIR = BASE_DIR / "ml_model"

MODEL_PATH = MODEL_DIR / "model.pkl"
SCALER_PATH = MODEL_DIR / "scaler.pkl"

DATA_FILE = BASE_DIR / "data" / "iot_data.csv"


# ============================================================
# LOAD ML MODEL
# ============================================================

model = None
scaler = None
model_load_error: Optional[str] = None


def load_models():
    global model, scaler, model_load_error

    try:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Model file not found: {MODEL_PATH}"
            )

        if not SCALER_PATH.exists():
            raise FileNotFoundError(
                f"Scaler file not found: {SCALER_PATH}"
            )

        model = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)

        model_load_error = None

    except Exception as exc:
        model = None
        scaler = None
        model_load_error = str(exc)


load_models()


# ============================================================
# INPUT DATA MODEL
# ============================================================

class DeviceData(BaseModel):
    device_id: str = Field(..., min_length=1)

    temperature: float
    humidity: float
    cpu_usage: float
    memory_usage: float
    network_traffic: float
    packet_rate: float
    connection_count: float
    latency: float
    failed_login_attempts: float
    data_transmission_rate: float


# ============================================================
# FEATURE PREPARATION
# ============================================================

FEATURE_NAMES = [
    "temperature",
    "humidity",
    "cpu_usage",
    "memory_usage",
    "network_traffic",
    "packet_rate",
    "connection_count",
    "latency",
    "failed_login_attempts",
    "data_transmission_rate",
]


def prepare_features(data: DeviceData) -> np.ndarray:

    values = [
        data.temperature,
        data.humidity,
        data.cpu_usage,
        data.memory_usage,
        data.network_traffic,
        data.packet_rate,
        data.connection_count,
        data.latency,
        data.failed_login_attempts,
        data.data_transmission_rate,
    ]

    return np.array(values, dtype=float).reshape(1, -1)


# ============================================================
# RISK CALCULATION
# ============================================================

def calculate_risk(prediction: int, anomaly_score: float) -> str:

    """
    Isolation Forest:

        1  = Normal
       -1  = Anomaly
    """

    if prediction == 1:
        return "Low"

    if anomaly_score < -0.15:
        return "High"

    return "Medium"


# ============================================================
# EXPLANATION GENERATOR
# ============================================================

def generate_explanation(data: DeviceData, prediction: int) -> str:

    suspicious_indicators = []

    if data.cpu_usage >= 85:
        suspicious_indicators.append(
            f"high CPU usage ({data.cpu_usage:.1f}%)"
        )

    if data.memory_usage >= 85:
        suspicious_indicators.append(
            f"high memory usage ({data.memory_usage:.1f}%)"
        )

    if data.temperature >= 70:
        suspicious_indicators.append(
            f"high temperature ({data.temperature:.1f}°C)"
        )

    if data.failed_login_attempts >= 10:
        suspicious_indicators.append(
            f"multiple failed login attempts ({data.failed_login_attempts:.0f})"
        )

    if data.packet_rate >= 150:
        suspicious_indicators.append(
            f"high packet rate ({data.packet_rate:.1f})"
        )

    if data.network_traffic >= 500:
        suspicious_indicators.append(
            f"high network traffic ({data.network_traffic:.1f})"
        )

    if data.connection_count >= 50:
        suspicious_indicators.append(
            f"large number of connections ({data.connection_count:.0f})"
        )

    if data.latency >= 200:
        suspicious_indicators.append(
            f"high network latency ({data.latency:.1f} ms)"
        )

    if data.data_transmission_rate >= 500:
        suspicious_indicators.append(
            f"high data transmission rate ({data.data_transmission_rate:.1f})"
        )

    if prediction == 1:
        return "Device behavior appears normal."

    if suspicious_indicators:
        return (
            "Abnormal device behavior detected. "
            "Suspicious indicators: "
            + ", ".join(suspicious_indicators)
            + "."
        )

    return (
        "Abnormal device behavior detected by "
        "the AI anomaly detection model."
    )


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():

    return {
        "message": "IoT Sentinel AI Backend is running",
        "version": "1.0.0",
        "service": "AI-Based IoT Cyberattack and Device Anomaly Detection",
    }


# ============================================================
# HEALTH ENDPOINT
# ============================================================

@app.get("/health")
def health():

    return {
        "status": "running",
        "model_loaded": model is not None and scaler is not None,
        "model_error": model_load_error,
    }


# ============================================================
# ANALYZE ENDPOINT
# ============================================================

@app.post("/analyze")
def analyze_device(data: DeviceData):

    if model is None or scaler is None:

        raise HTTPException(
            status_code=503,
            detail={
                "message": "ML model is not loaded.",
                "model_error": model_load_error,
                "required_files": [
                    str(MODEL_PATH),
                    str(SCALER_PATH),
                ],
            },
        )

    try:

        # Prepare the 10 sensor/device features
        features = prepare_features(data)

        # Scale features using trained scaler
        scaled_features = scaler.transform(features)

        # AI prediction
        prediction = int(
            model.predict(scaled_features)[0]
        )

        # Isolation Forest anomaly score
        anomaly_score = float(
            model.decision_function(scaled_features)[0]
        )

        # Dashboard status
        status = "Normal" if prediction == 1 else "Anomaly"

        # Risk level
        risk_level = calculate_risk(
            prediction,
            anomaly_score,
        )

        # Explanation
        explanation = generate_explanation(
            data,
            prediction,
        )

        return {
            "device_id": data.device_id,
            "status": status,
            "risk_level": risk_level,
            "anomaly_score": round(anomaly_score, 4),
            "prediction": prediction,
            "explanation": explanation,
        }

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=f"Invalid input data: {str(exc)}",
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=f"AI analysis failed: {str(exc)}",
        )


# ============================================================
# IOT DATA / HISTORY ENDPOINT
# ============================================================

@app.get("/data")
def get_iot_data():

    try:

        if not DATA_FILE.exists():

            return {
                "success": False,
                "message": f"iot_data.csv not found at {DATA_FILE}",
                "count": 0,
                "data": [],
            }

        df = pd.read_csv(DATA_FILE)

        df = df.fillna("")

        return {
            "success": True,
            "count": len(df),
            "data": df.to_dict(orient="records"),
        }

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=f"Unable to read IoT data: {str(exc)}",
        )


# ============================================================
# STARTUP MESSAGE
# ============================================================

@app.on_event("startup")
def startup_event():

    print("=" * 60)
    print("IoT Sentinel AI Backend")
    print("AI-Based IoT Cyberattack and Device Anomaly Detection")
    print("=" * 60)

    if model is not None and scaler is not None:
        print("ML Model      : LOADED")
        print("Scaler        : LOADED")
    else:
        print("ML Model      : NOT LOADED")
        print(f"Reason        : {model_load_error}")

    print(f"Data File     : {DATA_FILE}")
    print("API           : http://127.0.0.1:8000")
    print("Swagger Docs  : http://127.0.0.1:8000/docs")
    print("=" * 60)