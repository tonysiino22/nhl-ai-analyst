import { useState, useEffect } from "react";

const API = "http://localhost:8000/api";

const TEAM_LOGOS = {
  "Avalanche": "🏔️", "Oilers": "🛢️", "Panthers": "🐆", "Rangers": "🗽",
  "Bruins": "🐻", "Lightning": "⚡", "Hurricanes": "🌀", "Stars": "⭐",
  "Golden Knights": "⚔️", "Kings": "👑", "Maple Leafs": "🍁", "Wild": "🌲",
  "Jets": "✈️", "Predators": "🐯", "Blues": "🎵", "Flames": "🔥",
  "Canucks": "🍁", "Ducks": "🦆", "Sharks": "🦈", "Kraken": "🐙",
  "Sabres": "⚔️", "Red Wings": "🚗", "Canadiens": "🇨🇦", "Senators": "🏛️",
  "Penguins": "🐧", "Capitals": "🏛️", "Islanders": "🏝️", "Devils": "😈",
  "Flyers": "🦅", "Blue Jackets": "🎖️", "Coyotes": "🐺", "Blackhawks": "🦅",
};

const FORM_COLOR = { hot: "#ef4444", decent: "#f59e0b", cold: "#3b82f6" };
const FORM_LABEL = { hot: "🔥 Hot", decent: "✅ Decent", cold: "❄️ Cold" };

function TeamSelect({ label, value, onChange, teams = [] }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#6b7280", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", padding: "10px 14px", background: "#1a1f2e", border: "1px solid #2d3448", borderRadius: 10, color: "#e2e8f0", fontSize: 15, cursor: "pointer" }}>
        <option value="">Select team…</option>
        {(teams || []).map(t => <option key={t} value={t}>{TEAM_LOGOS[t] || "🏒"} {t}</option>)}
      </select>
    </div>
  );
}

function Badge({ children, color }) {
  return <span style={{ background: color + "22", color: color, border: `1px solid ${color}44`, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>{children}</span>;
}

function Card({ children, style }) {
  return <div style={{ background: "#131929", border: "1px solid #1e2d4a", borderRadius: 16, padding: 24, ...style }}>{children}</div>;
}

function ProbBar({ teamA, teamB, probA, probB }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ color: "#60a5fa", fontWeight: 700, fontSize: 18 }}>{probA}%</span>
        <span style={{ color: "#6b7280", fontSize: 13 }}>win probability</span>
        <span style={{ color: "#f87171", fontWeight: 700, fontSize: 18 }}>{probB}%</span>
      </div>
      <div style={{ height: 12, background: "#1e2d4a", borderRadius: 6, overflow: "hidden" }}>
        <div style={{ width: `${probA}%`, height: "100%", background: "linear-gradient(90deg, #3b82f6, #60a5fa)", borderRadius: 6, transition: "width 0.8s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12, color: "#6b7280" }}>
        <span>{teamA}</span><span>{teamB}</span>
      </div>
    </div>
  );
}

function StatRow({ label, a, b, winner }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1e2d4a" }}>
      <div style={{ flex: 1, textAlign: "right", fontWeight: winner === "a" ? 700 : 400, color: winner === "a" ? "#60a5fa" : "#e2e8f0", fontSize: 14 }}>{a}</div>
      <div style={{ width: 130, textAlign: "center", fontSize: 12, color: "#6b7280" }}>{label}</div>
      <div style={{ flex: 1, textAlign: "left", fontWeight: winner === "b" ? 700 : 400, color: winner === "b" ? "#f87171" : "#e2e8f0", fontSize: 14 }}>{b}</div>
    </div>
  );
}

function CommentaryEvent({ event, minute, text, team, color }) {
  const icons = { GOAL: "🚨", SAVE: "🧤", PENALTY: "🟨", PLAY: "🏒", FINAL: "🏁" };
  return (
    <div style={{ display: "flex", gap: 14, marginBottom: 16, alignItems: "flex-start" }}>
      <div style={{ minWidth: 54, textAlign: "center" }}>
        <div style={{ fontSize: 18 }}>{icons[event] || "🏒"}</div>
        <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>MIN {minute}</div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
          <Badge color={color}>{event}</Badge>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>{team}</span>
        </div>
        <div style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.5 }}>{text}</div>
      </div>
    </div>
  );
}

