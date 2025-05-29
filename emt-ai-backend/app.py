from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from vosk import Model, KaldiRecognizer
import subprocess, wave, json, os, uuid
import os
from dotenv import load_dotenv

load_dotenv()                               # reads .env
MODEL_PATH = os.getenv("VOSK_MODEL_PATH")
print("Vosk model path:", MODEL_PATH)
print("Exists?", os.path.isdir(MODEL_PATH))



app = FastAPI()

@app.get("/health")
async def health_check():
    return {"status": "ok"}

from fastapi import UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from vosk import Model, KaldiRecognizer
import asyncio, subprocess, json

# Load model once
model = Model(MODEL_PATH)

@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    data = await audio.read()
    if not data:
        raise HTTPException(400, "No audio data received")

    # Convert any format → 16kHz mono WAV with ffmpeg
    proc = await asyncio.create_subprocess_exec(
        "ffmpeg", "-i", "pipe:0",
        "-ar", "16000", "-ac", "1", "-f", "wav", "pipe:1",
        stdin=subprocess.PIPE, stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
    )
    wav_bytes, _ = await proc.communicate(data)

    # Run recognition
    rec = KaldiRecognizer(model, 16000.0)
    rec.SetWords(True)
    words = []
    for i in range(0, len(wav_bytes), 4000):
        chunk = wav_bytes[i : i + 4000]
        if rec.AcceptWaveform(chunk):
            words.extend(json.loads(rec.Result()).get("result", []))
    words.extend(json.loads(rec.FinalResult()).get("result", []))

    text = " ".join(w["word"] for w in words)
    return JSONResponse({"words": words, "text": text})

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["POST"], allow_headers=["*"])

MODEL_PATH = "models/vosk-model-small-en-us-0.15"
if not os.path.isdir(MODEL_PATH):
    raise RuntimeError(f"Model not found at {MODEL_PATH}")
vosk_model = Model(MODEL_PATH)

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    # save upload
    in_path = f"/tmp/{uuid.uuid4()}.webm"
    wav_path = f"/tmp/{uuid.uuid4()}.wav"
    with open(in_path, "wb") as f:
        f.write(await file.read())

    # convert to 16 kHz mono WAV
    cmd = ["ffmpeg","-y","-i", in_path, "-ar","16000","-ac","1", wav_path]
    res = subprocess.run(cmd, capture_output=True)
    if res.returncode != 0:
        raise HTTPException(500, f"ffmpeg error: {res.stderr.decode()}")

    # run Vosk
    wf = wave.open(wav_path, "rb")
    rec = KaldiRecognizer(vosk_model, wf.getframerate())
    rec.SetWords(True)
    segments = []
    while True:
        data = wf.readframes(4000)
        if not data: break
        if rec.AcceptWaveform(data):
            segments.append(json.loads(rec.Result()))
    segments.append(json.loads(rec.FinalResult()))
    wf.close()

    # cleanup
    os.remove(in_path)
    os.remove(wav_path)
    return {"segments": segments}
