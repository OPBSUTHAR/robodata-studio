from fastapi import APIRouter, HTTPException, Query
from .. import store

router = APIRouter()

@router.post("/version")
def tag_version(datasetId: str = Query(...), changes: str = Query(...)):
    if datasetId not in store.datasets:
        raise HTTPException(404, "dataset not found")
    import time, hashlib
    last = store.versions[datasetId][-1] if store.versions[datasetId] else None
    ver = str(round(float(last["version"]) + 0.1, 1)) if last else "1.0.0"
    v = {"id": store.uid("ver"), "datasetId": datasetId, "version": ver,
         "createdAt": int(time.time()*1000), "frameCount": len(store.frames.get(datasetId, [])),
         "changes": changes, "hash": store.uid("hash")[:8]}
    store.versions[datasetId].append(v)
    return v

@router.get("/coco")
def export_coco(datasetId: str = Query(...)):
    if datasetId not in store.datasets:
        raise HTTPException(404, "dataset not found")
    if not store.frames.get(datasetId):
        store.gen_frames(datasetId, 60)
    ds = store.datasets[datasetId]
    frames = store.frames[datasetId]
    images = [{"id": f["id"], "file_name": f"{f['id']}.png", "width": f["width"], "height": f["height"]} for f in frames]
    categories = [{"id": c["id"], "name": c["name"]} for c in ds["classes"]]
    anns = []
    aid = 1
    for f in frames:
        for a in store.annotations.get(f["id"], []):
            if "bbox" in a and a["bbox"]:
                b = a["bbox"]
                anns.append({"id": aid, "image_id": f["id"], "category_id": a["classId"],
                             "bbox": [b["x"], b["y"], b["w"], b["h"]], "area": b["w"]*b["h"], "iscrowd": 0})
                aid += 1
    return {"info": {"description": ds["name"], "version": ds["version"]}, "images": images, "annotations": anns, "categories": categories}