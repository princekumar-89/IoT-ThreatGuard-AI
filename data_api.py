from fastapi import APIRouter
import pandas as pd
import os

router = APIRouter()

DATA_FILE = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "data",
    "iot_data.csv"
)


@router.get("/data")
def get_iot_data():
    try:
        if not os.path.exists(DATA_FILE):
            return {
                "success": False,
                "message": "iot_data.csv not found",
                "data": []
            }

        df = pd.read_csv(DATA_FILE)

        # NaN values ko safe JSON values mein convert karna
        df = df.fillna("")

        return {
            "success": True,
            "count": len(df),
            "data": df.to_dict(orient="records")
        }

    except Exception as e:
        return {
            "success": False,
            "message": str(e),
            "data": []
        }