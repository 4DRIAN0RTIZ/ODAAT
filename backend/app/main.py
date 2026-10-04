import json
import random
from datetime import date
from functools import lru_cache
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware

from fastapi import FastAPI, HTTPException

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "reflections.json"

app = FastAPI(title="Reflexiones Diarias API", version="1.0.0")
CORS_ORIGINS = ["http://odaat.localhost:1355", "http://localhost:4321", "https://odaat.cuevaneander.tech"]
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@lru_cache
def _load() -> dict[str, dict]:
    if not DATA_PATH.exists():
        raise RuntimeError(f"{DATA_PATH} not found — run scrape_all.py first")
    return json.loads(DATA_PATH.read_text(encoding="utf-8"))


def _get(month: int, day: int) -> dict:
    key = f"{month:02d}-{day:02d}"
    reflection = _load().get(key)
    if reflection is None:
        raise HTTPException(status_code=404, detail=f"no reflection for {key}")
    return reflection


@app.get("/reflections")
def list_all():
    return list(_load().values())


@app.get("/reflections/today")
def today():
    now = date.today()
    return _get(now.month, now.day)


@app.get("/reflections/random")
def random_reflection():
    return random.choice(list(_load().values()))


@app.get("/reflections/{month}-{day}")
def by_month_day(month: int, day: int):
    return _get(month, day)
