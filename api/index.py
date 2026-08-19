"""
Vercel Serverless Function Entrypoint for ChainMind FastAPI Backend
"""

import sys
import os

# Ensure root workspace directory is in Python module search path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server import app

# Export app instance for Vercel WSGI/ASGI handler
__all__ = ["app"]
