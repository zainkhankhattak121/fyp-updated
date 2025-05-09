from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Union, List, Optional
from gtts import gTTS
from pydub import AudioSegment, effects
import noisereduce as nr
import numpy as np
from pathlib import Path
import os
import uuid
import shutil
import tempfile
import re
import string
from TTS.api import TTS

# Disable GPU
os.environ["CUDA_VISIBLE_DEVICES"] = ""
os.environ["TORCH_CPU_ONLY"] = "1"

app = FastAPI(
    title="Enhanced Voice API",
    description="Text-to-Speech and Voice Cloning with Emotions and Noise Reduction (CPU only)",
    version="1.3.0"
)

# CORS settings - allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory for audio files
TEMP_DIR = Path("temp_audio")
TEMP_DIR.mkdir(exist_ok=True)

# Serve static audio files
app.mount("/temp_audio", StaticFiles(directory=TEMP_DIR), name="temp_audio")

# Constants
MAX_TEXT_LENGTH = 5000
EMOTIONS = ["Happy", "Sad", "Angry", "Surprise", "Fear", "Disgust", "Neutral"]

# Supported languages for gTTS (Standard TTS)
STANDARD_LANGUAGES = {
    'en': 'English',
    'en-uk': 'English (UK)',
    'en-us': 'English (US)',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'hi': 'Hindi',
    'zh': 'Chinese (Mandarin)',
    'ja': 'Japanese',
    'ko': 'Korean',
    'ar': 'Arabic',
    'ru': 'Russian',
    'pt': 'Portuguese',
    'pt-br': 'Portuguese (Brazil)',
    'ur': 'Urdu',
    'ta': 'Tamil',
    'bn': 'Bengali',
    'tr': 'Turkish',
    'it': 'Italian',
    'nl': 'Dutch',
    'sv': 'Swedish',
    'fi': 'Finnish',
    'da': 'Danish',
    'no': 'Norwegian',
    'pl': 'Polish',
    'id': 'Indonesian',
    'th': 'Thai',
    'vi': 'Vietnamese',
    'el': 'Greek',
    'cs': 'Czech',
    'hu': 'Hungarian',
    'ro': 'Romanian',
    'sk': 'Slovak',
    'uk': 'Ukrainian',
    'he': 'Hebrew',
    'fa': 'Persian',
    'mr': 'Marathi',
    'te': 'Telugu',
    'kn': 'Kannada',
    'ml': 'Malayalam',
    'gu': 'Gujarati',
    'pa': 'Punjabi'
}

# Supported languages for cloning (XTTS v2 supported languages)
CLONE_LANGUAGES = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ar': 'Arabic',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'hi': 'Hindi',
    'tr': 'Turkish',
    'pl': 'Polish',
    'nl': 'Dutch'
}

def preprocess_text(text: str) -> str:
    """Clean and normalize text for TTS with better Unicode handling"""
    # Remove extra whitespace
    text = ' '.join(text.split())
    # Remove control characters but preserve Unicode letters and common punctuation
    text = re.sub(r'[\x00-\x1F\x7F-\x9F]', '', text)
    return text

def normalize_audio(audio: AudioSegment) -> AudioSegment:
    """Normalize audio volume and reduce noise"""
    try:
        # Normalize loudness
        audio = effects.normalize(audio)

        # Convert to numpy array for noise reduction
        samples = np.array(audio.get_array_of_samples())
        reduced_noise = nr.reduce_noise(
            y=samples,
            sr=audio.frame_rate,
            stationary=True,
            prop_decrease=0.75
        )
        
        # Convert back to AudioSegment
        return AudioSegment(
            reduced_noise.tobytes(),
            frame_rate=audio.frame_rate,
            sample_width=audio.sample_width,
            channels=audio.channels
        )
    except Exception as e:
        print(f"Audio normalization error: {e}")
        return audio  # Return original if processing fails

