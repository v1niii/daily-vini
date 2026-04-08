/* ================================================================
   Daily Vini – Agent lock page
   ================================================================ */

const AGENTS = [
    { name: "Brimstone",  role: "Controller",  img: "https://media.valorant-api.com/agents/9f0d8ba9-4140-b941-57d3-a7ad57c6b417/displayicon.png" },
    { name: "Viper",      role: "Controller",  img: "https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494b5a/displayicon.png" },
    { name: "Omen",       role: "Controller",  img: "https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png" },
    { name: "Astra",      role: "Controller",  img: "https://media.valorant-api.com/agents/41fb69c1-4189-7b37-f117-bcaf1e96f1bf/displayicon.png" },
    { name: "Harbor",     role: "Controller",  img: "https://media.valorant-api.com/agents/95b78ed7-4637-86d9-7e41-71ba8c293152/displayicon.png" },
    { name: "Clove",      role: "Controller",  img: "https://media.valorant-api.com/agents/1dbf2edd-4729-0984-3115-daa5eed44993/displayicon.png" },
    { name: "Jett",       role: "Duelist",     img: "https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png" },
    { name: "Raze",       role: "Duelist",     img: "https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5aa313dba261/displayicon.png" },
    { name: "Phoenix",    role: "Duelist",     img: "https://media.valorant-api.com/agents/eb93336a-449b-9c1b-0a54-a891f7921d69/displayicon.png" },
    { name: "Reyna",      role: "Duelist",     img: "https://media.valorant-api.com/agents/a3bfb853-43b2-7238-a4f1-ad90e9e46bcc/displayicon.png" },
    { name: "Yoru",       role: "Duelist",     img: "https://media.valorant-api.com/agents/7f94d92c-4234-0a36-9646-3a87eb8b5c89/displayicon.png" },
    { name: "Neon",       role: "Duelist",     img: "https://media.valorant-api.com/agents/bb2a4828-46eb-8cd1-e765-15848195d751/displayicon.png" },
    { name: "Iso",        role: "Duelist",     img: "https://media.valorant-api.com/agents/0e38b510-41a8-5780-5e8f-568b2a4f2d6c/displayicon.png" },
    { name: "Sova",       role: "Initiator",   img: "https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/displayicon.png" },
    { name: "Breach",     role: "Initiator",   img: "https://media.valorant-api.com/agents/5f8d3a7f-467b-97f3-062c-13acf203c006/displayicon.png" },
    { name: "Skye",       role: "Initiator",   img: "https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/displayicon.png" },
    { name: "KAY/O",      role: "Initiator",   img: "https://media.valorant-api.com/agents/601dbbe7-43ce-be57-2a40-4abd24953621/displayicon.png" },
    { name: "Fade",       role: "Initiator",   img: "https://media.valorant-api.com/agents/dade69b4-4f5a-8528-247b-219e5a1facd6/displayicon.png" },
    { name: "Gekko",      role: "Initiator",   img: "https://media.valorant-api.com/agents/e370fa57-4757-3604-3648-499e1f642d3f/displayicon.png" },
    { name: "Sage",       role: "Sentinel",    img: "https://media.valorant-api.com/agents/569fdd95-4d10-43ab-ca70-79becc718b46/displayicon.png" },
    { name: "Cypher",     role: "Sentinel",    img: "https://media.valorant-api.com/agents/117ed9e3-49f3-6571-8249-2e838fd19cf1/displayicon.png" },
    { name: "Killjoy",    role: "Sentinel",    img: "https://media.valorant-api.com/agents/1e58de9c-4950-5125-93e9-a0aee9f98746/displayicon.png" },
    { name: "Chamber",    role: "Sentinel",    img: "https://media.valorant-api.com/agents/22697a3d-45bf-8dd7-4fec-84a9e28c69d7/displayicon.png" },
    { name: "Deadlock",   role: "Sentinel",    img: "https://media.valorant-api.com/agents/cc8b64c8-4b25-4ff9-6e7f-37b4da43d235/displayicon.png" },
    { name: "Vyse",       role: "Sentinel",    img: "https://media.valorant-api.com/agents/efba5359-4016-a1e5-7626-b1ae76895940/displayicon.png" },
];

document.addEventListener("DOMContentLoaded", () => {
    let locked = [];
    const grid      = document.getElementById("agentGrid");
    const lockList  = document.getElementById("lockList");
    const statusEl  = document.getElementById("lockStatus");

    // Load saved lock from server
    loadSaved();

    // Render agent grid
    AGENTS.forEach(a => {
        const tile = DV.el("div", "agent-tile");
        tile.dataset.name = a.name;
        tile.innerHTML = `<img src="${a.img}" alt="${DV.escHtml(a.name)}"><span>${DV.escHtml(a.name)}</span>`;
        tile.addEventListener("click", () => toggleAgent(a.name));
        grid.appendChild(tile);
    });

    function toggleAgent(name) {
        const idx = locked.indexOf(name);
        if (idx >= 0) {
            locked.splice(idx, 1);
        } else if (locked.length < 5) {
            locked.push(name);
        } else {
            statusEl.textContent = "Max 5 agents. Remove one first.";
            return;
        }
        statusEl.textContent = "";
        renderLock();
    }

    function renderLock() {
        lockList.innerHTML = "";
        // Update tiles
        grid.querySelectorAll(".agent-tile").forEach(t => {
            t.classList.toggle("selected", locked.includes(t.dataset.name));
        });

        if (!locked.length) {
            lockList.innerHTML = '<p class="muted">Click agents above to add them to your lock list.</p>';
            return;
        }

        locked.forEach((name, i) => {
            const item = DV.el("div", "lock-item");
            item.innerHTML = `
                <span class="lock-num">${i + 1}</span>
                <span>${DV.escHtml(name)}</span>
                <span class="lock-remove" data-name="${DV.escHtml(name)}">&times;</span>
            `;
            item.querySelector(".lock-remove").addEventListener("click", () => toggleAgent(name));
            lockList.appendChild(item);
        });
    }

    // Save
    document.getElementById("saveLock").addEventListener("click", async () => {
        try {
            await DV.api("/api/agent-lock", {
                method: "POST",
                body: { agents: locked },
            });
            statusEl.textContent = "Lock order saved!";
        } catch (err) {
            statusEl.textContent = "Error saving: " + err.message;
        }
    });

    // Clear
    document.getElementById("clearLock").addEventListener("click", () => {
        locked = [];
        renderLock();
        statusEl.textContent = "Cleared.";
    });

    async function loadSaved() {
        try {
            const data = await DV.api("/api/agent-lock");
            if (data.agents && data.agents.length) {
                locked = data.agents;
                renderLock();
            }
        } catch { /* first visit, nothing saved */ }
    }
});
