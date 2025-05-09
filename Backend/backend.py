import os
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydub import AudioSegment
import librosa
import torch
import soundfile as sf
from transformers import Wav2Vec2Processor, Wav2Vec2ForSequenceClassification

# ======================
# Configuration Section
# ======================

# Configure logging to track server activity
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),  # Output to console
        logging.FileHandler("server.log")  # Save to log file
    ]
)

# Initialize FastAPI application
app = FastAPI(
    title="Voice Authentication API",
    description="API for detecting deepfake audio using Wav2Vec2 model",
    version="1.0.0"
)

# Configure CORS (Cross-Origin Resource Sharing) middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (restrict in production)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# ======================
# Constants Section
# ======================

MODEL_DIR = "wav2vec2 fold2"  # Path to pretrained model directory
SUPPORTED_AUDIO_TYPES = [
    "audio/wav", "audio/x-wav", "audio/mpeg", "audio/mp3",
    "audio/aac", "audio/flac", "audio/ogg", "audio/x-flac"
]
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB limit

# ======================
# Model Loading Section
# ======================

try:
    logging.info("Initializing Wav2Vec2 model and processor...")
    processor = Wav2Vec2Processor.from_pretrained(MODEL_DIR)
    model = Wav2Vec2ForSequenceClassification.from_pretrained(MODEL_DIR)
    logging.info("Model and processor loaded successfully")
except Exception as e:
    logging.critical(f"Failed to load model: {str(e)}")
    raise RuntimeError(f"Model initialization failed: {str(e)}")

# ======================
# Core Functions Section
# ======================

def process_audio(file_path: str) -> str:
    """
    Classify audio as real or fake using Wav2Vec2 model
    
    Args:
        file_path: Path to audio file to process
        
    Returns:
        "real" or "fake" classification result
        
    Raises:
        RuntimeError: If audio processing fails
    """
    try:
        # Load audio file and ensure proper sample rate
        waveform, sample_rate = librosa.load(file_path, sr=None)
        target_sample_rate = 16000  # Wav2Vec2 expects 16kHz
        
        if sample_rate != target_sample_rate:
            waveform = librosa.resample(
                waveform, 
                orig_sr=sample_rate, 
                target_sr=target_sample_rate
            )
        
        # Process audio through the model
        inputs = processor(
            waveform, 
            sampling_rate=target_sample_rate, 
            return_tensors="pt", 
            padding=True
        )
        
        with torch.no_grad():
            outputs = model(**inputs)
            prediction = outputs.logits.argmax(dim=1).item()
        
        return "real" if prediction == 1 else "fake"
        
    except Exception as e:
        logging.error(f"Audio processing failed: {str(e)}")
        raise RuntimeError(f"Processing error: {str(e)}")

def convert_to_wav(input_path: str, output_path: str):
    """
    Convert any audio file to standardized WAV format at 16kHz
    
    Args:
        input_path: Path to source audio file
        output_path: Path to save converted WAV file
        
    Raises:
        RuntimeError: If conversion fails
    """
    try:
        # Load audio file using pydub
        audio = AudioSegment.from_file(input_path)
        
        # Export as WAV format
        audio.export(output_path, format="wav")
        
        # Ensure 16kHz sample rate using librosa
        waveform, sample_rate = librosa.load(output_path, sr=None)
        if sample_rate != 16000:
            waveform = librosa.resample(waveform, orig_sr=sample_rate, target_sr=16000)
            sf.write(output_path, waveform, 16000)
            
    except Exception as e:
        logging.error(f"Audio conversion failed: {str(e)}")
        raise RuntimeError(f"Conversion error: {str(e)}")

# ======================
# API Endpoints Section
# ======================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Voice Authentication API",
        "status": "operational",
        "model_loaded": bool(model and processor)
    }

@app.get("/health-check")
async def health_check():
    """Comprehensive system health check"""
    return {
        "status": "healthy",
        "model": "loaded" if model and processor else "not loaded",
        "supported_formats": SUPPORTED_AUDIO_TYPES,
        "max_file_size": f"{MAX_FILE_SIZE / (1024*1024)} MB"
    }

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    """
    Endpoint for audio file upload and classification
    
    Process flow:
    1. Validate file type
    2. Save temporary file
    3. Convert to standardized WAV
    4. Process through model
    5. Clean up temporary files
    6. Return classification result
    """
    temp_input = f"temp_upload_{file.filename}"
    temp_output = f"converted_{os.path.splitext(file.filename)[0]}.wav"
    
    try:
        # Validate file type
        if file.content_type not in SUPPORTED_AUDIO_TYPES:
            raise HTTPException(
                status_code=415,
                detail={
                    "error": "Unsupported file type",
                    "supported_types": SUPPORTED_AUDIO_TYPES,
                    "received_type": file.content_type
                }
            )
        
        # Save uploaded file temporarily
        with open(temp_input, "wb") as f:
            content = await file.read()
            
            # Check file size
            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=413,
                    detail=f"File too large. Max size: {MAX_FILE_SIZE / (1024*1024)} MB"
                )
            f.write(content)
        
        # Convert to standardized format
        convert_to_wav(temp_input, temp_output)
        
        # Process and classify
        result = process_audio(temp_output)
        
        return {
            "result": result,
            "filename": file.filename,
            "processing": "successful"
        }
        
    except HTTPException as http_err:
        logging.warning(f"Client error: {http_err.detail}")
        raise http_err
    except Exception as e:
        logging.error(f"Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Processing failed",
                "message": str(e)
            }
        )
    finally:
        # Clean up temporary files
        for temp_file in [temp_input, temp_output]:
            if os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                except Exception as e:
                    logging.warning(f"Failed to delete temp file {temp_file}: {str(e)}")

# ======================
# Server Startup
# ======================

if __name__ == "__main__":
    import uvicorn
    
    # Configuration for production use
    uvicorn.run(
        app,
        host="0.0.0.0",  # Bind to all network interfaces
        port=8000,
        log_level="info",
        timeout_keep_alive=60  # Keep connections alive for 60 seconds
    )