# RoboData Studio

A **Robotics Perception Data Farming Platform** built to demonstrate the end-to-end workflow of a Data Farming Intern role (Agile Robots, Bengaluru): multi-modal data collection & curation (RGB, depth, LiDAR/point clouds), 2D/3D annotation, temporal action labeling, synthetic data with domain randomization, quality assurance (IoU, precision/recall), edge-case detection, dataset versioning, and export to COCO / YOLO / PCD formats. Includes an AI copilot.

Built with **React + TypeScript + Vite + Tailwind** (frontend) and **Python + FastAPI** (backend).

## Live
- Vercel: (deployed via GitHub integration on `main`)

## Features
- **Dashboard** – dataset overview, frame/annotation stats, charts.
- **Dataset Explorer** – browse frames, filter by label status / occlusion / low light, grid & list views.
- **Annotation Studio** – draw 2D bounding boxes, polygons, keypoints, 3D cuboids; auto-annotate; 3D point-cloud viewer.
- **Synthetic Data Generator** – domain randomization controls (lighting, camera, textures, clutter, noise, glare) with live preview and dataset generation.
- **Quality Assurance** – IoU, precision/recall/F1, class imbalance, label consistency, OOB/duplicate/missing detection, recommendations.
- **Edge Case Detector** – occlusion, glare, low light, motion blur, crowding, dynamic obstacles with severity scoring.
- **Export Center** – COCO JSON, YOLO txt, PCD, JSONL; dataset version tagging.
- **AI Assistant** – data-farming copilot (offline rule-based; pluggable LLM).

## Run locally

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt   # Windows
# or: source .venv/bin/activate && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend proxies `/api` to `localhost:8000`.

## Deploy
- **Frontend + API**: Vercel (team scope). `vercel.json` configures build output and API rewrite.
- **Backend (full)**: run locally or containerize; the Vercel serverless functions in `/api` provide a lightweight API.

## Credits
Omprakash Suthar (@OPBSUTHAR) — https://github.com/OPBSUTHAR