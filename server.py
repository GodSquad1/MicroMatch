from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
import io

# Load your custom YOLO model
model = YOLO("dtv2.pt")



app = FastAPI()

# Allow requests from your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # in production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze-id")
async def analyze_id(file: UploadFile = File(...)):
    try:
        # Read image
        img_bytes = await file.read()
        img = Image.open(io.BytesIO(img_bytes))

        # Run YOLO prediction
        results = model(img)

        # Extract results
        detected_labels = []
        confidences = []

        for r in results:
            boxes = r.boxes
            for box in boxes:
                label = model.names[int(box.cls[0])]
                conf = float(box.conf[0])
                detected_labels.append(label)
                confidences.append(conf)

        verified = len(detected_labels) > 0  # basic logic; tweak as needed

        return {
            "detected": detected_labels,
            "confidence": max(confidences) if confidences else 0,
            "verified": verified,
            "message": "Analysis complete"
        }

    except Exception as e:
        return {
            "detected": [],
            "confidence": 0,
            "verified": False,
            "message": f"Error: {str(e)}"
        }
    
@app.get("/")
def read_root():
    return {"message": "Server is running!"}
