import random
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
#  Ollama helper (local, free, no API key)
# ─────────────────────────────────────────────
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3"

def ask_ollama(prompt: str) -> str:
    try:
        response = requests.post(
            OLLAMA_URL,
            json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
            timeout=60,  # llama3 can be slow, give it time
        )
        if response.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Ollama returned error: {response.status_code}")
        return response.json()["response"].strip()
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=502, detail="Ollama is not running. Start it with: ollama run llama3")
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Ollama timed out. Model may still be loading — try again in a few seconds.")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Ollama error: {e}")


# ─────────────────────────────────────────────
#  Live NHL data
# ─────────────────────────────────────────────
def get_live_nhl_data():
    try:
        response = requests.get("https://api-web.nhle.com/v1/standings/now", timeout=10)
        if response.status_code != 200:
            raise HTTPException(status_code=502, detail="Official NHL API unreachable.")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Failed to connect to NHL API: {e}")

    standings_data = response.json()
    records = standings_data.get("standings", [])

    if not records:
        raise HTTPException(status_code=502, detail="Official NHL API returned empty standings.")

    live_database = {}
    for team in records:
        full_name = team.get("teamName", {}).get("default", "Unknown")

        if "Leafs" in full_name:
            short_key = "Maple Leafs"
        elif "Knights" in full_name:
            short_key = "Golden Knights"
        elif "Canadiens" in full_name:
            short_key = "Canadiens"
        else:
            short_key = full_name.split()[-1]

        pts   = team.get("points", 0)
        gp    = team.get("gamesPlayed", 0)
        gf    = team.get("goalsFor", 0)
        ga    = team.get("goalsAgainst", 0)

        # Power-play % — live from API
        pp_pct_raw = team.get("powerPlayPct", None)
        if pp_pct_raw is not None:
            pp_pct = round(float(pp_pct_raw) * 100, 1)
        else:
            pp_wins = team.get("powerPlayNetGoals", 0)
            pp_opps = team.get("powerPlayOpportunities", 1)
            pp_pct  = round((pp_wins / pp_opps) * 100, 1) if pp_opps else 0.0

        # Save % — live from API
        sv_pct_raw = team.get("savePct", None)
        if sv_pct_raw is not None:
            sv_pct = round(float(sv_pct_raw), 3)
        else:
            shots_against = team.get("shotsAgainst", 1)
            sv_pct = round(1 - (ga / shots_against), 3) if shots_against else 0.900

        l10_pts = team.get("l10Points", 0)
        if l10_pts >= 14:
            form = "hot"
        elif l10_pts <= 7:
            form = "cold"
        else:
            form = "decent"

        live_database[short_key] = {
            "city":   team.get("teamCommonName", {}).get("default", "Unknown"),
            "conf":   team.get("conferenceName", "Unknown"),
            "pts":    pts,
            "gp":     gp,
            "gf":     gf,
            "ga":     ga,
            "pp_pct": pp_pct,
            "sv_pct": sv_pct,
            "form":   form,
        }
    return live_database


# ─────────────────────────────────────────────
#  Request models
# ─────────────────────────────────────────────
class MatchupRequest(BaseModel):
    team_a: str
    team_b: str

class GameResultRequest(BaseModel):
    team_a: str
    team_b: str
    score_a: int
    score_b: int


# ─────────────────────────────────────────────
#  Endpoints
# ─────────────────────────────────────────────
@app.get("/api/teams")
def get_teams():
    nhl_data = get_live_nhl_data()
    return {"teams": sorted(nhl_data.keys())}


@app.post("/api/predict")
def predict_match(req: MatchupRequest):
    nhl_data = get_live_nhl_data()
    if req.team_a not in nhl_data or req.team_b not in nhl_data:
        raise HTTPException(status_code=400, detail="Team missing from live database.")

    t1, t2 = nhl_data[req.team_a], nhl_data[req.team_b]

    score_a = (
        t1["pts"]
        + (t1["gf"] - t1["ga"]) / 5
        + (10 if t1["form"] == "hot" else -10 if t1["form"] == "cold" else 0)
    )
    score_b = (
        t2["pts"]
        + (t2["gf"] - t2["ga"]) / 5
        + (10 if t2["form"] == "hot" else -10 if t2["form"] == "cold" else 0)
    )

    total_score = score_a + score_b or 1
    prob_a = int((score_a / total_score) * 100)
    prob_b = 100 - prob_a

    prompt = (
        f"Write a quick, professional 2-sentence NHL prediction breakdown for "
        f"{req.team_a} (form: {t1['form']}, {t1['pts']} pts, GF {t1['gf']}, GA {t1['ga']}) "
        f"vs {req.team_b} (form: {t2['form']}, {t2['pts']} pts, GF {t2['gf']}, GA {t2['ga']}). "
        f"Win probability: {req.team_a} {prob_a}%, {req.team_b} {prob_b}%. Keep it punchy and analytical."
    )
    ai_reasoning = ask_ollama(prompt)

    return {
        "team_a": req.team_a, "team_b": req.team_b,
        "form_a": t1["form"], "form_b": t2["form"],
        "prob_a": prob_a, "prob_b": prob_b,
        "reasoning": ai_reasoning,
        "pts_a": t1["pts"], "pts_b": t2["pts"],
        "stats_a": {"gp": t1["gp"], "gf": t1["gf"], "ga": t1["ga"], "pp_pct": t1["pp_pct"], "sv_pct": t1["sv_pct"]},
        "stats_b": {"gp": t2["gp"], "gf": t2["gf"], "ga": t2["ga"], "pp_pct": t2["pp_pct"], "sv_pct": t2["sv_pct"]},
    }


