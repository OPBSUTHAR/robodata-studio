from fastapi import APIRouter, HTTPException
from .. import store
import random, time

router = APIRouter()

@router.post("/generate")
def generate(payload: dict):
    frames_n = payload.get("frames", 100)
    seed = payload.get("seed", 42)
    random.seed(seed)
    did = store.uid("ds")
    d = {"id": did, "name": f"Synthetic_DomainRand_{str(did)[-4:]}", "description": f"Synthetic dataset. Seed {seed}.",
         "version": "1.0.0", "modality": ["rgb","depth","pointcloud"],
         "classes": [{"id":1,"name":"robot_arm","color":"#6366f1"},{"id":2,"name":"workpiece","color":"#22c55e"},{"id":3,"name":"tool","color":"#a855f7"}],
         "frameCount": frames_n, "annotatedCount": frames_n,
         "createdAt": int(time.time()*1000), "updatedAt": int(time.time()*1000),
         "tags": ["synthetic","domain_randomization"], "source": "synthetic", "license": "Internal"}
    store.datasets[did] = d
    store.frames[did] = []
    store.versions[did] = []
    # generate frames
    store.gen_frames(did, min(frames_n, 50))
    return {"dataset": d, "framesGenerated": min(frames_n, 50)}