"use client";

import { useState, useEffect } from "react";
import { X, Trash2, GripVertical, Crosshair, ListOrdered, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeUp, Stagger, StaggerItem } from "@/components/Motion";
import { useToast } from "@/components/Toast";
import { Reorder, AnimatePresence } from "framer-motion";

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

const ROLES = ["Controller", "Duelist", "Initiator", "Sentinel"];

function save(list: string[]) {
  localStorage.setItem("dv-locked-agents", JSON.stringify(list));
}

export default function AgentsPage() {
  const [locked, setLocked] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem("dv-locked-agents");
    if (saved) {
      try { setLocked(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  function toggle(name: string) {
    if (locked.includes(name)) {
      const next = locked.filter((n) => n !== name);
      setLocked(next);
      save(next);
      return;
    }
    if (locked.length >= 5) {
      toast("max 5 agents. remove one first.", "error");
      return;
    }
    const next = [...locked, name];
    setLocked(next);
    save(next);
  }

  function remove(name: string) {
    const next = locked.filter((n) => n !== name);
    setLocked(next);
    save(next);
  }

  function clearAll() {
    setLocked([]);
    localStorage.removeItem("dv-locked-agents");
    toast("picks cleared", "info");
  }

  function handleReorder(newOrder: string[]) {
    setLocked(newOrder);
    save(newOrder);
  }

  return (
    <>
      <FadeUp>
        <p className="mb-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Crosshair className="h-3.5 w-3.5" />
          agent select
        </p>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          pick priority
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
          choose up to 5 agents. drag to reorder. saved locally.
        </p>
      </FadeUp>

      <FadeUp delay={0.08} className="mt-8 space-y-6 sm:mt-10 sm:space-y-8">
        {ROLES.map((role) => (
          <div key={role}>
            <p className="mb-2 text-[13px] font-medium lowercase text-muted-foreground sm:mb-2.5">
              {role}
            </p>
            <Stagger className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 md:grid-cols-7 sm:gap-2">
              {AGENTS.filter((a) => a.role === role).map((a) => {
                const selected = locked.includes(a.name);
                const idx = locked.indexOf(a.name);
                return (
                  <StaggerItem key={a.name}>
                    <button
                      onClick={() => toggle(a.name)}
                      className={`relative flex w-full cursor-pointer flex-col items-center gap-1 rounded-xl p-2 transition-all duration-200 sm:gap-1.5 sm:p-2.5 ${
                        selected
                          ? "bg-accent/10 ring-1 ring-accent"
                          : "bg-card hover:bg-muted"
                      }`}
                    >
                      {selected && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white">
                          {idx + 1}
                        </span>
                      )}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={a.img}
                        alt={a.name}
                        className="h-8 w-8 rounded-full sm:h-9 sm:w-9"
                      />
                      <span className="text-[9px] font-medium text-muted-foreground sm:text-[10px]">
                        {a.name}
                      </span>
                    </button>
                  </StaggerItem>
                );
              })}
            </Stagger>
          </div>
        ))}
      </FadeUp>

      <FadeUp delay={0.16} className="mt-8 pb-8 sm:mt-10">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
            <ListOrdered className="h-3.5 w-3.5" />
            your priority
          </p>
          {locked.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1 text-xs">
              <Trash2 className="h-3 w-3" />
              clear
            </Button>
          )}
        </div>

        {locked.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-muted/50 py-10 text-center">
            <MousePointerClick className="h-5 w-5 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              tap agents above to build your list.
            </p>
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={locked}
            onReorder={handleReorder}
            className="space-y-2"
          >
            <AnimatePresence initial={false}>
              {locked.map((name, i) => {
                const agent = AGENTS.find((a) => a.name === name);
                return (
                  <Reorder.Item
                    key={name}
                    value={name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.2 }}
                    whileDrag={{
                      scale: 1.02,
                      boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                    }}
                    className="flex cursor-grab items-center gap-2.5 rounded-xl bg-card px-3 py-2.5 ring-1 ring-border active:cursor-grabbing sm:gap-3 sm:px-4 sm:py-3"
                  >
                    <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                    <span className="w-5 text-sm font-semibold text-accent">{i + 1}</span>
                    {agent && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={agent.img} alt={name} className="h-6 w-6 rounded-full sm:h-7 sm:w-7" />
                    )}
                    <span className="flex-1 text-xs font-medium sm:text-sm">{name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); remove(name); }}
                      className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </Reorder.Item>
                );
              })}
            </AnimatePresence>
          </Reorder.Group>
        )}
      </FadeUp>
    </>
  );
}
