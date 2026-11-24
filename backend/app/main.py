from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import datasets, frames, annotations, qa, synthetic, export, public

app = FastAPI(title="RoboData Studio API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(datasets.router, prefix="/api/datasets", tags=["datasets"])
app.include_router(frames.router, prefix="/api/frames", tags=["frames"])
app.include_router(annotations.router, prefix="/api/annotations", tags=["annotations"])
app.include_router(qa.router, prefix="/api/qa", tags=["qa"])
app.include_router(synthetic.router, prefix="/api/synthetic", tags=["synthetic"])
app.include_router(export.router, prefix="/api/export", tags=["export"])
app.include_router(public.router, prefix="/api/public", tags=["public"])

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "robodata-studio"}