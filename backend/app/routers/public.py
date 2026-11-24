from fastapi import APIRouter, Query
import json, urllib.request, urllib.parse

router = APIRouter()

COCO_SAMPLES = [
    "000000000139", "000000000285", "000000000632", "000000037777",
    "000000252219", "000000397133", "000000000776", "000000001000",
    "000000002431", "000000002473",
]

@router.get("/coco-samples")
def coco_samples():
    out = []
    for sid in COCO_SAMPLES:
        out.append({"id": sid, "url": f"http://images.cocodataset.org/val2017/{sid}.jpg",
                    "source": "COCO 2017 val", "license": "CC BY 4.0"})
    return out

@router.get("/sources")
def sources():
    return [
        {"name": "COCO 2017", "url": "https://cocodataset.org", "type": "images + bboxes", "license": "CC BY 4.0", "size": "118k images"},
        {"name": "KITTI", "url": "https://www.cvlibs.net/datasets/kitti", "type": "stereo, LiDAR, tracking", "license": "CC BY-NC-SA 3.0", "size": "15k images"},
        {"name": "nuScenes", "url": "https://www.nuscenes.org", "type": "multi-modal (cam+radar+lidar)", "license": "CC BY-NC-SA 4.0", "size": "1.4M images"},
        {"name": "Open Images", "url": "https://storage.googleapis.com/openimages", "type": "images + bboxes/segmentation", "license": "CC BY 4.0", "size": "9M images"},
        {"name": "YCB", "url": "https://www.ycbbenchmarks.com", "type": "3D object scans + poses", "license": "CC BY 4.0", "size": "600+ scans"},
        {"name": "RoboNet", "url": "https://www.robonet.wiki", "type": "robot manipulation video", "license": "CC BY 4.0", "size": "15M frames"},
        {"name": "DROID", "url": "https://droid-dataset.github.io", "type": "manipulation trajectories", "license": "CC BY 4.0", "size": "76k trajectories"},
        {"name": "Hugging Face (LeRobot)", "url": "https://huggingface.co/datasets?search=lerobot", "type": "robotics datasets hub", "license": "various", "size": "1000+ datasets"},
        {"name": "Waymo Open", "url": "https://waymo.com/open", "type": "LiDAR + camera", "license": "Waymo license", "size": "1150 segments"},
        {"name": "Picsum (demo photos)", "url": "https://picsum.photos", "type": "real photos (demo)", "license": "Unsplash license", "size": "unlimited"},
    ]

@router.get("/hf-search")
def hf_search(q: str = Query("robotics"), limit: int = Query(20)):
    params = urllib.parse.urlencode({"search": q, "limit": limit, "sort": "downloads", "direction": "-1"})
    url = f"https://huggingface.co/api/datasets?{params}"
    try:
        with urllib.request.urlopen(url, timeout=15) as r:
            data = json.loads(r.read().decode())
    except Exception as e:
        return {"error": str(e), "results": []}
    results = []
    for d in data:
        results.append({
            "id": d.get("id"),
            "author": d.get("author"),
            "downloads": d.get("downloads", 0),
            "likes": d.get("likes", 0),
            "tags": (d.get("tags") or [])[:8],
            "lastModified": d.get("lastModified"),
            "url": f"https://huggingface.co/datasets/{d.get('id')}",
        })
    return {"query": q, "count": len(results), "results": results}