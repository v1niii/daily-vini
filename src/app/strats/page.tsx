"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Pen, Eraser, Undo2, Trash2, Download, Save, Plus, Type, ImagePlus,
  ChevronLeft, ChevronRight, Swords, Shield, X, Users, UserX,
  FolderOpen, Map as MapIcon, Crosshair, PanelLeftClose, PanelLeftOpen,
  ZoomIn, ZoomOut, Maximize2, Filter, ArrowUpRight, Copy, Share2,
  MousePointer2, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import { AnimatePresence, motion } from "framer-motion";
import {
  MAPS, COLORS, ROLE_ICONS, ABILITY_AOE, hasDirectionalAoe,
  type AgentData, type MapData, type DrawPath, type PlacedItem, type TextItem,
  type StratStep, type Strategy, type AoeShape,
  emptyStep, uid,
} from "./data";

const SPIKE_IMG = "/spike.png";
const ALLY_CLR = "#2dd4bf";
const ENEMY_CLR = "#ff4655";
type Tool = "move" | "pen" | "eraser" | "place" | "text" | "image" | "arrow";
type Side = "attack" | "defense";
type Team = "ally" | "enemy";
type Interaction = "none" | "drawing" | "dragging" | "dragging-text" | "rotating" | "resizing" | "panning";

const imgCache = new Map<string, HTMLImageElement>();
function loadImg(url: string, cb?: () => void): HTMLImageElement | null {
  if (imgCache.has(url)) return imgCache.get(url)!;
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = url;
  img.onload = () => { imgCache.set(url, img); cb?.(); };
  return null;
}

const ROLES = ["Controller", "Duelist", "Initiator", "Sentinel"];
const SZ_AGENT = 26; const SZ_ABILITY = 18; const SZ_SPIKE = 19;
const HANDLE_R = 4;
const ROT_HANDLE_DIST = 20;
const MAX_UNDO = 50;
const SNAP_THRESH = 0.008;