def adjust_emotion(audio: AudioSegment, emotion: str) -> AudioSegment:
    """Adjust audio parameters based on emotion"""
    if emotion == "Happy":
        return audio.speedup(playback_speed=1.1).apply_gain(3)
    elif emotion == "Sad":
        return audio.speedup(playback_speed=0.9).apply_gain(-3)
    elif emotion == "Angry":
        return audio.speedup(playback_speed=1.2).apply_gain(5)
    elif emotion == "Surprise":
        return audio.speedup(playback_speed=1.3).apply_gain(8)
    elif emotion == "Fear":
        return audio.speedup(playback_speed=1.4).apply_gain(-5)
    elif emotion == "Disgust":
        return audio.speedup(playback_speed=0.8).apply_gain(-2)
    else:  # Neutral or unknown
        return audio

def convert_to_wav(input_path: str, output_path: str) -> bool:
    """Convert any audio file to WAV format using pydub"""
    try:
        audio = AudioSegment.from_file(input_path)
        audio.export(output_path, format="wav")
        return True
    except Exception as e:
        print(f"Audio conversion error: {e}")
        return False

@app.get("/")
async def root():
    return JSONResponse(content={"message": "Enhanced Voice API running", "docs": "/docs"})

@app.post("/generate")
async def generate_voice(
    text: str = Form(...),
    language: str = Form("en"),
    emotion: str = Form(None),
    speed: float = Form(1.0),
    breath_effect: float = Form(0.5),
    intonation: float = Form(0.5),
    articulation: float = Form(0.5),
    request: Request = None
):
    """Generate speech from text using gTTS with emotion support"""
    text = preprocess_text(text)

    if len(text.strip()) > MAX_TEXT_LENGTH:
        raise HTTPException(status_code=400, detail=f"Text too long (max {MAX_TEXT_LENGTH} chars)")

    if language not in STANDARD_LANGUAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language. Supported: {', '.join(STANDARD_LANGUAGES.keys())}"
        )

    if emotion and emotion not in EMOTIONS:
        raise HTTPException(status_code=400, detail=f"Invalid emotion. Choose from: {', '.join(EMOTIONS)}")

    filename = f"generated_{uuid.uuid4()}.wav"
    filepath = TEMP_DIR / filename

    try:
        # Generate MP3 using gTTS with explicit UTF-8 handling
        tts = gTTS(text=text, lang=language, lang_check=False)
        mp3_path = filepath.with_suffix(".mp3")
        tts.save(mp3_path)

        # Convert MP3 to WAV and process
        audio = AudioSegment.from_mp3(mp3_path)
        
        # Apply speed adjustment
        if speed != 1.0:
            audio = audio.speedup(playback_speed=speed)
        
        # Apply breath effect (volume adjustment)
        if breath_effect != 0.5:
            gain = (breath_effect - 0.5) * 10  # Convert 0-1 scale to -5 to +5 dB
            audio = audio.apply_gain(gain)
            
        # Apply intonation (pitch shift)
        if intonation != 0.5:
            shift = (intonation - 0.5) * 10  # Convert 0-1 scale to -5 to +5 semitones
            audio = audio._spawn(audio.raw_data, overrides={
                "frame_rate": int(audio.frame_rate * (2.0 ** (shift / 12.0)))
            }).set_frame_rate(audio.frame_rate)
            
        # Apply articulation (equalization)
        if articulation != 0.5:
            # Simple EQ adjustment - boost highs for better articulation
            audio = audio.high_pass_filter(1000 * articulation)
        
        audio = normalize_audio(audio)
        
        if emotion:
            audio = adjust_emotion(audio, emotion)
        
        audio.export(filepath, format="wav")
        os.remove(mp3_path)  # Cleanup mp3
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Voice generation failed. This might be due to unsupported characters in the text or language limitations. Error: {str(e)}"
        )

    # For Android localhost, use 10.0.2.2 instead of localhost
    base_url = str(request.base_url)
    if "localhost" in base_url or "127.0.0.1" in base_url:
        base_url = base_url.replace("localhost", "10.0.2.2").replace("127.0.0.1", "10.0.2.2")

    return JSONResponse(content={
        "file_url": f"{base_url}temp_audio/{filename}",
        "text_length": len(text),
        "language": language,
        "emotion": emotion or "Neutral"
    })

