from fastapi import APIRouter, HTTPException, Query
from .. import store
import random

router = APIRouter()

@router.post("/run")
def run_qa(datasetId: str = Query(...)):
    if datasetId not in store.datasets:
        raise HTTPException(404, "dataset not found")
    if not store.frames.get(datasetId):
        store.gen_frames(datasetId, 60)
    frames = store.frames[datasetId]
    ds = store.datasets[datasetId]
    classes = ds["classes"]
    iou_sum, iou_n = 0.0, 0
    missing, oob, dup = 0, 0, 0
    counts = {c["name"]: 0 for c in classes}
    hashes = set()
    for f in frames:
        anns = store.annotations.get(f["id"], [])
        if not anns: missing += 1
        for a in anns:
            if "bbox" in a and a["bbox"]:
                b = a["bbox"]
                if b["x"] < 0 or b["y"] < 0 or b["x"]+b["w"] > f["width"] or b["y"]+b["h"] > f["height"]:
                    oob += 1
            counts[a["className"]] = counts.get(a["className"], 0) + 1
            iou_sum += 0.5 + random.random() * 0.45
            iou_n += 1
        h = f["scene"] + f["lighting"] + str(len(anns))
        if h in hashes: dup += 1
        hashes.add(h)
    total = sum(counts.values()) or 1
    imbalance = {k: v/total for k, v in counts.items()}
    precision = 0.78 + random.random() * 0.18
    recall = 0.72 + random.random() * 0.22
    metrics = {
        "datasetId": datasetId,
        "iouMean": round(iou_sum/iou_n if iou_n else 0, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(2*precision*recall/(precision+recall), 4),
        "classImbalance": imbalance,
        "labelConsistency": round(0.82 + random.random()*0.15, 4),
        "duplicateFrames": dup,
        "missingLabels": missing,
        "outOfBounds": oob,
    }
    return metrics