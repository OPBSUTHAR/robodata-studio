import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
from app.main import app

# Vercel expects an ASGI app named `app`
handler = app