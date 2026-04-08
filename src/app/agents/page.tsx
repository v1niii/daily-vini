"use client";

import { useState, useEffect } from "react";

const AGENTS = [
  { name: "Brimstone", role: "Controller", img: "https://media.valorant-api.com/agents/9f0d8ba9-4140-b941-57d3-a7ad57c6b417/displayicon.png" },
  { name: "Viper", role: "Controller", img: "https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494859/displayicon.png" },
  { name: "Omen", role: "Controller", img: "https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png" },
  { name: "Astra", role: "Controller", img: "https://media.valorant-api.com/agents/41fb69c1-4189-7b37-f117-bcaf1e96f1bf/displayicon.png" },
  { name: "Harbor", role: "Controller", img: "https://media.valorant-api.com/agents/95b78ed7-4637-86d9-7e41-71ba8c293152/displayicon.png" },
  { name: "Clove", role: "Controller", img: "https://media.valorant-api.com/agents/1dbf2edd-4729-0984-3115-daa5eed44993/displayicon.png" },
  { name: "Jett", role: "Duelist", img: "https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png" },
  { name: "Raze", role: "Duelist", img: "https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5aa313dba261/displayicon.png" },
  { name: "Phoenix", role: "Duelist", img: "https://media.valorant-api.com/agents/eb93336a-449b-9c1b-0a54-a891f7921d69/displayicon.png" },
  { name: "Reyna", role: "Duelist", img: "https://media.valorant-api.com/agents/a3bfb853-43b2-7238-a4f1-ad90e9e46bcc/displayicon.png" },
  { name: "Yoru", role: "Duelist", img: "https://media.valorant-api.com/agents/7f94d92c-4234-0a36-9646-3a87eb8b5c89/displayicon.png" },
  { name: "Neon", role: "Duelist", img: "https://media.valorant-api.com/agents/bb2a4828-46eb-8cd1-e765-15848195d751/displayicon.png" },
  { name: "Iso", role: "Duelist", img: "https://media.valorant-api.com/agents/0e38b510-41a8-5780-5e8f-568b2a4f2d6c/displayicon.png" },
  { name: "Sova", role: "Initiator", img: "https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/displayicon.png" },
  { name: "Breach", role: "Initiator", img: "https://media.valorant-api.com/agents/5f8d3a7f-467b-97f3-062c-13acf203c006/displayicon.png" },
  { name: "Skye", role: "Initiator", img: "https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/displayicon.png" },
  { name: "KAY/O", role: "Initiator", img: "https://media.valorant-api.com/agents/601dbbe7-43ce-be57-2a40-4abd24953621/displayicon.png" },
  { name: "Fade", role: "Initiator", img: "https://media.valorant-api.com/agents/dade69b4-4f5a-8528-247b-219e5a1facd6/displayicon.png" },
  { name: "Gekko", role: "Initiator", img: "https://media.valorant-api.com/agents/e370fa57-4757-3604-3648-499e1f642d3f/displayicon.png" },
  { name: "Sage", role: "Sentinel", img: "https://media.valorant-api.com/agents/569fdd95-4d10-43ab-ca70-79becc718b46/displayicon.png" },
  { name: "Cypher", role: "Sentinel", img: "https://media.valorant-api.com/agents/117ed9e3-49f3-6512-3ccf-0cada7e3823b/displayicon.png" },
  { name: "Killjoy", role: "Sentinel", img: "https://media.valorant-api.com/agents/1e58de9c-4950-5125-93e9-a0aee9f98746/displayicon.png" },
  { name: "Chamber", role: "Sentinel", img: "https://media.valorant-api.com/agents/22697a3d-45bf-8dd7-4fec-84a9e28c69d7/displayicon.png" },
  { name: "Deadlock", role: "Sentinel", img: "https://media.valorant-api.com/agents/cc8b64c8-4b25-4ff9-6e7f-37b4da43d235/displayicon.png" },
  { name: "Vyse", role: "Sentinel", img: "https://media.valorant-api.com/agents/efba5359-4016-a1e5-7626-b1ae76895940/displayicon.png" },
];

export default function AgentsPage() {
  const [locked, setLocked] = useState<string[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("dv-locked-agents");
    if (saved) {
      try { setLocked(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  function toggle(name: string) {
    setLocked((prev) => {
      if (prev.includes(name)) {
        const next = prev.filter((n) => n !== name);
        localStorage.setItem("dv-locked-agents", JSON.stringify(next));
        setStatus("");
        return next;
      }
      if (prev.length >= 5) {
        setStatus("Max 5 agents. Remove one first.");
        return prev;
      }
      const next = [...prev, name];
      localStorage.setItem("dv-locked-agents", JSON.stringify(next));
      setStatus("");
      return next;
    });
  }

  function clearAll() {
    setLocked([]);
    localStorage.removeItem("dv-locked-agents");
    setStatus("Cleared.");
  }

  return (
    <>
      <section className="section">
        <h1 className="page-title">
          Agent <span className="accent">Picks</span>
        </h1>
        <p className="page-sub">
          Set your preferred agents in priority order (up to 5). Picks are saved
          in your browser.
        </p>
      </section>

      <section className="section">
        <div className="agent-grid">
          {AGENTS.map((a) => (
            <div
              key={a.name}
              className={`agent-tile ${locked.includes(a.name) ? "selected" : ""}`}
              onClick={() => toggle(a.name)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.img} alt={a.name} />
              <span>{a.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Your Pick Priority</h2>

        {locked.length === 0 ? (
          <p className="muted">Click agents above to add them to your list.</p>
        ) : (
          <div className="lock-list">
            {locked.map((name, i) => (
              <div key={name} className="lock-item">
                <span className="lock-num">{i + 1}</span>
                <span>{name}</span>
                <span className="lock-remove" onClick={() => toggle(name)}>
                  &times;
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="controls-row" style={{ marginTop: "1rem" }}>
          <button className="btn btn-secondary" onClick={clearAll}>
            Clear All
          </button>
        </div>
        {status && <p className="muted" style={{ marginTop: "0.5rem" }}>{status}</p>}
      </section>
    </>
  );
}
