"""
SkinSafe FastAPI Application Entrypoint.
Configures CORS, middleware, metadata, and routes.
"""

import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load .env from backend directory, and root if needed.
try:
    from dotenv import load_dotenv
    _backend_env = Path(__file__).resolve().parent.parent / ".env"
    _root_env = Path(__file__).resolve().parent.parent.parent / ".env"
    if _backend_env.exists():
        load_dotenv(dotenv_path=_backend_env, override=False)
    elif _root_env.exists():
        load_dotenv(dotenv_path=_root_env, override=False)
except ImportError:
    pass  # python-dotenv not installed; rely on host env

from .api import router

app = FastAPI(
    title="SkinSafe Computational Chemistry Engine",
    description=(
        "Computational Cosmetic Ingredient & Skin Permeability Analysis API. "
        "Calculates molecular descriptors, evaluates Lipinski & Ghose drug-likeness rules, "
        "and estimates transdermal diffusion using the Potts-Guy model."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration
cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
cors_origin_regex = os.getenv("CORS_ORIGIN_REGEX", r"https://.*\.vercel\.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=cors_origin_regex if cors_origin_regex else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def root():
    return {
        "service": "SkinSafe API",
        "status": "online",
        "documentation": "/docs",
        "version": "1.0.0",
    }


@app.get("/health")
def health_check():
    """Top-level health check endpoint for cloud host monitors (Render, AWS, etc.)."""
    from rdkit import __version__ as rdkit_version

    return {
        "status": "ok",
        "service": "SkinSafe API",
        "version": "1.0.0",
        "rdkit_version": rdkit_version,
        "engine_ready": True,
    }