@app.post("/clone")
async def clone_voice(
    voice_file: UploadFile = File(...),
    text: str = Form(...),
    language: str = Form("en"),
    emotion: str = Form(None),
    speed: float = Form(1.0),
    breath_effect: float = Form(0.5),
    intonation: float = Form(0.5),
    articulation: float = Form(0.5),
    request: Request = None
):
    """Clone voice from sample with emotion support"""
    text = preprocess_text(text)

    if len(text.strip()) > MAX_TEXT_LENGTH:
        raise HTTPException(status_code=400, detail=f"Text too long (max {MAX_TEXT_LENGTH} chars)")

    if language not in CLONE_LANGUAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language for cloning. Supported: {', '.join(CLONE_LANGUAGES.keys())}"
        )

    if emotion and emotion not in EMOTIONS:
        raise HTTPException(status_code=400, detail=f"Invalid emotion. Choose from: {', '.join(EMOTIONS)}")

    # Create temp directory
    temp_dir = tempfile.mkdtemp()
    try:
        # Save uploaded file (keep original extension)
        temp_input_path = os.path.join(temp_dir, f"voice_{uuid.uuid4()}{Path(voice_file.filename).suffix}")
        with open(temp_input_path, "wb") as f:
            shutil.copyfileobj(voice_file.file, f)
        
        # Convert to WAV if needed
        voice_path = os.path.join(temp_dir, f"voice_{uuid.uuid4()}.wav")
        if not convert_to_wav(temp_input_path, voice_path):
            raise HTTPException(status_code=400, detail="Unsupported audio format")
        
        # Preprocess the input voice file
        input_audio = AudioSegment.from_wav(voice_path)
        input_audio = normalize_audio(input_audio)
        input_audio.export(voice_path, format="wav")

        # Initialize TTS model
        tts = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2", progress_bar=False, gpu=False)

        # Generate cloned voice
        output_path = TEMP_DIR / f"cloned_{uuid.uuid4()}.wav"
        tts.tts_to_file(
            text=text,
            speaker_wav=voice_path,
            language=language,
            file_path=str(output_path)
        )

        # Load the generated audio for post-processing
        audio = AudioSegment.from_wav(output_path)
        
        # Apply speed adjustment
        if speed != 1.0:
            audio = audio.speedup(playback_speed=speed)
        
        # Apply breath effect (volume adjustment)
        if breath_effect != 0.5:
            gain = (breath_effect - 0.5) * 10  # Convert 0-1 scale to -5 to +5 dB
            audio = audio.apply_gain(gain)
            
        # Apply intonation (pitch shift)
        if intonation != 0.5:
            shift = (intonation - 0.5) * 10  # Convert 0-1 scale to -5 to +5 semitones
            audio = audio._spawn(audio.raw_data, overrides={
                "frame_rate": int(audio.frame_rate * (2.0 ** (shift / 12.0)))
            }).set_frame_rate(audio.frame_rate)
            
        # Apply articulation (equalization)
        if articulation != 0.5:
            # Simple EQ adjustment - boost highs for better articulation
            audio = audio.high_pass_filter(1000 * articulation)
        
        # Apply emotion if specified
        if emotion:
            audio = adjust_emotion(audio, emotion)
            
        # Save the final processed audio
        audio.export(output_path, format="wav")

    except Exception as e:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Voice cloning failed. This might be due to unsupported characters in the text or issues with the voice sample. Error: {str(e)}"
        )

    shutil.rmtree(temp_dir, ignore_errors=True)

    # For Android localhost, use 10.0.2.2 instead of localhost
    base_url = str(request.base_url)
    if "localhost" in base_url or "127.0.0.1" in base_url:
        base_url = base_url.replace("localhost", "10.0.2.2").replace("127.0.0.1", "10.0.2.2")

    return JSONResponse(content={
        "file_url": f"{base_url}temp_audio/{output_path.name}",
        "text_length": len(text),
        "language": language,
        "emotion": emotion or "Neutral"
    })

@app.get("/temp_audio/{filename}")
async def get_audio(filename: str):
    file_path = TEMP_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, media_type="audio/wav", filename=filename)

@app.get("/supported_languages")
async def get_supported_languages():
    """Get supported languages for both endpoints"""
    return JSONResponse(content={
        "standard_tts": STANDARD_LANGUAGES,
        "clone": CLONE_LANGUAGES
    })

@app.get("/supported_emotions")
async def get_supported_emotions():
    """Get supported emotions"""
    return JSONResponse(content={"emotions": EMOTIONS})

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