from fastapi import APIRouter, HTTPException
from .. import store

router = APIRouter()

@router.get("")
def list_datasets():
    return list(store.datasets.values())

@router.get("/{dataset_id}")
def get_dataset(dataset_id: str):
    d = store.datasets.get(dataset_id)
    if not d: raise HTTPException(404, "not found")
    return d

@router.post("")
def create_dataset(payload: dict):
    did = store.uid("ds")
    d = {"id": did, "name": payload.get("name","Untitled"), "description": payload.get("description",""),
         "version": "1.0.0", "modality": payload.get("modality", ["rgb"]), "classes": payload.get("classes", [{"id":1,"name":"object","color":"#6366f1"}]),
         "frameCount": payload.get("frames", 1000), "annotatedCount": 0,
         "createdAt": int(__import__("time").time()*1000), "updatedAt": int(__import__("time").time()*1000),
         "tags": payload.get("tags", []), "source": payload.get("source","real"), "license": "Internal"}
    store.datasets[did] = d
    store.frames[did] = []
    store.annotations[did] = []
    store.versions[did] = []
    return d

@router.get("/{dataset_id}/versions")
def versions(dataset_id: str):
    return store.versions.get(dataset_id, [])