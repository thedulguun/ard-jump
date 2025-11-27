from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()

# Serve static files
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=HTMLResponse)
async def home():
    with open("index.html", "r", encoding="utf-8") as f:
        return f.read()

@app.get("/game", response_class=HTMLResponse)
async def game():
    with open("game.html", "r", encoding="utf-8") as f:
        return f.read()

@app.get("/multiplayer", response_class=HTMLResponse)
async def multiplayer():
    with open("multiplayer.html", "r", encoding="utf-8") as f:
        return f.read()

@app.get("/bounce", response_class=HTMLResponse)
async def bounce():
    with open("bounce.html", "r", encoding="utf-8") as f:
        return f.read()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
