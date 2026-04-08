"use client";

import { useState } from "react";
import RegionSelect from "@/components/RegionSelect";

export default function Home() {
  const [lbRegion, setLbRegion] = useState("na");
  const [lbData, setLbData] = useState<any[] | null>(null);
  const [lbLoading, setLbLoading] = useState(false);
  const [lbError, setLbError] = useState("");

  async function loadLeaderboard() {
    setLbLoading(true);
    setLbError("");
    setLbData(null);

    try {
      const contentRes = await fetch(`/api/content?region=${lbRegion}`);
      const content = await contentRes.json();
      const acts = content.acts || [];
      // Pick the active act (not the parent episode) — the act has a real parentId
      const active = acts.find((a: any) => a.isActive && a.parentId && !a.parentId.startsWith("00000000")) ||
                     acts.find((a: any) => a.isActive);
      if (!active) throw new Error("Could not determine current act.");

      const res = await fetch(
        `/api/leaderboard?region=${lbRegion}&actId=${active.id}&size=50&startIndex=0`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load leaderboard.");
      setLbData(data.players || []);
    } catch (err: any) {
      setLbError(err.message);
    } finally {
      setLbLoading(false);
    }
  }

  return (
    <>
      <section className="hero">
        <h1 className="hero-title">
          Daily <span className="accent">Vini</span>
        </h1>
        <p className="hero-sub">
          Your Valorant companion — track leaderboards, save agent picks, check
          server status.
        </p>
      </section>

      <section className="features">
        {[
          { icon: "🏆", title: "Leaderboard", desc: "See top ranked players in your region and track the competitive landscape." },
          { icon: "🎯", title: "Agent Picks", desc: "Save your preferred agents in priority order for quick reference during agent select." },
          { icon: "🟢", title: "Server Status", desc: "Check real-time Valorant server status and ongoing incidents for any region." },
        ].map((f) => (
          <div key={f.title} className="feature-card">
            <div className="feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </section>

      <section className="section">
        <h2 className="section-title">Regional Leaderboard</h2>
        <div className="controls-row">
          <RegionSelect value={lbRegion} onChange={setLbRegion} />
          <button className="btn btn-secondary" onClick={loadLeaderboard}>
            Load
          </button>
        </div>

        {lbLoading && <div className="loader">Loading leaderboard...</div>}
        {lbError && <div className="error-box">{lbError}</div>}

        {lbData && (
          <div className="table-wrap">
            {lbData.length === 0 ? (
              <p className="muted">No leaderboard data available.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>Rank Rating</th>
                    <th>Wins</th>
                  </tr>
                </thead>
                <tbody>
                  {lbData.slice(0, 50).map((p: any, i: number) => (
                    <tr key={i}>
                      <td>{p.leaderboardRank ?? i + 1}</td>
                      <td>
                        {p.gameName || "Hidden"}
                        {p.tagLine ? `#${p.tagLine}` : ""}
                      </td>
                      <td>{p.rankedRating ?? "—"}</td>
                      <td>{p.numberOfWins ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {!lbLoading && !lbError && !lbData && (
          <p className="muted">Select a region and click Load.</p>
        )}
      </section>
    </>
  );
}