function Btn({ active, onClick, children, title }: { active?: boolean; onClick: () => void; children: React.ReactNode; title: string }) {
  return (
    <button onClick={onClick} title={title} className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl transition-colors duration-200 ${active ? "bg-accent text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
      {children}
    </button>
  );
}

function invertStep(step: StratStep): StratStep {
  return {
    paths: step.paths.map((p) => ({ ...p, points: p.points.map((pt) => ({ x: 1 - pt.x, y: 1 - pt.y })) })),
    items: step.items.map((it) => ({ ...it, x: 1 - it.x, y: 1 - it.y, rotation: it.rotation + Math.PI })),
    texts: step.texts.map((t) => ({ ...t, x: 1 - t.x, y: 1 - t.y })),
  };
}

function adjustAlpha(rgba: string, mult: number): string {
  const m = rgba.match(/rgba?\(([\d.]+),([\d.]+),([\d.]+),([\d.]+)\)/);
  if (!m) return rgba;
  return `rgba(${m[1]},${m[2]},${m[3]},${Math.min(1, parseFloat(m[4]) * mult)})`;
}

export default function StratsPage() {
  const { toast } = useToast();
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [onMapFilter, setOnMapFilter] = useState(false);
  const [map, setMap] = useState<MapData>(MAPS[5]);
  const [side, setSide] = useState<Side>("defense");
  const [team, setTeam] = useState<Team>("ally");
  const [steps, setSteps] = useState<StratStep[]>([emptyStep()]);
  const [stepIdx, setStepIdx] = useState(0);
  const [stratName, setStratName] = useState("");
  const [savedStrats, setSavedStrats] = useState<Strategy[]>([]);
  const [showStrats, setShowStrats] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tool, setTool] = useState<Tool>("move");
  const [color, setColor] = useState(COLORS[0]);
  const [penSize, setPenSize] = useState(3);
  const [placementItem, setPlacementItem] = useState<{ imgUrl: string; label: string; size: number; kind: PlacedItem["kind"]; aoe?: AoeShape; imgW?: number; imgH?: number } | null>(null);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panOff, setPanOff] = useState({ x: 0, y: 0 });
  const [hoverLabel, setHoverLabel] = useState("");
  const [textModal, setTextModal] = useState<{ x: number; y: number; cx: number; cy: number } | null>(null);
  const [textInput, setTextInput] = useState("");
  const [textBold, setTextBold] = useState(false);
  const [textSize, setTextSize] = useState(14);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [aoeOpacity, setAoeOpacity] = useState(1.0);
  const [stratTags, setStratTags] = useState("");
  const [mapDropdown, setMapDropdown] = useState(false);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Refs for RAF
  const stepsRef = useRef(steps); const stepIdxRef = useRef(stepIdx);
  const zoomRef = useRef(zoom); const panRef = useRef(panOff);
  const toolRef = useRef(tool); const colorRef = useRef(color); const penSizeRef = useRef(penSize);
  const aoeOpacityRef = useRef(aoeOpacity);
  stepsRef.current = steps; stepIdxRef.current = stepIdx;
  zoomRef.current = zoom; panRef.current = panOff; toolRef.current = tool;
  colorRef.current = color; penSizeRef.current = penSize; aoeOpacityRef.current = aoeOpacity;

  const interaction = useRef<Interaction>("none");
  const targetId = useRef<string | null>(null);
  const lastInteractedId = useRef<string | null>(null);
  const panStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const resizeStart = useRef({ dist: 0, w: 0, h: 0 });
  const curPath = useRef<{ x: number; y: number }[]>([]);
  const pathCommitted = useRef(false);
  const curToolSnap = useRef<"pen" | "eraser" | "arrow">("pen");
  const spaceDown = useRef(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapImg = useRef<HTMLImageElement | null>(null);
  const rafId = useRef(0);
  const dpr = useRef(1);
  const mapBounds = useRef({ x1: 0, y1: 0, x2: 1, y2: 1 });
  const cssSize = useRef({ w: 1, h: 1 });
  const fileRef = useRef<HTMLInputElement>(null);
  const cachedRect = useRef<DOMRect | null>(null);
  const undoStack = useRef<Map<number, StratStep[]>>(new Map());
  const liveItemOverride = useRef<Map<string, Partial<PlacedItem>>>(new Map());
  const liveTextOverride = useRef<Map<string, { x: number; y: number }>>(new Map());
  const alignGuides = useRef<{ x?: number; y?: number }>({});
  const clipboardItem = useRef<PlacedItem | null>(null);
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);

  // Ability → agent lookup for hover labels
  const abilityAgentMap = useMemo(() => {
    const m = new Map<string, { agent: string; isUlt: boolean }>();
    for (const a of agents) for (const ab of a.abilities) m.set(ab.name, { agent: a.name, isUlt: ab.slot === "Ultimate" });
    return m;
  }, [agents]);
  const abilityMapRef = useRef(abilityAgentMap);
  abilityMapRef.current = abilityAgentMap;

  function computeBounds() {
    const img = mapImg.current, cw = cssSize.current.w, ch = cssSize.current.h;
    if (!img || cw === 0) return;
    const sc = Math.min(cw / img.width, ch / img.height) * 0.98;
    const iw = img.width * sc, ih = img.height * sc;
    const ox = (cw - iw) / 2, oy = (ch - ih) / 2;
    mapBounds.current = { x1: ox / cw, y1: oy / ch, x2: (ox + iw) / cw, y2: (oy + ih) / ch };
  }

  // ── Data ──
  useEffect(() => {
    fetch("https://valorant-api.com/v1/agents?isPlayableCharacter=true").then((r) => r.json()).then((json) => {
      const list: AgentData[] = (json.data || []).map((a: any) => ({ uuid: a.uuid, name: a.displayName, icon: a.displayIcon, role: a.role?.displayName || "",
        abilities: (a.abilities || []).filter((ab: any) => ab.displayIcon).map((ab: any) => ({ name: ab.displayName, slot: ab.slot, icon: ab.displayIcon })),
      })).sort((a: AgentData, b: AgentData) => a.name.localeCompare(b.name));
      setAgents(list); list.forEach((a) => loadImg(a.icon));
    }).catch(() => {});
    loadImg(SPIKE_IMG);
  }, []);
  useEffect(() => { const s = localStorage.getItem("dv-strats"); if (s) try { setSavedStrats(JSON.parse(s)); } catch {} }, []);
  const mapSrc = side === "attack" ? map.atkImg : map.defImg;
  useEffect(() => { const img = new Image(); img.crossOrigin = "anonymous"; img.src = mapSrc; img.onload = () => { mapImg.current = img; computeBounds(); scheduleRedraw(); }; }, [mapSrc]);

  // Import shared strat from URL
  useEffect(() => {
    const imported = sessionStorage.getItem("dv-import-strat");
    if (imported) {
      sessionStorage.removeItem("dv-import-strat");
      try {
        const data = JSON.parse(imported);
        if (data.map) setMap(MAPS.find((m) => m.id === data.map) || MAPS[0]);
        if (data.side) setSide(data.side);
        if (data.steps?.length) setSteps(data.steps); else setSteps([emptyStep()]);
        setStepIdx(0);
        if (data.name) setStratName(data.name);
        if (data.tags) setStratTags(data.tags.join(", "));
        resetView(); undoStack.current.clear();
        toast("shared strat loaded", "success");
      } catch {}
    }
  }, []);

  // ResizeObserver — handles window resize AND sidebar toggle
  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    function update() {
      const c = canvasRef.current, b = bgRef.current, p = containerRef.current;
      if (!c || !b || !p) return;
      dpr.current = window.devicePixelRatio || 1;
      const w = p.clientWidth, h = p.clientHeight, d = dpr.current;
      cssSize.current = { w, h };
      c.width = w * d; c.height = h * d; b.width = w * d; b.height = h * d;
      c.style.width = w + "px"; c.style.height = h + "px";
      b.style.width = w + "px"; b.style.height = h + "px";
      cachedRect.current = c.getBoundingClientRect();
      computeBounds(); scheduleRedraw();
    }
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => { const el = containerRef.current; if (!el) return; function onWheel(e: WheelEvent) { e.preventDefault(); e.stopPropagation(); setZoom((z) => Math.max(0.5, Math.min(4, z * (e.deltaY > 0 ? 0.92 : 1.08)))); } el.addEventListener("wheel", onWheel, { passive: false }); return () => el.removeEventListener("wheel", onWheel); }, []);
  useEffect(() => { if (pathCommitted.current) { curPath.current = []; pathCommitted.current = false; } scheduleRedraw(); }, [steps, stepIdx, side, map, zoom, panOff, aoeOpacity]);
  useEffect(() => { if (textModal) setTimeout(() => textInputRef.current?.focus(), 50); }, [textModal]);

  useEffect(() => {
    if (!selectedAgent) return;
    const visible = roleFilter ? agents.filter((a) => a.role === roleFilter) : agents;
    const onMap = new Set(steps[stepIdx]?.items.filter((i) => i.kind === "agent").map((i) => i.label) || []);
    const pool = onMapFilter ? visible.filter((a) => onMap.has(a.name)) : visible;
    if (!pool.find((a) => a.uuid === selectedAgent.uuid)) { setSelectedAgent(null); cancelPlacement(); }
  }, [roleFilter, onMapFilter, agents, selectedAgent, steps, stepIdx]);

  useEffect(() => {
    function down(e: KeyboardEvent) {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (e.code === "Space" && !spaceDown.current) { spaceDown.current = true; e.preventDefault(); }
      if (e.key === "Escape") { cancelPlacement(); setTextModal(null); setShowShortcuts(false); setMapDropdown(false); }
      if (e.key === "v" || e.key === "V") { setTool("move"); cancelPlacement(); }
      if (e.ctrlKey && e.key === "z") { e.preventDefault(); undo(); }
      if (e.key === "Delete") deleteStep();
      if (e.key === "?") setShowShortcuts((s) => !s);
      if (e.ctrlKey && e.key === "c") {
        e.preventDefault();
        const cur = stepsRef.current[stepIdxRef.current];
        if (cur && lastInteractedId.current) {
          const item = cur.items.find((i) => i.id === lastInteractedId.current);
          if (item) { clipboardItem.current = { ...item }; toast("copied", "success"); }
        }
      }
      if (e.ctrlKey && e.key === "v") {
        e.preventDefault();
        const item = clipboardItem.current;
        if (item) {
          pushUndo();
          const newItem = { ...item, id: uid(), x: item.x + 0.02, y: item.y + 0.02 };
          setSteps((s) => s.map((st, i) => i === stepIdxRef.current ? { ...st, items: [...st.items, newItem] } : st));
          toast("pasted", "success");
        }
      }
    }
    function up(e: KeyboardEvent) { if (e.code === "Space") spaceDown.current = false; }
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  });

  function scheduleRedraw() { cancelAnimationFrame(rafId.current); rafId.current = requestAnimationFrame(doRedraw); }

  function doRedraw() {
    const c = canvasRef.current, b = bgRef.current; if (!c || !b) return;
    const ctx = c.getContext("2d")!, bctx = b.getContext("2d")!;
    const w = c.width, h = c.height, d = dpr.current, cw = w / d, ch = h / d;
    const z = zoomRef.current, pn = panRef.current;
    const cur = stepsRef.current[stepIdxRef.current];
    const opMul = aoeOpacityRef.current;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    bctx.imageSmoothingEnabled = true; bctx.imageSmoothingQuality = "high";
    function view(c2: CanvasRenderingContext2D) { c2.translate(cw / 2 + pn.x, ch / 2 + pn.y); c2.scale(z, z); c2.translate(-cw / 2, -ch / 2); }

    bctx.clearRect(0, 0, w, h); bctx.save(); bctx.scale(d, d); view(bctx);
    if (mapImg.current) { const img = mapImg.current; const sc = Math.min(cw / img.width, ch / img.height) * 0.98; const iw = img.width * sc, ih = img.height * sc; bctx.drawImage(img, (cw - iw) / 2, (ch - ih) / 2, iw, ih); }
    bctx.restore();

    ctx.clearRect(0, 0, w, h); if (!cur) return;
    ctx.save(); ctx.scale(d, d); view(ctx);

    const getItem = (item: PlacedItem): PlacedItem => { const ov = liveItemOverride.current.get(item.id); return ov ? { ...item, ...ov } as PlacedItem : item; };
    const getText = (t: TextItem): TextItem => { const ov = liveTextOverride.current.get(t.id); return ov ? { ...t, ...ov } : t; };

    // Pen
    for (const p of cur.paths) { if (p.tool !== "pen" || p.points.length < 2) continue; ctx.beginPath(); ctx.moveTo(p.points[0].x * cw, p.points[0].y * ch); for (let i = 1; i < p.points.length; i++) ctx.lineTo(p.points[i].x * cw, p.points[i].y * ch); ctx.strokeStyle = p.color; ctx.lineWidth = p.size; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke(); }
    // Eraser
    for (const p of cur.paths) { if (p.tool !== "eraser" || p.points.length < 2) continue; ctx.globalCompositeOperation = "destination-out"; ctx.beginPath(); ctx.moveTo(p.points[0].x * cw, p.points[0].y * ch); for (let i = 1; i < p.points.length; i++) ctx.lineTo(p.points[i].x * cw, p.points[i].y * ch); ctx.lineWidth = p.size * 4; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke(); }
    ctx.globalCompositeOperation = "source-over";
    // Arrows
    for (const p of cur.paths) {
      if (p.tool !== "arrow" || p.points.length < 2) continue;
      const [a, bp] = [p.points[0], p.points[p.points.length - 1]];
      ctx.beginPath(); ctx.moveTo(a.x * cw, a.y * ch); ctx.lineTo(bp.x * cw, bp.y * ch);
      ctx.strokeStyle = p.color; ctx.lineWidth = p.size; ctx.lineCap = "round"; ctx.stroke();
      const angle = Math.atan2((bp.y - a.y) * ch, (bp.x - a.x) * cw), hl = 12;
      ctx.beginPath(); ctx.moveTo(bp.x * cw, bp.y * ch);
      ctx.lineTo(bp.x * cw - hl * Math.cos(angle - Math.PI / 6), bp.y * ch - hl * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(bp.x * cw, bp.y * ch);
      ctx.lineTo(bp.x * cw - hl * Math.cos(angle + Math.PI / 6), bp.y * ch - hl * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    }
    // In-progress stroke
    const cp = curPath.current;
    if (cp.length >= 2 && curToolSnap.current === "arrow") {
      const [a, bp] = [cp[0], cp[cp.length - 1]];
      ctx.beginPath(); ctx.moveTo(a.x * cw, a.y * ch); ctx.lineTo(bp.x * cw, bp.y * ch);
      ctx.strokeStyle = colorRef.current; ctx.lineWidth = penSizeRef.current; ctx.lineCap = "round"; ctx.stroke();
      const angle = Math.atan2((bp.y - a.y) * ch, (bp.x - a.x) * cw), hl = 12;
      ctx.beginPath(); ctx.moveTo(bp.x * cw, bp.y * ch);
      ctx.lineTo(bp.x * cw - hl * Math.cos(angle - Math.PI / 6), bp.y * ch - hl * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(bp.x * cw, bp.y * ch);
      ctx.lineTo(bp.x * cw - hl * Math.cos(angle + Math.PI / 6), bp.y * ch - hl * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    } else if (cp.length >= 2) {
      ctx.beginPath(); ctx.moveTo(cp[0].x * cw, cp[0].y * ch); for (let i = 1; i < cp.length; i++) ctx.lineTo(cp[i].x * cw, cp[i].y * ch);
      if (curToolSnap.current === "eraser") { ctx.globalCompositeOperation = "destination-out"; ctx.lineWidth = penSizeRef.current * 4; } else { ctx.strokeStyle = colorRef.current; ctx.lineWidth = penSizeRef.current; }
      ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke(); ctx.globalCompositeOperation = "source-over";
    }

    // AOE overlays
    for (const raw of cur.items) {
      const item = getItem(raw);
      if (!item.aoe) continue;
      const ix = item.x * cw, iy = item.y * ch, aoe = item.aoe;
      ctx.save(); ctx.translate(ix, iy); ctx.rotate(item.rotation);
      ctx.fillStyle = adjustAlpha(aoe.color, opMul);
      if (aoe.type === "circle") { ctx.beginPath(); ctx.arc(0, 0, aoe.radius * cw, 0, Math.PI * 2); ctx.fill(); }
      else if (aoe.type === "cone") { const r = aoe.radius * cw, a = aoe.angle || Math.PI / 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, -Math.PI / 2 - a / 2, -Math.PI / 2 + a / 2); ctx.closePath(); ctx.fill(); }
      else if (aoe.type === "line") { const len = (aoe.length || 0.5) * cw, wid = aoe.radius * cw; ctx.fillRect(-wid, -len, wid * 2, len); }
      ctx.restore();
    }

    // Items
    for (const raw of cur.items) {
      const item = getItem(raw);
      const ix = item.x * cw, iy = item.y * ch, sz = item.size;
      const ring = item.team === "enemy" ? ENEMY_CLR : ALLY_CLR;
      const bg = item.team === "enemy" ? "rgba(255,70,85,0.25)" : "rgba(45,212,191,0.25)";
      const cached = imgCache.get(item.imgUrl);
      const directional = hasDirectionalAoe(item);

      if (item.kind === "spike") { if (cached) ctx.drawImage(cached, ix - sz / 2, iy - sz / 2, sz, sz); else loadImg(item.imgUrl, scheduleRedraw); continue; }
      if (item.kind === "image") {
        const iw = item.imgW || sz, ih = item.imgH || sz;
        if (cached) { ctx.drawImage(cached, ix - iw / 2, iy - ih / 2, iw, ih); ctx.beginPath(); ctx.arc(ix + iw / 2, iy + ih / 2, 4, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill(); ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = 1; ctx.stroke(); }
        else loadImg(item.imgUrl, scheduleRedraw);
        continue;
      }

      if (directional) {
        ctx.save(); ctx.translate(ix, iy); ctx.rotate(item.rotation);
        ctx.beginPath(); ctx.moveTo(0, -sz / 2 - 8); ctx.lineTo(-4, -sz / 2 - 2); ctx.lineTo(4, -sz / 2 - 2); ctx.closePath();
        ctx.fillStyle = ring; ctx.globalAlpha = 0.8; ctx.fill(); ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(0, -ROT_HANDLE_DIST, HANDLE_R, 0, Math.PI * 2);
        ctx.fillStyle = ENEMY_CLR; ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 1; ctx.stroke();
        ctx.restore();
      }

      if (item.kind === "ability") {
        const half = sz / 2, r = 4;
        if (!cached) { loadImg(item.imgUrl, scheduleRedraw); continue; }
        ctx.save(); ctx.beginPath(); ctx.roundRect(ix - half, iy - half, sz, sz, r);
        ctx.fillStyle = bg; ctx.fill(); ctx.clip();
        ctx.drawImage(cached, ix - half, iy - half, sz, sz); ctx.restore();
        ctx.beginPath(); ctx.roundRect(ix - half, iy - half, sz, sz, r);
        ctx.strokeStyle = ring; ctx.lineWidth = 2; ctx.stroke();
      } else {
        ctx.save(); ctx.beginPath(); ctx.arc(ix, iy, sz / 2 + 4, 0, Math.PI * 2);
        ctx.fillStyle = bg; ctx.fill(); ctx.restore();
        if (cached) { ctx.save(); ctx.beginPath(); ctx.arc(ix, iy, sz / 2, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(cached, ix - sz / 2, iy - sz / 2, sz, sz); ctx.restore(); ctx.beginPath(); ctx.arc(ix, iy, sz / 2, 0, Math.PI * 2); ctx.strokeStyle = ring; ctx.lineWidth = 2; ctx.stroke(); }
        else loadImg(item.imgUrl, scheduleRedraw);
        // Agent name label
        if (item.kind === "agent") {
          const name = item.label.length > 9 ? item.label.slice(0, 8) + "\u2026" : item.label;
          ctx.font = "bold 7px Inter, system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "top";
          const lm = ctx.measureText(name), ly = iy + sz / 2 + 3;
          ctx.fillStyle = "rgba(0,0,0,0.65)"; ctx.beginPath(); ctx.roundRect(ix - lm.width / 2 - 3, ly, lm.width + 6, 10, 3); ctx.fill();
          ctx.fillStyle = "#fff"; ctx.fillText(name, ix, ly + 1);
        }
      }
    }

    // Text
    for (const raw of cur.texts) {
      const t = getText(raw);
      const fw = t.bold ? "bold " : ""; ctx.font = `${fw}${t.fontSize}px Inter, system-ui, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const m = ctx.measureText(t.text); ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.beginPath();
      ctx.roundRect(t.x * cw - m.width / 2 - 5, t.y * ch - t.fontSize / 2 - 3, m.width + 10, t.fontSize + 6, 4); ctx.fill();
      ctx.fillStyle = t.color; ctx.fillText(t.text, t.x * cw, t.y * ch);
    }

    // Alignment guides
    const ag = alignGuides.current;
    if (ag.x !== undefined || ag.y !== undefined) {
      ctx.save(); ctx.strokeStyle = "rgba(255,200,50,0.5)"; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      if (ag.x !== undefined) { ctx.beginPath(); ctx.moveTo(ag.x * cw, 0); ctx.lineTo(ag.x * cw, ch); ctx.stroke(); }
      if (ag.y !== undefined) { ctx.beginPath(); ctx.moveTo(0, ag.y * ch); ctx.lineTo(cw, ag.y * ch); ctx.stroke(); }
      ctx.restore();
    }

    ctx.restore();
  }

  // ── Coords ──
  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const rect = cachedRect.current; if (!rect) return { x: 0, y: 0 };
    const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
    const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
    const sx = cx - rect.left, sy = cy - rect.top, cw = rect.width, ch = rect.height;
    const z = zoomRef.current, pn = panRef.current;
    return { x: ((sx - cw / 2 - pn.x) / z + cw / 2) / cw, y: ((sy - ch / 2 - pn.y) / z + ch / 2) / ch };
  }
  function clamp(pos: { x: number; y: number }) { const b = mapBounds.current, m = 0.015, dx = (b.x2 - b.x1) * m, dy = (b.y2 - b.y1) * m; return { x: Math.max(b.x1 + dx, Math.min(b.x2 - dx, pos.x)), y: Math.max(b.y1 + dy, Math.min(b.y2 - dy, pos.y)) }; }
  function isInMap(pos: { x: number; y: number }) { const b = mapBounds.current; return pos.x >= b.x1 && pos.x <= b.x2 && pos.y >= b.y1 && pos.y <= b.y2; }
  function getCSSPos(e: React.MouseEvent | React.TouchEvent) {
    const rect = cachedRect.current; if (!rect) return null;
    const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
    const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: cx - rect.left, y: cy - rect.top };
  }

  // ── Hit testing (zoom-scaled) ──
  function findItemAt(pos: { x: number; y: number }): PlacedItem | null {
    const cur = stepsRef.current[stepIdxRef.current]; if (!cur) return null;
    const cw = cssSize.current.w, ch = cssSize.current.h, z = zoomRef.current;
    for (let i = cur.items.length - 1; i >= 0; i--) { const it = cur.items[i]; const dx = (pos.x - it.x) * cw * z, dy = (pos.y - it.y) * ch * z; if (Math.sqrt(dx * dx + dy * dy) < it.size / 2 * z + 12) return it; }
    return null;
  }
  function findTextAt(pos: { x: number; y: number }): TextItem | null {
    const cur = stepsRef.current[stepIdxRef.current]; if (!cur) return null;
    const cw = cssSize.current.w, ch = cssSize.current.h, z = zoomRef.current;
    for (let i = cur.texts.length - 1; i >= 0; i--) { const t = cur.texts[i]; if (Math.abs((pos.x - t.x) * cw * z) < 40 && Math.abs((pos.y - t.y) * ch * z) < 14) return t; }
    return null;
  }
  function findRotHandle(pos: { x: number; y: number }): PlacedItem | null {
    const cur = stepsRef.current[stepIdxRef.current]; if (!cur) return null;
    const cw = cssSize.current.w, ch = cssSize.current.h, z = zoomRef.current;
    for (let i = cur.items.length - 1; i >= 0; i--) {
      const it = cur.items[i]; if (!hasDirectionalAoe(it)) continue;
      const hx = it.x + Math.sin(it.rotation) * ROT_HANDLE_DIST / (cw * z);
      const hy = it.y - Math.cos(it.rotation) * ROT_HANDLE_DIST / (ch * z);
      const dx = (pos.x - hx) * cw * z, dy = (pos.y - hy) * ch * z;
      if (Math.sqrt(dx * dx + dy * dy) < HANDLE_R + 10) return it;
    }
    return null;
  }
  function findResizeHandle(pos: { x: number; y: number }): PlacedItem | null {
    const cur = stepsRef.current[stepIdxRef.current]; if (!cur) return null;
    const cw = cssSize.current.w, ch = cssSize.current.h, z = zoomRef.current;
    for (let i = cur.items.length - 1; i >= 0; i--) {
      const it = cur.items[i]; if (it.kind !== "image") continue;
      const iw = it.imgW || it.size, ih = it.imgH || it.size;
      const hx = it.x + (iw / 2) / cw, hy = it.y + (ih / 2) / ch;
      const dx = (pos.x - hx) * cw * z, dy = (pos.y - hy) * ch * z;
      if (Math.sqrt(dx * dx + dy * dy) < 12) return it;
    }
    return null;
  }

  // ── Undo ──
  function pushUndo() {
    const cur = stepsRef.current[stepIdxRef.current]; if (!cur) return;
    const idx = stepIdxRef.current;
    const stack = undoStack.current.get(idx) || [];
    stack.push(JSON.parse(JSON.stringify(cur)));
    if (stack.length > MAX_UNDO) stack.shift();
    undoStack.current.set(idx, stack);
  }
  function undo() {
    const stack = undoStack.current.get(stepIdxRef.current);
    if (!stack || stack.length === 0) return;
    const prev = stack.pop()!;
    setSteps((s) => s.map((st, i) => i === stepIdxRef.current ? prev : st));
  }

  // ── Hover label with agent info ──
  function getHoverLabel(item: PlacedItem): string {
    if (item.kind === "ability") {
      const info = abilityMapRef.current.get(item.label);
      if (info) return `${info.agent} \u2014 ${item.label}${info.isUlt ? " (ult)" : ""}`;
    }
    return item.label;
  }

  // ── Events ──
  function startPan(e: React.MouseEvent | React.TouchEvent) {
    interaction.current = "panning";
    const cx = "touches" in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const cy = "touches" in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    panStart.current = { x: cx, y: cy, ox: panRef.current.x, oy: panRef.current.y };
  }

  function onDown(e: React.MouseEvent | React.TouchEvent) {
    const pos = getPos(e);
    // Pan via space or middle click
    if (spaceDown.current || ("button" in e && e.button === 1)) { startPan(e); return; }

    // Rotation/resize handles — ALWAYS work regardless of tool
    const rh = findRotHandle(pos);
    if (rh) { interaction.current = "rotating"; targetId.current = rh.id; lastInteractedId.current = rh.id; pushUndo(); return; }
    const rsh = findResizeHandle(pos);
    if (rsh) {
      interaction.current = "resizing"; targetId.current = rsh.id; lastInteractedId.current = rsh.id; pushUndo();
      const iw = rsh.imgW || rsh.size, ih = rsh.imgH || rsh.size;
      const dx = (pos.x - rsh.x) * cssSize.current.w, dy = (pos.y - rsh.y) * cssSize.current.h;
      resizeStart.current = { dist: Math.sqrt(dx * dx + dy * dy), w: iw, h: ih };
      return;
    }

    // Move tool — drag items/texts, or pan on empty space
    if (tool === "move") {
      const it = findItemAt(pos);
      if (it) { interaction.current = "dragging"; targetId.current = it.id; lastInteractedId.current = it.id; pushUndo(); return; }
      const txt = findTextAt(pos);
      if (txt) { interaction.current = "dragging-text"; targetId.current = txt.id; pushUndo(); return; }
      startPan(e);
      return;
    }

    // Text tool
    if (tool === "text") { if (!isInMap(pos)) return; const css = getCSSPos(e); if (css) { setTextInput(""); setTextModal({ x: pos.x, y: pos.y, cx: css.x, cy: css.y }); } return; }
    // Place tool
    if (tool === "place" && placementItem) {
      if (!isInMap(pos)) return;
      const clamped = clamp(pos);
      pushUndo();
      setSteps((prev) => prev.map((s, i) => i === stepIdx ? { ...s, items: [...s.items, { id: uid(), ...clamped, rotation: 0, ...placementItem, team: placementItem.kind === "spike" ? "ally" as Team : team }] } : s));
      return;
    }
    // Drawing tools — always draw, never intercept items
    if (tool === "pen" || tool === "eraser" || tool === "arrow") {
      interaction.current = "drawing"; curToolSnap.current = tool;
      curPath.current = tool === "arrow" ? [pos, pos] : [pos];
      return;
    }
  }

  function onMove(e: React.MouseEvent | React.TouchEvent) {
    const pos = getPos(e);
    const hi = findItemAt(pos); const ht = findTextAt(pos);
    setHoverLabel(hi ? getHoverLabel(hi) : ht ? ht.text : "");

    if (interaction.current === "panning") {
      const cx = "touches" in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
      const cy = "touches" in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
      setPanOff({ x: panStart.current.ox + cx - panStart.current.x, y: panStart.current.oy + cy - panStart.current.y });
      return;
    }
    if (tool === "place" && placementItem) { setGhostPos(getCSSPos(e)); return; }

    if (interaction.current === "rotating" && targetId.current) {
      e.preventDefault();
      const tid = targetId.current;
      const cur = stepsRef.current[stepIdxRef.current];
      const it = cur?.items.find((i) => i.id === tid);
      if (it) { liveItemOverride.current.set(tid, { rotation: Math.atan2(pos.x - it.x, -(pos.y - it.y)) }); scheduleRedraw(); }
      return;
    }
    if (interaction.current === "resizing" && targetId.current) {
      e.preventDefault();
      const tid = targetId.current;
      const cur = stepsRef.current[stepIdxRef.current];
      const it = cur?.items.find((i) => i.id === tid);
      if (it) {
        const dx = (pos.x - it.x) * cssSize.current.w, dy = (pos.y - it.y) * cssSize.current.h;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const scale = Math.max(0.3, Math.min(5, dist / resizeStart.current.dist));
        liveItemOverride.current.set(tid, { imgW: resizeStart.current.w * scale, imgH: resizeStart.current.h * scale });
        scheduleRedraw();
      }
      return;
    }
    if (interaction.current === "dragging" && targetId.current) {
      e.preventDefault();
      const clamped = clamp(pos);
      const guides: { x?: number; y?: number } = {};
      const cur = stepsRef.current[stepIdxRef.current];
      if (cur) {
        for (const other of cur.items) {
          if (other.id === targetId.current) continue;
          if (Math.abs(clamped.x - other.x) < SNAP_THRESH) { clamped.x = other.x; guides.x = other.x; }
          if (Math.abs(clamped.y - other.y) < SNAP_THRESH) { clamped.y = other.y; guides.y = other.y; }
        }
      }
      alignGuides.current = guides;
      liveItemOverride.current.set(targetId.current, { x: clamped.x, y: clamped.y });
      scheduleRedraw();
      return;
    }
    if (interaction.current === "dragging-text" && targetId.current) {
      e.preventDefault();
      liveTextOverride.current.set(targetId.current, clamp(pos));
      scheduleRedraw();
      return;
    }
    if (interaction.current === "drawing") {
      e.preventDefault();
      if (curToolSnap.current === "arrow") { curPath.current = [curPath.current[0], pos]; }
      else { curPath.current.push(pos); }
      scheduleRedraw();
      return;
    }
  }

  function onUp() {
    const prev = interaction.current;
    const tid = targetId.current;
    interaction.current = "none"; targetId.current = null;
    alignGuides.current = {};

    if ((prev === "dragging" || prev === "rotating" || prev === "resizing") && tid) {
      const ov = liveItemOverride.current.get(tid);
      if (ov) {
        setSteps((s) => s.map((st, i) => i === stepIdxRef.current ? { ...st, items: st.items.map((it) => it.id === tid ? { ...it, ...ov } : it) } : st));
        liveItemOverride.current.delete(tid);
      }
    }
    if (prev === "dragging-text" && tid) {
      const ov = liveTextOverride.current.get(tid);
      if (ov) {
        setSteps((s) => s.map((st, i) => i === stepIdxRef.current ? { ...st, texts: st.texts.map((t) => t.id === tid ? { ...t, ...ov } : t) } : st));
        liveTextOverride.current.delete(tid);
      }
    }
    if (prev === "drawing") {
      if (curToolSnap.current === "arrow" && curPath.current.length >= 2) {
        const [a, b] = [curPath.current[0], curPath.current[curPath.current.length - 1]];
        if (Math.abs(a.x - b.x) > 0.003 || Math.abs(a.y - b.y) > 0.003) {
          pushUndo();
          setSteps((s) => s.map((st, i) => i === stepIdxRef.current ? { ...st, paths: [...st.paths, { points: [a, b], color: colorRef.current, size: penSizeRef.current, tool: "arrow" }] } : st));
          pathCommitted.current = true;
        } else curPath.current = [];
      } else if (curPath.current.length >= 2) {
        pushUndo();
        setSteps((s) => s.map((st, i) => i === stepIdxRef.current ? { ...st, paths: [...st.paths, { points: [...curPath.current], color: colorRef.current, size: penSizeRef.current, tool: curToolSnap.current }] } : st));
        pathCommitted.current = true;
      } else curPath.current = [];
    }
    scheduleRedraw();
  }

  function onLeave() { setGhostPos(null); setHoverLabel(""); onUp(); }

  function onContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    const pos = getPos(e);
    const item = findItemAt(pos);
    if (item) { pushUndo(); setSteps((s) => s.map((st, i) => i === stepIdxRef.current ? { ...st, items: st.items.filter((it) => it.id !== item.id) } : st)); return; }
    const text = findTextAt(pos);
    if (text) { pushUndo(); setSteps((s) => s.map((st, i) => i === stepIdxRef.current ? { ...st, texts: st.texts.filter((t) => t.id !== text.id) } : st)); }
  }

  // Pinch-to-zoom
  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX, dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { dist: Math.sqrt(dx * dx + dy * dy), zoom: zoomRef.current };
      return;
    }
    onDown(e);
  }
  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX, dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      setZoom(Math.max(0.5, Math.min(4, pinchRef.current.zoom * (dist / pinchRef.current.dist))));
      return;
    }
    onMove(e);
  }
  function onTouchEnd(e: React.TouchEvent) { pinchRef.current = null; if (e.touches.length === 0) onUp(); }

  function resetView() { setZoom(1); setPanOff({ x: 0, y: 0 }); }
  function updateStep(fn: (s: StratStep) => StratStep) { pushUndo(); setSteps((prev) => prev.map((s, i) => i === stepIdx ? fn(s) : s)); }
  function clearStep() { updateStep(() => emptyStep()); }
  function addStep() { if (steps.length >= 10) { toast("max 10 steps.", "error"); return; } setSteps((p) => [...p, emptyStep()]); setStepIdx(steps.length); }
  function duplicateStep() { if (steps.length >= 10) { toast("max 10 steps.", "error"); return; } const cur = steps[stepIdx]; setSteps((p) => [...p.slice(0, stepIdx + 1), JSON.parse(JSON.stringify(cur)), ...p.slice(stepIdx + 1)]); setStepIdx(stepIdx + 1); }
  function goStep(i: number) { setStepIdx(i); }
  function deleteStep() { if (steps.length <= 1) { clearStep(); return; } setSteps((p) => p.filter((_, i) => i !== stepIdx)); setStepIdx((i) => Math.max(0, i - 1)); undoStack.current.delete(stepIdx); }
  function selectPlacement(imgUrl: string, label: string, size: number, kind: PlacedItem["kind"], aoe?: AoeShape, imgW?: number, imgH?: number) { setTool("place"); setPlacementItem({ imgUrl, label, size, kind, aoe, imgW, imgH }); loadImg(imgUrl); }
  function cancelPlacement() { setPlacementItem(null); if (tool === "place") setTool("move"); setGhostPos(null); }
  function submitText() { if (!textModal || !textInput.trim()) { setTextModal(null); return; } updateStep((s) => ({ ...s, texts: [...s.texts, { id: uid(), x: textModal.x, y: textModal.y, text: textInput.trim(), color, bold: textBold, fontSize: textSize }] })); setTextInput(""); setTextModal(null); }
  function handleImageUpload(file: File) { const url = URL.createObjectURL(file); const img = new Image(); img.onload = () => { imgCache.set(url, img); const max = 80, r = img.width / img.height; const w = r >= 1 ? max : max * r, h = r >= 1 ? max / r : max; selectPlacement(url, file.name, Math.max(w, h), "image", undefined, w, h); }; img.src = url; }

  function handleSideChange(newSide: Side) {
    if (newSide === side) return;
    setSide(newSide);
    setSteps((prev) => prev.map(invertStep));
    undoStack.current.clear();
  }

  function saveStrat() {
    const name = stratName.trim() || `${map.name} ${side}`;
    const tags = stratTags.split(",").map((t) => t.trim()).filter(Boolean);
    const updated = [...savedStrats, { id: uid(), name, map: map.id, side, steps, createdAt: Date.now(), tags: tags.length ? tags : undefined }];
    setSavedStrats(updated); localStorage.setItem("dv-strats", JSON.stringify(updated)); toast("strategy saved", "success");
  }
  function loadStrat(s: Strategy) { setMap(MAPS.find((m) => m.id === s.map) || MAPS[0]); setSide(s.side); setSteps(s.steps.length ? s.steps : [emptyStep()]); setStepIdx(0); setStratName(s.name); setStratTags(s.tags?.join(", ") || ""); setShowStrats(false); cancelPlacement(); resetView(); undoStack.current.clear(); }
  function deleteStrat(id: string) { const u = savedStrats.filter((s) => s.id !== id); setSavedStrats(u); localStorage.setItem("dv-strats", JSON.stringify(u)); }
  function newStrat() { setSteps([emptyStep()]); setStepIdx(0); setStratName(""); setStratTags(""); cancelPlacement(); resetView(); undoStack.current.clear(); }
  function exportImage() { const bg = bgRef.current, fg = canvasRef.current; if (!bg || !fg) return; const m = document.createElement("canvas"); m.width = bg.width; m.height = bg.height; const mctx = m.getContext("2d")!; mctx.drawImage(bg, 0, 0); mctx.drawImage(fg, 0, 0); const a = document.createElement("a"); a.download = `${stratName || "strat"}.png`; a.href = m.toDataURL(); a.click(); }

  async function shareStrat() {
    const data = { name: stratName.trim() || `${map.name} ${side}`, map: map.id, side, steps, tags: stratTags.split(",").map((t) => t.trim()).filter(Boolean) };
    try {
      const res = await fetch("/api/strats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const { id } = await res.json();
      const url = `${window.location.origin}/strats/${id}`;
      await navigator.clipboard.writeText(url);
      toast(`link copied: /strats/${id}`, "success");
    } catch { toast("failed to share", "error"); }
  }

  async function importStrat() {
    try {
      const text = await navigator.clipboard.readText();
      const data = JSON.parse(text);
      if (!data.steps || !data.map) throw new Error();
      setMap(MAPS.find((m) => m.id === data.map) || MAPS[0]);
      if (data.side) setSide(data.side);
      setSteps(data.steps.length ? data.steps : [emptyStep()]);
      setStepIdx(0); if (data.name) setStratName(data.name);
      if (data.tags) setStratTags(data.tags.join(", "));
      cancelPlacement(); resetView(); undoStack.current.clear();
      toast("strat imported from clipboard", "success");
    } catch { toast("invalid strat data in clipboard", "error"); }
  }

  const onMapAgents = useMemo(() => new Set(steps[stepIdx]?.items.filter((i) => i.kind === "agent").map((i) => i.label) || []), [steps, stepIdx]);
  const filtered = useMemo(() => {
    let list = roleFilter ? agents.filter((a) => a.role === roleFilter) : agents;
    if (onMapFilter) list = list.filter((a) => onMapAgents.has(a.name));
    return list;
  }, [agents, roleFilter, onMapFilter, onMapAgents]);

  const customCursor = useMemo(() => {
    if (tool === "move") return "default";
    if (tool === "pen") {
      const sz = Math.max(Math.round(penSize * 2.5), 8), half = Math.round(sz / 2);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${sz}"><circle cx="${half}" cy="${half}" r="${half - 1}" fill="${color}" fill-opacity="0.4"/><circle cx="${half}" cy="${half}" r="1.5" fill="${color}"/></svg>`;
      return `url('data:image/svg+xml;base64,${btoa(svg)}') ${half} ${half}, crosshair`;
    }
    if (tool === "eraser") {
      const sz = Math.max(Math.round(penSize * 5), 16), half = Math.round(sz / 2);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${sz}"><rect x="1" y="1" width="${sz - 2}" height="${sz - 2}" rx="3" fill="white" fill-opacity="0.3" stroke="#aaa" stroke-width="1.5"/></svg>`;
      return `url('data:image/svg+xml;base64,${btoa(svg)}') ${half} ${half}, crosshair`;
    }
    if (tool === "place") return "none";
    if (tool === "text") return "text";
    return "crosshair";
  }, [tool, penSize, color]);

  return (
    <div className="fixed inset-0 top-16 z-40 flex flex-col bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-1.5 sm:px-4">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="cursor-pointer text-muted-foreground hover:text-foreground">{sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}</button>
        {/* Map dropdown — matches RegionSelect pattern */}
        <div className="relative" ref={(el) => { if (!el) return; const handler = (e: MouseEvent) => { if (!el.contains(e.target as Node)) setMapDropdown(false); }; document.addEventListener("mousedown", handler); return () => document.removeEventListener("mousedown", handler); }}>
          <button onClick={() => setMapDropdown(!mapDropdown)} className="flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-muted px-3 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted/70">
            <MapIcon className="h-3.5 w-3.5 text-muted-foreground" />{map.name}<ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${mapDropdown ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {mapDropdown && (
              <motion.div initial={{ opacity: 0, y: 4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.97 }} transition={{ duration: 0.15 }} className="absolute left-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-border bg-card py-1 shadow-lg">
                {MAPS.map((m) => (
                  <button key={m.id} onClick={() => { setMap(m); setMapDropdown(false); resetView(); }} className={`flex w-full cursor-pointer px-3 py-1.5 text-sm transition-colors duration-100 ${m.id === map.id ? "font-medium text-accent" : "text-foreground hover:bg-muted"}`}>
                    {m.name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex rounded-xl bg-muted p-0.5">
          <button onClick={() => handleSideChange("defense")} className={`flex cursor-pointer items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors duration-200 ${side === "defense" ? "bg-teal text-white" : "text-muted-foreground"}`}><Shield className="h-3 w-3" /><span className="hidden sm:inline">def</span></button>
          <button onClick={() => handleSideChange("attack")} className={`flex cursor-pointer items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors duration-200 ${side === "attack" ? "bg-accent text-white" : "text-muted-foreground"}`}><Swords className="h-3 w-3" /><span className="hidden sm:inline">atk</span></button>
        </div>
        <div className="h-5 w-px bg-border" />
        <div className="flex items-center gap-0.5">
          <Btn active={tool === "move"} onClick={() => { setTool("move"); cancelPlacement(); }} title="move / select (V)"><MousePointer2 className="h-4 w-4" /></Btn>
          <Btn active={tool === "pen"} onClick={() => { setTool("pen"); cancelPlacement(); }} title="pen"><Pen className="h-4 w-4" /></Btn>
          <Btn active={tool === "eraser"} onClick={() => { setTool("eraser"); cancelPlacement(); }} title="eraser"><Eraser className="h-4 w-4" /></Btn>
          <Btn active={tool === "arrow"} onClick={() => { setTool("arrow"); cancelPlacement(); }} title="arrow"><ArrowUpRight className="h-4 w-4" /></Btn>
          <Btn active={tool === "text"} onClick={() => { setTool("text"); cancelPlacement(); }} title="text"><Type className="h-4 w-4" /></Btn>
          <Btn active={tool === "image"} onClick={() => { setTool("image"); cancelPlacement(); fileRef.current?.click(); }} title="image"><ImagePlus className="h-4 w-4" /></Btn>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]); e.target.value = ""; }} />
        <div className="flex rounded-xl bg-muted p-0.5">
          <button onClick={() => setTeam("ally")} className={`flex cursor-pointer items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors duration-200 ${team === "ally" ? "bg-teal text-white" : "text-muted-foreground"}`}><Users className="h-3 w-3" /><span className="hidden sm:inline">ally</span></button>
          <button onClick={() => setTeam("enemy")} className={`flex cursor-pointer items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors duration-200 ${team === "enemy" ? "bg-accent text-white" : "text-muted-foreground"}`}><UserX className="h-3 w-3" /><span className="hidden sm:inline">enemy</span></button>
        </div>
        <div className="flex items-center gap-1">{COLORS.map((c) => <button key={c} onClick={() => setColor(c)} className={`h-5 w-5 cursor-pointer rounded-full border-2 transition-transform duration-150 ${color === c ? "scale-110 border-foreground" : "border-transparent"}`} style={{ backgroundColor: c }} />)}</div>
        {(tool === "pen" || tool === "eraser" || tool === "arrow") && <input type="range" min={1} max={12} value={penSize} onChange={(e) => setPenSize(+e.target.value)} className="hidden w-20 sm:block" />}
        <div className="hidden items-center gap-1 sm:flex" title="aoe opacity"><span className="text-[10px] text-muted-foreground">aoe</span><input type="range" min={0.2} max={3} step={0.1} value={aoeOpacity} onChange={(e) => { setAoeOpacity(+e.target.value); }} className="w-14" /></div>
        <div className="h-5 w-px bg-border" />
        <div className="flex items-center gap-0.5"><Btn onClick={undo} title="undo (ctrl+z)"><Undo2 className="h-4 w-4" /></Btn><Btn onClick={clearStep} title="clear"><Trash2 className="h-4 w-4" /></Btn><Btn onClick={exportImage} title="export png"><Download className="h-4 w-4" /></Btn></div>
        <div className="h-5 w-px bg-border" />
        <div className="flex items-center gap-0.5"><Btn onClick={() => setZoom((z) => Math.min(4, z * 1.25))} title="zoom in"><ZoomIn className="h-4 w-4" /></Btn><Btn onClick={() => setZoom((z) => Math.max(0.5, z * 0.8))} title="zoom out"><ZoomOut className="h-4 w-4" /></Btn><Btn onClick={resetView} title="reset"><Maximize2 className="h-4 w-4" /></Btn><span className="ml-1 text-[11px] text-muted-foreground">{Math.round(zoom * 100)}%</span></div>
        <div className="flex-1" />
        <input value={stratName} onChange={(e) => setStratName(e.target.value)} placeholder="strat name" className="hidden h-8 w-28 rounded-xl bg-muted px-2 text-xs text-foreground outline-none placeholder:text-muted-foreground sm:block" />
        <Button size="sm" onClick={saveStrat} className="h-8 gap-1 text-xs"><Save className="h-3.5 w-3.5" />save</Button>
        <Button size="sm" variant="secondary" onClick={shareStrat} className="h-8 gap-1 text-xs" title="share as URL"><Share2 className="h-3.5 w-3.5" /><span className="hidden sm:inline">share</span></Button>
        <Button size="sm" variant="secondary" onClick={() => setShowStrats(!showStrats)} className="h-8 text-xs"><FolderOpen className="h-3.5 w-3.5" /></Button>
        <Button size="sm" variant="ghost" onClick={newStrat} className="h-8 text-xs"><Plus className="h-3.5 w-3.5" /></Button>
      </div>

      <div className="relative flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 260, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="flex flex-col overflow-hidden border-r border-border bg-background">
              <div className="flex-1 overflow-y-auto px-4 py-3">
                {placementItem && (<div className="mb-3 flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-2"><Crosshair className="h-3.5 w-3.5 shrink-0 text-accent" /><span className="flex-1 text-xs text-accent">{placementItem.kind === "spike" ? "placing spike" : team === "enemy" ? "placing enemy" : "placing ally"}</span><button onClick={cancelPlacement} className="cursor-pointer text-accent"><X className="h-3.5 w-3.5" /></button></div>)}
                <p className="mb-2 text-xs font-medium text-muted-foreground">spike</p>
                <button onClick={() => selectPlacement(SPIKE_IMG, "spike", SZ_SPIKE, "spike")} className={`mb-5 flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl bg-[#1a1816] transition-colors ${placementItem?.label === "spike" ? "ring-1 ring-accent" : "hover:bg-muted"}`}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={SPIKE_IMG} alt="spike" className="h-8 w-8" /></button>
                <div className="mb-2 flex items-center justify-between"><p className="text-xs font-medium text-muted-foreground">agents</p><button onClick={() => setOnMapFilter(!onMapFilter)} title="on-map only" className={`flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] transition-colors ${onMapFilter ? "bg-accent/15 text-accent" : "text-muted-foreground hover:bg-muted"}`}><Filter className="h-3 w-3" />on map</button></div>
                <div className="mb-2 flex items-center gap-1">
                  <button onClick={() => setRoleFilter(null)} className={`cursor-pointer rounded-lg px-2 py-1 text-[10px] font-medium transition-colors ${!roleFilter ? "bg-accent/15 text-accent" : "text-muted-foreground hover:bg-muted"}`}>all</button>
                  {ROLES.map((r) => (<button key={r} onClick={() => setRoleFilter(roleFilter === r ? null : r)} title={r.toLowerCase()} className={`cursor-pointer rounded-lg p-1.5 transition-colors ${roleFilter === r ? "bg-accent/15 ring-1 ring-accent" : "bg-[#1a1816] hover:bg-muted"}`}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={ROLE_ICONS[r]} alt={r} className="h-4 w-4 brightness-0 invert opacity-70" /></button>))}
                </div>
                <div className="mb-5 grid grid-cols-5 gap-1.5">{filtered.map((a) => (<button key={a.uuid} title={a.name} onClick={() => { setSelectedAgent(selectedAgent?.uuid === a.uuid ? null : a); selectPlacement(a.icon, a.name, SZ_AGENT, "agent"); }} className={`cursor-pointer rounded-xl p-0.5 transition-colors ${selectedAgent?.uuid === a.uuid ? "bg-accent/15 ring-1 ring-accent" : "hover:bg-muted"}`}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={a.icon} alt={a.name} className="h-10 w-10 rounded-xl bg-[#1a1816]" /></button>))}{onMapFilter && filtered.length === 0 && <p className="col-span-5 py-4 text-center text-[11px] text-muted-foreground">no agents on map</p>}</div>
                {selectedAgent && (<><p className="mb-2 text-xs font-medium text-muted-foreground">{selectedAgent.name.toLowerCase()}</p><div className="space-y-1">{selectedAgent.abilities.map((ab) => { const aoe = ABILITY_AOE[ab.name]; return (<button key={ab.slot} onClick={() => selectPlacement(ab.icon, ab.name, SZ_ABILITY, "ability", aoe)} className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2 py-2 transition-colors ${placementItem?.label === ab.name ? "bg-accent/15 ring-1 ring-accent" : "hover:bg-muted"}`}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={ab.icon} alt={ab.name} className="h-7 w-7 rounded-md bg-[#1a1816] p-0.5" /><span className="truncate text-xs text-muted-foreground">{ab.name.toLowerCase()}</span></button>); })}</div></>)}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Canvas */}
        <div ref={containerRef} className="relative flex-1 overflow-hidden bg-[#0c0e13]" onContextMenu={onContextMenu}>
          <canvas ref={bgRef} className="absolute inset-0" />
          <canvas ref={canvasRef} className="absolute inset-0" style={{ cursor: customCursor }} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onLeave} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} />
          {hoverLabel && <div className="pointer-events-none absolute top-3 left-3 rounded-lg bg-card/90 px-2.5 py-1 text-xs font-medium text-foreground shadow">{hoverLabel}</div>}
          {tool === "place" && placementItem && ghostPos && (
            <div className="pointer-events-none absolute" style={{ left: ghostPos.x, top: ghostPos.y, transform: "translate(-50%, -50%)" }}>
              {placementItem.kind === "spike" ? (/* eslint-disable-next-line @next/next/no-img-element */<img src={placementItem.imgUrl} alt="" className="opacity-70" style={{ width: placementItem.size, height: placementItem.size }} />
              ) : placementItem.kind === "image" ? (/* eslint-disable-next-line @next/next/no-img-element */<img src={placementItem.imgUrl} alt="" className="opacity-70" style={{ width: placementItem.imgW || placementItem.size, height: placementItem.imgH || placementItem.size }} />
              ) : (<div className="flex items-center justify-center" style={{ width: placementItem.size + 10, height: placementItem.size + 10, borderRadius: placementItem.kind === "ability" ? "8px" : "50%", background: team === "enemy" ? "rgba(255,70,85,0.2)" : "rgba(45,212,191,0.2)" }}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={placementItem.imgUrl} alt="" className="opacity-80" style={{ width: placementItem.size, height: placementItem.size, borderRadius: placementItem.kind === "ability" ? "6px" : "50%", boxShadow: `0 0 0 2px ${team === "enemy" ? ENEMY_CLR : ALLY_CLR}` }} /></div>)}
            </div>
          )}
          {textModal && (
            <div className="absolute z-50 flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-xl" style={{ left: textModal.cx, top: textModal.cy, transform: "translate(-50%, -100%) translateY(-8px)", minWidth: 220 }}>
              <input ref={textInputRef} value={textInput} onChange={(e) => setTextInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submitText(); if (e.key === "Escape") setTextModal(null); }} placeholder="type here..." className="h-9 rounded-xl bg-muted px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground" />
              <div className="flex items-center gap-2"><button onClick={() => setTextBold(!textBold)} className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-xl text-xs font-bold transition-colors duration-200 ${textBold ? "bg-accent text-white" : "bg-muted text-muted-foreground"}`}>B</button><select value={textSize} onChange={(e) => setTextSize(+e.target.value)} className="h-7 rounded-xl bg-muted px-1.5 text-xs text-foreground outline-none"><option value={10}>10</option><option value={12}>12</option><option value={14}>14</option><option value={18}>18</option><option value={24}>24</option></select><div className="flex-1" /><button onClick={() => setTextModal(null)} className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">cancel</button><button onClick={submitText} className="cursor-pointer rounded-lg bg-accent px-3 py-1 text-xs font-medium text-white">add</button></div>
            </div>
          )}
          {showShortcuts && (
            <div className="absolute right-4 bottom-4 z-50 rounded-xl border border-border bg-card/95 p-4 shadow-xl backdrop-blur-sm">
              <p className="mb-2 text-xs font-medium text-foreground">shortcuts</p>
              <div className="space-y-1 text-[11px] text-muted-foreground">
                <p><kbd className="rounded-md bg-muted px-1">V</kbd> — move tool</p>
                <p><kbd className="rounded-md bg-muted px-1">Space</kbd> + drag — pan</p>
                <p><kbd className="rounded-md bg-muted px-1">Scroll</kbd> — zoom</p>
                <p><kbd className="rounded-md bg-muted px-1">Ctrl+Z</kbd> — undo</p>
                <p><kbd className="rounded-md bg-muted px-1">Ctrl+C</kbd> — copy item</p>
                <p><kbd className="rounded-md bg-muted px-1">Ctrl+V</kbd> — paste item</p>
                <p><kbd className="rounded-md bg-muted px-1">Right-click</kbd> — delete item</p>
                <p><kbd className="rounded-md bg-muted px-1">Esc</kbd> — cancel</p>
                <p><kbd className="rounded-md bg-muted px-1">Del</kbd> — delete step</p>
                <p><kbd className="rounded-md bg-muted px-1">?</kbd> — toggle this</p>
              </div>
            </div>
          )}
        </div>

        {/* Strats panel */}
        <AnimatePresence>
          {showStrats && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="flex flex-col overflow-hidden border-l border-border bg-background">
              <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                <p className="text-xs font-medium text-muted-foreground">saved strats</p>
                <div className="flex items-center gap-1">
                  <button onClick={importStrat} title="import from clipboard" className="cursor-pointer rounded-md px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground">import</button>
                  <button onClick={() => setShowStrats(false)} className="cursor-pointer text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="border-b border-border px-3 py-2">
                <input value={stratTags} onChange={(e) => setStratTags(e.target.value)} placeholder="tags (comma separated)" className="h-7 w-full rounded-xl bg-muted px-2 text-[11px] text-foreground outline-none placeholder:text-muted-foreground" />
              </div>
              <div className="flex-1 overflow-y-auto p-2.5">{savedStrats.length === 0 ? <p className="py-10 text-center text-xs text-muted-foreground">no saved strats yet.</p> : (<div className="space-y-2">{savedStrats.map((s) => (<div key={s.id} className="flex items-center gap-2 rounded-xl bg-card p-3 ring-1 ring-border"><div onClick={() => loadStrat(s)} className="min-w-0 flex-1 cursor-pointer"><p className="truncate text-xs font-medium">{s.name}</p><p className="text-[11px] text-muted-foreground">{MAPS.find((m) => m.id === s.map)?.name} · {s.side} · {s.steps.length} step(s)</p>{s.tags && s.tags.length > 0 && <div className="mt-1 flex flex-wrap gap-1">{s.tags.map((t, ti) => <span key={ti} className="rounded bg-accent/10 px-1.5 py-0.5 text-[9px] text-accent">{t}</span>)}</div>}</div><button onClick={() => deleteStrat(s.id)} className="cursor-pointer text-muted-foreground hover:text-loss"><Trash2 className="h-3.5 w-3.5" /></button></div>))}</div>)}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 border-t border-border px-3 py-2">
        <button onClick={() => goStep(Math.max(0, stepIdx - 1))} disabled={stepIdx === 0} className="cursor-pointer text-muted-foreground disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
        {steps.map((s, i) => (<button key={i} onClick={() => goStep(i)} title={s.label || `step ${i + 1}`} className={`flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-xl px-2 text-xs font-medium transition-colors duration-200 ${i === stepIdx ? "bg-accent text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{s.label || i + 1}</button>))}
        <button onClick={addStep} title="add step" className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors duration-200 hover:text-foreground"><Plus className="h-4 w-4" /></button>
        <button onClick={duplicateStep} title="duplicate step" className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors duration-200 hover:text-foreground"><Copy className="h-3.5 w-3.5" /></button>
        <button onClick={() => goStep(Math.min(steps.length - 1, stepIdx + 1))} disabled={stepIdx === steps.length - 1} className="cursor-pointer text-muted-foreground disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
        <div className="h-5 w-px bg-border" />
        <input value={steps[stepIdx]?.label || ""} onChange={(e) => setSteps((s) => s.map((st, i) => i === stepIdx ? { ...st, label: e.target.value } : st))} placeholder={`step ${stepIdx + 1} label`} className="h-7 w-24 rounded-xl bg-muted px-2 text-[11px] text-foreground outline-none placeholder:text-muted-foreground" />
        <div className="flex-1" />
        <button onClick={() => setShowShortcuts((s) => !s)} title="keyboard shortcuts" className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">?</button>
        <button onClick={deleteStep} className="cursor-pointer text-muted-foreground hover:text-loss"><Trash2 className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
