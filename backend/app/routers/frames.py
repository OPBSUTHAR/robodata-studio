from fastapi import APIRouter, HTTPException, Query
from .. import store

router = APIRouter()

@router.get("")
def list_frames(datasetId: str = Query(...), limit: int = Query(60)):
    if datasetId not in store.frames:
        raise HTTPException(404, "dataset not found")
    if not store.frames[datasetId]:
        store.gen_frames(datasetId, min(limit, 200))
    return store.frames[datasetId][:limit]

@router.get("/{frame_id}")
def get_frame(frame_id: str):
    for fs in store.frames.values():
        for f in fs:
            if f["id"] == frame_id:
                return f
    raise HTTPException(404, "not found")