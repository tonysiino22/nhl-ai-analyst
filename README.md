# NHL AI Analyst

A local AI-powered NHL analytics app with live season data.

## What it does
- Predict match outcomes with win probability
- Analyze game results with AI post-game breakdown
- Compare two teams head-to-head with live stats
- Simulate matches with live commentary

## Requirements
- [Python 3](https://python.org)
- [Node.js](https://nodejs.org)
- [Ollama](https://ollama.com) with llama3

## How to run

**Step 1** — Open PowerShell and start Ollama:ollama serve

**Step 2** — In VS Code terminal, start the backend:
pip install fastapi uvicorn requests pydantic
python main.py

**Step 3** — In a second VS Code terminal, start the frontend:
npm install
npm run dev

**Step 4** — Open `http://localhost:5173` in your browser.

## Notes
- Requires Ollama running locally with llama3 model
- Live NHL data pulled from the official NHL API
- No API costs — fully local AI

