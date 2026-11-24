from fastapi import APIRouter, HTTPException
from .. import store
import uuid

router = APIRouter()

@router.get("")
def list_annotations(frameId: str):
    return store.annotations.get(frameId, []) if isinstance(store.annotations.get(frameId), list) else []

# store annotations keyed by frame id in a flat dict
@router.get("/by-frame/{frame_id}")
def by_frame(frame_id: str):
    return store.annotations.get(frame_id, [])

@router.post("")
def create_annotation(payload: dict):
    fid = payload["frameId"]
    ann = {"id": store.uid("ann"), **payload, "createdAt": __import__("time").time()*1000}
    store.annotations.setdefault(fid, []).append(ann)
    return ann

@router.delete("/{ann_id}")
def delete_annotation(ann_id: str):
    for fid, anns in store.annotations.items():
        store.annotations[fid] = [a for a in anns if a["id"] != ann_id]
    return {"deleted": ann_id}

@router.post("/auto/{frame_id}")
def auto_annotate(frame_id: str):
    # find dataset classes
    ds_id = frame_id.split("_")[1] if "_" in frame_id else None
    classes = store.datasets.get(ds_id, {}).get("classes", [{"id":1,"name":"object","color":"#6366f1"}]) if ds_id else [{"id":1,"name":"object","color":"#6366f1"}]
    import random
    n = random.randint(2, 5)
    anns = []
    for _ in range(n):
        cls = random.choice(classes)
        x, y = random.uniform(50, 900), random.uniform(50, 500)
        w, h = random.uniform(60, 200), random.uniform(60, 200)
        a = {"id": store.uid("ann"), "frameId": frame_id, "type": "bbox2d", "classId": cls["id"], "className": cls["name"],
             "bbox": {"x": x, "y": y, "w": w, "h": h}, "annotator": "auto_yolo", "status": "labeled",
             "confidence": round(random.uniform(0.6, 0.95), 3), "createdAt": __import__("time").time()*1000}
        anns.append(a)
    store.annotations.setdefault(frame_id, []).extend(anns)
    return {"count": len(anns), "annotations": anns}