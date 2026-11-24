import random, hashlib, time, uuid
from typing import Dict, List, Any

random.seed(42)

CLASSES = [
    {"id": 1, "name": "robot_arm", "color": "#6366f1"},
    {"id": 2, "name": "gripper", "color": "#22d3ee"},
    {"id": 3, "name": "workpiece", "color": "#22c55e"},
    {"id": 4, "name": "conveyor", "color": "#f59e0b"},
    {"id": 5, "name": "human_hand", "color": "#ef4444"},
    {"id": 6, "name": "tool", "color": "#a855f7"},
]

SCENES = ["assembly_line", "pick_and_place", "inspection", "packaging", "welding_cell", "mobile_nav"]
LIGHTINGS = ["bright", "dim", "glare", "low_light", "night"]

def uid(prefix="id"):
    return f"{prefix}_{uuid.uuid4().hex[:8]}"

datasets: Dict[str, Any] = {}
frames: Dict[str, List[Any]] = {}
annotations: Dict[str, List[Any]] = {}
versions: Dict[str, List[Any]] = {}

def seed():
    names = ["DianaArm_Manipulation_v1", "MobileRobot_Navigation", "Humanoid_Grasp_Sim", "Conveyor_Inspection", "Synthetic_DomainRand_v2", "EdgeCases_Occlusion_Set"]
    for i, n in enumerate(names):
        fc = [2400, 1800, 3200, 1500, 5000, 900][i]
        ann = int(fc * (0.3 + i * 0.1))
        d = {
            "id": f"ds_{i+1}", "name": n, "description": f"{n} dataset for perception & manipulation training.",
            "version": "1.2.0" if i % 2 == 0 else "2.0.1",
            "modality": (["rgb","depth","pointcloud"] if i % 3 == 0 else ["rgb","depth"] if i % 3 == 1 else ["rgb","pointcloud","lidar"]),
            "classes": CLASSES[:4 + (i % 3)],
            "frameCount": fc, "annotatedCount": ann,
            "createdAt": int(time.time()*1000) - (i+1)*86400000*12,
            "updatedAt": int(time.time()*1000) - i*86400000*3,
            "tags": ["robotics", "sim" if i % 2 else "real", "indoor" if i % 3 else "factory"],
            "source": ("real" if i % 2 == 0 else "synthetic" if i % 3 == 0 else "mixed"),
            "license": "Internal",
        }
        datasets[d["id"]] = d
        frames[d["id"]] = []
        annotations[d["id"]] = []
        versions[d["id"]] = [
            {"id": uid("ver"), "datasetId": d["id"], "version": "1.0.0", "createdAt": int(time.time()*1000)-60*86400000, "frameCount": 1200, "changes": "Initial collection", "hash": hashlib.md5((d["id"]+"1.0").encode()).hexdigest()[:8]},
            {"id": uid("ver"), "datasetId": d["id"], "version": "1.1.0", "createdAt": int(time.time()*1000)-30*86400000, "frameCount": 1800, "changes": "Added depth modality", "hash": hashlib.md5((d["id"]+"1.1").encode()).hexdigest()[:8]},
        ]

def gen_frames(dataset_id, n=60):
    if frames.get(dataset_id):
        return frames[dataset_id]
    out = []
    for i in range(n):
        lighting = random.choice(LIGHTINGS)
        occl = random.uniform(0.3, 0.85) if random.random() < 0.25 else random.uniform(0, 0.2)
        pts = [{"x": random.uniform(-0.5,0.5), "y": random.uniform(0,0.5), "z": random.uniform(0.8,1.5),
                "r": random.randint(50,255), "g": random.randint(50,255), "b": random.randint(50,255)} for _ in range(random.randint(200,500))]
        f = {"id": f"fr_{dataset_id}_{i}", "datasetId": dataset_id, "index": i,
             "timestamp": int(time.time()*1000) - (n-i)*100, "modalities": ["rgb","depth","pointcloud"],
             "width": 1280, "height": 720, "scene": random.choice(SCENES), "lighting": lighting,
             "occlusionLevel": occl, "hasDynamicObstacle": random.random() < 0.15,
             "pointCloud": pts, "metadata": {"camera": "realsense_d455", "fps": 30}}
        out.append(f)
        # annotations
        ds = datasets[dataset_id]
        classes = ds["classes"]
        anns = []
        for _ in range(random.randint(1, 4)):
            cls = random.choice(classes)
            t = random.choice(["bbox2d", "polygon", "keypoint", "cuboid3d"])
            x, y = random.uniform(50, 900), random.uniform(50, 500)
            w, h = random.uniform(60, 200), random.uniform(60, 200)
            a = {"id": uid("ann"), "frameId": f["id"], "type": t, "classId": cls["id"], "className": cls["name"],
                 "annotator": random.choice(["auto_yolo","human_1","sam"]), "createdAt": f["timestamp"], "status": random.choice(["labeled","labeled","reviewed","in_progress"]),
                 "confidence": round(random.uniform(0.7, 0.99), 3)}
            if t == "bbox2d": a["bbox"] = {"x": x, "y": y, "w": w, "h": h}
            if t == "polygon":
                cx, cy = x + w/2, y + h/2; r = min(w,h)/2
                a["polygon"] = [{"x": cx + __import__("math").cos(k/6*6.28)*r*random.uniform(0.8,1.2),
                                 "y": cy + __import__("math").sin(k/6*6.28)*r*random.uniform(0.8,1.2)} for k in range(6)]
            if t == "keypoint":
                a["keypoints"] = [{"x": x+random.uniform(0,w), "y": y+random.uniform(0,h), "v": random.choice([0,1,2,2,2])} for _ in range(17)]
            if t == "cuboid3d":
                a["cuboid"] = {"center": [random.uniform(-0.5,0.5), random.uniform(0,0.5), random.uniform(0.8,1.5)],
                               "size": [random.uniform(0.1,0.4)]*3, "rotation": [0, random.uniform(-0.5,0.5), 0]}
            anns.append(a)
        annotations[f["id"]] = anns
    frames[dataset_id] = out
    return out

seed()