function PlayerRating({ player, team, rating, note }) {
  const color = rating >= 8 ? "#22c55e" : rating >= 6 ? "#f59e0b" : "#ef4444";
  const width = (rating / 10) * 100;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: "#e2e8f0" }}>{player}</span>
        <span style={{ color, fontWeight: 700, fontSize: 14 }}>{rating} / 10</span>
      </div>
      <div style={{ height: 6, background: "#1e2d4a", borderRadius: 3, marginBottom: 4 }}>
        <div style={{ width: `${width}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.5s" }} />
      </div>
      <div style={{ fontSize: 12, color: "#6b7280" }}>{team} · {note}</div>
    </div>
  );
}

export default function App() {
  const [teams, setTeams] = useState([]);
  const [tab, setTab] = useState("predict");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [pTeamA, setPTeamA] = useState("Oilers");
  const [pTeamB, setPTeamB] = useState("Avalanche");
  const [prediction, setPrediction] = useState(null);

  const [aTeamA, setATeamA] = useState("Bruins");
  const [aTeamB, setATeamB] = useState("Panthers");
  const [scoreA, setScoreA] = useState(3);
  const [scoreB, setScoreB] = useState(2);
  const [analysis, setAnalysis] = useState(null);

  const [cTeamA, setCTeamA] = useState("Rangers");
  const [cTeamB, setCTeamB] = useState("Hurricanes");
  const [comparison, setComparison] = useState(null);

  const [comTeamA, setComTeamA] = useState("Avalanche");
  const [comTeamB, setComTeamB] = useState("Bruins");
  const [commentary, setCommentary] = useState(null);

  useEffect(() => {
    fetch(`${API}/teams`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setTeams(d);
        else if (d && Array.isArray(d.teams)) setTeams(d.teams);
        else setTeams(Object.keys(TEAM_LOGOS)); 
      })
      .catch(() => setTeams(Object.keys(TEAM_LOGOS))); 
  }, []);

  async function callAPI(url, body, setter) {
    setLoading(true); setError("");
    try {
      const r = await fetch(`${API}${url}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error(await r.text());
      setter(await r.json());
    } catch (e) { setError("Ensure your Python backend (main.py) is running! Error: " + e.message); }
    setLoading(false);
  }

  const tabs = [
    { id: "predict", label: "🎯 Predict" },
    { id: "analyze", label: "📊 Analyze" },
    { id: "compare", label: "⚖️ Compare" },
    { id: "commentary", label: "🎙️ Commentary" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0b0f1a", color: "#e2e8f0", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: "#0f1422", borderBottom: "1px solid #1e2d4a", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ fontSize: 28 }}>🏒</div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#e2e8f0", letterSpacing: "-0.02em" }}>NHL AI Analyst</div>
          <div style={{ fontSize: 12, color: "#4b5563" }}>Powered by local AI · No API cost</div>
        </div>
        <div style={{ flex: 1 }} />
        <Badge color="#3b82f6">Live Season Data</Badge>
      </div>

      <div style={{ display: "flex", gap: 2, padding: "16px 24px 0", borderBottom: "1px solid #1e2d4a" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setPrediction(null); setAnalysis(null); setComparison(null); setCommentary(null); setError(""); }}
            style={{ padding: "10px 20px", background: tab === t.id ? "#1e3a5f" : "transparent", color: tab === t.id ? "#60a5fa" : "#6b7280", border: tab === t.id ? "1px solid #2d5a8e" : "1px solid transparent", borderBottom: "none", borderRadius: "10px 10px 0 0", cursor: "pointer", fontSize: 14, fontWeight: tab === t.id ? 700 : 400, transition: "all 0.2s" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
        {error && <div style={{ background: "#450a0a", border: "1px solid #991b1b", borderRadius: 10, padding: 12, marginBottom: 16, color: "#fca5a5", fontSize: 14 }}>⚠️ {error}</div>}

        {tab === "predict" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Card>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#94a3b8" }}>Select matchup</div>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
                <TeamSelect label="Home Team" value={pTeamA} onChange={setPTeamA} teams={teams} />
                <div style={{ color: "#475569", fontWeight: 700, paddingBottom: 10, fontSize: 18 }}>vs</div>
                <TeamSelect label="Away Team" value={pTeamB} onChange={setPTeamB} teams={teams} />
                <button onClick={() => callAPI("/predict", { team_a: pTeamA, team_b: pTeamB }, setPrediction)}
                  disabled={loading || !pTeamA || !pTeamB}
                  style={{ padding: "10px 28px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap", opacity: loading ? 0.6 : 1 }}>
                  {loading ? "Analyzing…" : "Predict 🎯"}
                </button>
              </div>
            </Card>

            {prediction && (
              <>
                <Card>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                      <span style={{ fontSize: 32 }}>{TEAM_LOGOS[prediction.team_a] || "🏒"}</span>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 800 }}>{prediction.team_a}</div>
                        <div>{FORM_LABEL[prediction.form_a]}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "center", color: "#475569", fontSize: 22, fontWeight: 800 }}>VS</div>
                    <div style={{ display: "flex", gap: 16, alignItems: "center", flexDirection: "row-reverse" }}>
                      <span style={{ fontSize: 32 }}>{TEAM_LOGOS[prediction.team_b] || "🏒"}</span>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 18, fontWeight: 800 }}>{prediction.team_b}</div>
                        <div>{FORM_LABEL[prediction.form_b]}</div>
                      </div>
                    </div>
                  </div>
                  <ProbBar teamA={prediction.team_a} teamB={prediction.team_b} probA={prediction.prob_a} probB={prediction.prob_b} />
                </Card>

                <Card>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#3b82f6", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>AI Analysis</div>
                  <div style={{ fontSize: 15, lineHeight: 1.7, color: "#cbd5e1" }}>{prediction.reasoning}</div>
                </Card>

                <Card>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>Season Stats</div>
                  {[
                    ["Points", prediction.pts_a, prediction.pts_b, prediction.pts_a > prediction.pts_b ? "a" : "b"],
                    ["Goals For / GP", (prediction.stats_a.gf / prediction.stats_a.gp).toFixed(2), (prediction.stats_b.gf / prediction.stats_b.gp).toFixed(2), prediction.stats_a.gf > prediction.stats_b.gf ? "a" : "b"],
                    ["Goals Against / GP", (prediction.stats_a.ga / prediction.stats_a.gp).toFixed(2), (prediction.stats_b.ga / prediction.stats_b.gp).toFixed(2), prediction.stats_a.ga < prediction.stats_b.ga ? "a" : "b"],
                    ["Power Play %", prediction.stats_a.pp_pct, prediction.stats_b.pp_pct, prediction.stats_a.pp_pct > prediction.stats_b.pp_pct ? "a" : "b"],
                    ["Save %", (prediction.stats_a.sv_pct * 100).toFixed(1), (prediction.stats_b.sv_pct * 100).toFixed(1), prediction.stats_a.sv_pct > prediction.stats_b.sv_pct ? "a" : "b"],
                  ].map(([lbl, a, b, w]) => <StatRow key={lbl} label={lbl} a={a} b={b} winner={w} />)}
                </Card>
              </>
            )}
          </div>
        )}

        {tab === "analyze" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Card>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#94a3b8" }}>Enter game result</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                <TeamSelect label="Team A" value={aTeamA} onChange={setATeamA} teams={teams} />
                <div style={{ paddingBottom: 4 }}>
                  <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>SCORE</div>
                  <input type="number" min={0} max={15} value={scoreA} onChange={e => setScoreA(+e.target.value)}
                    style={{ width: 56, padding: "10px", background: "#1a1f2e", border: "1px solid #2d3448", borderRadius: 10, color: "#e2e8f0", fontSize: 18, fontWeight: 700, textAlign: "center" }} />
                </div>
                <div style={{ color: "#475569", fontWeight: 700, fontSize: 20, paddingBottom: 8 }}>–</div>
                <div style={{ paddingBottom: 4 }}>
                  <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>SCORE</div>
                  <input type="number" min={0} max={15} value={scoreB} onChange={e => setScoreB(+e.target.value)}
                    style={{ width: 56, padding: "10px", background: "#1a1f2e", border: "1px solid #2d3448", borderRadius: 10, color: "#e2e8f0", fontSize: 18, fontWeight: 700, textAlign: "center" }} />
                </div>
                <TeamSelect label="Team B" value={aTeamB} onChange={setATeamB} teams={teams} />
                <button onClick={() => callAPI("/analyze", { team_a: aTeamA, team_b: aTeamB, score_a: scoreA, score_b: scoreB }, setAnalysis)}
                  disabled={loading || !aTeamA || !aTeamB}
                  style={{ padding: "10px 24px", background: "#059669", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
                  {loading ? "Analyzing…" : "Analyze 📊"}
                </button>
              </div>
            </Card>

            {analysis && (
              <>
                <Card style={{ background: "#0f1e0f", border: "1px solid #14532d" }}>
                  <div style={{ textAlign: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 28, fontWeight: 900, color: "#4ade80" }}>{analysis.team_a} {analysis.score_a} – {analysis.score_b} {analysis.team_b}</span>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <Badge color="#22c55e">🏆 Winner: {analysis.winner}</Badge>
                  </div>
                </Card>
                <Card>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#3b82f6", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>AI Post-Game Analysis</div>
                  <div style={{ fontSize: 14, lineHeight: 1.8, color: "#cbd5e1", whiteSpace: "pre-line" }}>{analysis.analysis}</div>
                </Card>
                <Card>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>Player Ratings</div>
                  {analysis.player_ratings.map((p, i) => <PlayerRating key={i} {...p} />)}
                </Card>
              </>
            )}
          </div>
        )}

        {tab === "compare" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Card>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#94a3b8" }}>Compare two teams</div>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
                <TeamSelect label="Team A" value={cTeamA} onChange={setCTeamA} teams={teams} />
                <div style={{ color: "#475569", fontWeight: 700, paddingBottom: 10, fontSize: 18 }}>vs</div>
                <TeamSelect label="Team B" value={cTeamB} onChange={setCTeamB} teams={teams} />
                <button onClick={() => callAPI("/compare", { team_a: cTeamA, team_b: cTeamB }, setComparison)}
                  disabled={loading || !cTeamA || !cTeamB}
                  style={{ padding: "10px 24px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
                  {loading ? "Comparing…" : "Compare ⚖️"}
                </button>
              </div>
            </Card>

            {comparison && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Card style={{ background: "#0f172a", border: "1px solid #1e3a5f" }}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>{TEAM_LOGOS[comparison.team_a] || "🏒"}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#60a5fa" }}>{comparison.team_a}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{comparison.info_a?.city} · {comparison.info_a?.conf}</div>
                    <div style={{ marginTop: 8 }}>{FORM_LABEL[comparison.form_a]}</div>
                  </Card>
                  <Card style={{ background: "#1a0f0f", border: "1px solid #7f1d1d" }}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>{TEAM_LOGOS[comparison.team_b] || "🏒"}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#f87171" }}>{comparison.team_b}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{comparison.info_b?.city} · {comparison.info_b?.conf}</div>
                    <div style={{ marginTop: 8 }}>{FORM_LABEL[comparison.form_b]}</div>
                  </Card>
                </div>

                <Card>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>Head-to-Head Stats</div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12, color: "#6b7280", fontWeight: 600 }}>
                    <span style={{ color: "#60a5fa" }}>{comparison.team_a}</span>
                    <span>STAT</span>
                    <span style={{ color: "#f87171" }}>{comparison.team_b}</span>
                  </div>
                  {comparison.metrics.map(m => <StatRow key={m.label} label={m.label} a={m.a} b={m.b} winner={m.winner} />)}
                </Card>

                <Card>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>AI Tactical Breakdown</div>
                  <div style={{ fontSize: 14, lineHeight: 1.8, color: "#cbd5e1", whiteSpace: "pre-line" }}>{comparison.breakdown}</div>
                </Card>
              </>
            )}
          </div>
        )}

        {tab === "commentary" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Card>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#94a3b8" }}>Simulate a match</div>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
                <TeamSelect label="Home Team" value={comTeamA} onChange={setComTeamA} teams={teams} />
                <div style={{ color: "#475569", fontWeight: 700, paddingBottom: 10, fontSize: 18 }}>vs</div>
                <TeamSelect label="Away Team" value={comTeamB} onChange={setComTeamB} teams={teams} />
                <button onClick={() => callAPI("/commentary", { team_a: comTeamA, team_b: comTeamB }, setCommentary)}
                  disabled={loading || !comTeamA || !comTeamB}
                  style={{ padding: "10px 24px", background: "#b45309", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
                  {loading ? "Simulating…" : "Simulate 🎙️"}
                </button>
              </div>
            </Card>

            {commentary && (
              <>
                <Card style={{ background: "linear-gradient(135deg, #0f1e2e 0%, #1a0f0f 100%)", border: "1px solid #2d3448" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8, letterSpacing: "0.1em", textTransform: "uppercase" }}>Simulated Final Score</div>
                    <div style={{ fontSize: 36, fontWeight: 900 }}>
                      <span style={{ color: "#60a5fa" }}>{commentary.team_a}</span>
                      <span style={{ color: "#e2e8f0", margin: "0 16px" }}>{commentary.simulated_score_a} – {commentary.simulated_score_b}</span>
                      <span style={{ color: "#f87171" }}>{commentary.team_b}</span>
                    </div>
                    <div style={{ marginTop: 10 }}><Badge color="#f59e0b">🏆 {commentary.winner} win</Badge></div>
                  </div>
                </Card>

                <Card>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>🎙️ Live Commentary</div>
                  {commentary.commentary.map((m, i) => (
                    <CommentaryEvent key={i}
                      event={m.event} minute={m.minute} text={m.text} team={m.team}
                      color={m.event === "GOAL" ? "#ef4444" : m.event === "SAVE" ? "#3b82f6" : m.event === "FINAL" ? "#22c55e" : "#f59e0b"} />
                  ))}
                </Card>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}