@app.post("/api/analyze")
def analyze_game(req: GameResultRequest):
    winner = req.team_a if req.score_a > req.score_b else req.team_b
    loser  = req.team_b if req.score_a > req.score_b else req.team_a

    prompt = (
        f"Analyze an NHL game: {req.team_a} {req.score_a} – {req.score_b} {req.team_b}. "
        f"{winner} won. Give a 3-sentence professional summary covering game flow, "
        f"defensive adjustments, and why {winner} edged out {loser}."
    )
    ai_analysis = ask_ollama(prompt)

    ratings = [
        {
            "player": f"Star Forward ({req.team_a})",
            "team": req.team_a,
            "rating": round(random.uniform(6.5, 9.5), 1),
            "note": "Controlled the neutral zone pacing.",
        },
        {
            "player": f"Starting Goalie ({req.team_b})",
            "team": req.team_b,
            "rating": round(random.uniform(5.0, 8.5), 1),
            "note": "Faced heavy high-danger tracking pressures.",
        },
    ]

    return {
        "team_a": req.team_a, "team_b": req.team_b,
        "score_a": req.score_a, "score_b": req.score_b,
        "winner": winner, "analysis": ai_analysis, "player_ratings": ratings,
    }


@app.post("/api/compare")
def compare_teams(req: MatchupRequest):
    nhl_data = get_live_nhl_data()
    if req.team_a not in nhl_data or req.team_b not in nhl_data:
        raise HTTPException(status_code=400, detail="Team missing from live database.")

    t1, t2 = nhl_data[req.team_a], nhl_data[req.team_b]

    metrics = [
        {
            "label": "Points",
            "a": str(t1["pts"]), "b": str(t2["pts"]),
            "winner": "a" if t1["pts"] > t2["pts"] else "b",
        },
        {
            "label": "Power Play %",
            "a": str(t1["pp_pct"]), "b": str(t2["pp_pct"]),
            "winner": "a" if t1["pp_pct"] > t2["pp_pct"] else "b",
        },
        {
            "label": "Save %",
            "a": f"{t1['sv_pct']:.3f}", "b": f"{t2['sv_pct']:.3f}",
            "winner": "a" if t1["sv_pct"] > t2["sv_pct"] else "b",
        },
    ]

    prompt = (
        f"Compare two NHL franchises tactically: {req.team_a} ({t1['pts']} pts, "
        f"GF {t1['gf']}, GA {t1['ga']}, PP {t1['pp_pct']}%, SV {t1['sv_pct']:.3f}) "
        f"vs {req.team_b} ({t2['pts']} pts, GF {t2['gf']}, GA {t2['ga']}, "
        f"PP {t2['pp_pct']}%, SV {t2['sv_pct']:.3f}). "
        f"Provide a 2-sentence professional breakdown contrasting offensive setups "
        f"and blue-line structure based on the numbers."
    )
    ai_breakdown = ask_ollama(prompt)

    return {
        "team_a": req.team_a, "team_b": req.team_b,
        "form_a": t1["form"], "form_b": t2["form"],
        "info_a": {"city": t1["city"], "conf": t1["conf"]},
        "info_b": {"city": t2["city"], "conf": t2["conf"]},
        "metrics": metrics, "breakdown": ai_breakdown,
    }


@app.post("/api/commentary")
def generate_commentary(req: MatchupRequest):
    sim_a = random.randint(1, 6)
    sim_b = random.randint(1, 6)
    if sim_a == sim_b:
        sim_a += 1 if random.random() > 0.5 else -1

    winner = req.team_a if sim_a > sim_b else req.team_b

    events = [
        {"event": "PLAY",    "minute": 1,  "text": "Puck is dropped! The crowd erupts as action gets underway.",                    "team": "None"},
        {"event": "SAVE",    "minute": 18, "text": "Incredible glove save! Denying an open look from the slot.",                    "team": req.team_b},
        {"event": "GOAL",    "minute": 34, "text": "HE SCORES! A brilliant wrist shot sneaks past the blocker side!",               "team": req.team_a},
        {"event": "PENALTY", "minute": 52, "text": "2 minutes in the box for tripping. Power play opportunity coming up.",          "team": req.team_b},
        {"event": "FINAL",   "minute": 60, "text": f"Final horn! {winner} takes it {sim_a if winner == req.team_a else sim_b}–{sim_b if winner == req.team_a else sim_a}.", "team": "None"},
    ]

    return {
        "team_a": req.team_a, "team_b": req.team_b,
        "simulated_score_a": sim_a, "simulated_score_b": sim_b,
        "winner": winner, "commentary": events,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)