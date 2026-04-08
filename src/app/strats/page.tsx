"use client";

import { useState, useRef, useEffect } from "react";
import {
  Pen, Eraser, Undo2, Trash2, Download, Save, Plus, Type, ImagePlus,
  ChevronLeft, ChevronRight, Swords, Shield, X, Users, UserX,
  FolderOpen, Map as MapIcon, Crosshair, PanelLeftClose, PanelLeftOpen,
  ZoomIn, ZoomOut, Maximize2, Filter,
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
// Tools: only drawing-related. Move/rotate/pan are all gesture-based.
type Tool = "pen" | "eraser" | "place" | "text" | "image";
type Side = "attack" | "defense";
type Team = "ally" | "enemy";
// What the left mouse button is currently doing
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
const SZ_AGENT = 30; const SZ_ABILITY = 22; const SZ_SPIKE = 28;
const HANDLE_R = 4; // handle hit radius
const ROT_HANDLE_DIST = 20; // px from item center

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
  const [tool, setTool] = useState<Tool>("pen");
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
  const textInputRef = useRef<HTMLInputElement>(null);

  // Refs for RAF
  const stepsRef = useRef(steps); const stepIdxRef = useRef(stepIdx);
  const sideRef = useRef(side); const zoomRef = useRef(zoom); const panRef = useRef(panOff);
  const toolRef = useRef(tool); const colorRef = useRef(color); const penSizeRef = useRef(penSize);
  stepsRef.current = steps; stepIdxRef.current = stepIdx; sideRef.current = side;
  zoomRef.current = zoom; panRef.current = panOff; toolRef.current = tool;
  colorRef.current = color; penSizeRef.current = penSize;

  // Interaction state
  const interaction = useRef<Interaction>("none");
  const targetId = useRef<string | null>(null);
  const panStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const resizeStart = useRef({ dist: 0, w: 0, h: 0 });
  const curPath = useRef<{ x: number; y: number }[]>([]);
  const pathCommitted = useRef(false);
  const curToolSnap = useRef<"pen" | "eraser">("pen");
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
  useEffect(() => { const img = new Image(); img.crossOrigin = "anonymous"; img.src = map.img; img.onload = () => { mapImg.current = img; computeBounds(); scheduleRedraw(); }; }, [map]);
  useEffect(() => { function resize() { const c = canvasRef.current, b = bgRef.current, p = containerRef.current; if (!c || !b || !p) return; dpr.current = window.devicePixelRatio || 1; const w = p.clientWidth, h = p.clientHeight, d = dpr.current; cssSize.current = { w, h }; c.width = w * d; c.height = h * d; b.width = w * d; b.height = h * d; c.style.width = w + "px"; c.style.height = h + "px"; b.style.width = w + "px"; b.style.height = h + "px"; computeBounds(); scheduleRedraw(); } resize(); window.addEventListener("resize", resize); return () => window.removeEventListener("resize", resize); }, []);
  useEffect(() => { const el = containerRef.current; if (!el) return; function onWheel(e: WheelEvent) { e.preventDefault(); e.stopPropagation(); setZoom((z) => Math.max(0.5, Math.min(4, z * (e.deltaY > 0 ? 0.92 : 1.08)))); } el.addEventListener("wheel", onWheel, { passive: false }); return () => el.removeEventListener("wheel", onWheel); }, []);
  useEffect(() => { if (pathCommitted.current) { curPath.current = []; pathCommitted.current = false; } scheduleRedraw(); }, [steps, stepIdx, side, map, zoom, panOff]);
  useEffect(() => { if (textModal) setTimeout(() => textInputRef.current?.focus(), 50); }, [textModal]);

  // Deselect agent if filtered out
  useEffect(() => {
    if (!selectedAgent) return;
    const visible = roleFilter ? agents.filter((a) => a.role === roleFilter) : agents;
    const onMap = new Set(steps[stepIdx]?.items.filter((i) => i.kind === "agent").map((i) => i.label) || []);
    const pool = onMapFilter ? visible.filter((a) => onMap.has(a.name)) : visible;
    if (!pool.find((a) => a.uuid === selectedAgent.uuid)) { setSelectedAgent(null); cancelPlacement(); }
  }, [roleFilter, onMapFilter, agents, selectedAgent, steps, stepIdx]);

  // Space key for pan
  useEffect(() => {
    function down(e: KeyboardEvent) {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (e.code === "Space" && !spaceDown.current) { spaceDown.current = true; e.preventDefault(); }
      if (e.key === "Escape") { cancelPlacement(); setTextModal(null); }
      if (e.ctrlKey && e.key === "z") { e.preventDefault(); undo(); }
    }
    function up(e: KeyboardEvent) { if (e.code === "Space") spaceDown.current = false; }
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx, steps]);

  function scheduleRedraw() { cancelAnimationFrame(rafId.current); rafId.current = requestAnimationFrame(doRedraw); }

  function doRedraw() {
    const c = canvasRef.current, b = bgRef.current; if (!c || !b) return;
    const ctx = c.getContext("2d")!, bctx = b.getContext("2d")!;
    const w = c.width, h = c.height, d = dpr.current, cw = w / d, ch = h / d;
    const z = zoomRef.current, pn = panRef.current;
    const isAtk = sideRef.current === "attack";
    const cur = stepsRef.current[stepIdxRef.current];
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    bctx.imageSmoothingEnabled = true; bctx.imageSmoothingQuality = "high";
    function view(c2: CanvasRenderingContext2D) { c2.translate(cw / 2 + pn.x, ch / 2 + pn.y); c2.scale(z, z); c2.translate(-cw / 2, -ch / 2); }

    bctx.clearRect(0, 0, w, h); bctx.save(); bctx.scale(d, d); view(bctx);
    if (isAtk) { bctx.translate(cw, ch); bctx.rotate(Math.PI); }
    if (mapImg.current) { const img = mapImg.current; const sc = Math.min(cw / img.width, ch / img.height) * 0.98; const iw = img.width * sc, ih = img.height * sc; bctx.drawImage(img, (cw - iw) / 2, (ch - ih) / 2, iw, ih); }
    bctx.restore();

    ctx.clearRect(0, 0, w, h); if (!cur) return;
    ctx.save(); ctx.scale(d, d); view(ctx);

    // Pen
    for (const p of cur.paths) { if (p.tool !== "pen" || p.points.length < 2) continue; ctx.beginPath(); ctx.moveTo(p.points[0].x * cw, p.points[0].y * ch); for (let i = 1; i < p.points.length; i++) ctx.lineTo(p.points[i].x * cw, p.points[i].y * ch); ctx.strokeStyle = p.color; ctx.lineWidth = p.size; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke(); }
    // Eraser
    for (const p of cur.paths) { if (p.tool !== "eraser" || p.points.length < 2) continue; ctx.globalCompositeOperation = "destination-out"; ctx.beginPath(); ctx.moveTo(p.points[0].x * cw, p.points[0].y * ch); for (let i = 1; i < p.points.length; i++) ctx.lineTo(p.points[i].x * cw, p.points[i].y * ch); ctx.lineWidth = p.size * 4; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke(); }
    ctx.globalCompositeOperation = "source-over";
    // In-progress
    const cp = curPath.current;
    if (cp.length >= 2) { ctx.beginPath(); ctx.moveTo(cp[0].x * cw, cp[0].y * ch); for (let i = 1; i < cp.length; i++) ctx.lineTo(cp[i].x * cw, cp[i].y * ch); if (curToolSnap.current === "eraser") { ctx.globalCompositeOperation = "destination-out"; ctx.lineWidth = penSizeRef.current * 4; } else { ctx.strokeStyle = colorRef.current; ctx.lineWidth = penSizeRef.current; } ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke(); ctx.globalCompositeOperation = "source-over"; }

    // AOE overlays
    for (const item of cur.items) {
      if (!item.aoe) continue;
      const ix = item.x * cw, iy = item.y * ch, aoe = item.aoe;
      ctx.save(); ctx.translate(ix, iy); ctx.rotate(item.rotation); ctx.fillStyle = aoe.color;
      if (aoe.type === "circle") { ctx.beginPath(); ctx.arc(0, 0, aoe.radius * cw, 0, Math.PI * 2); ctx.fill(); }
      else if (aoe.type === "cone") { const r = aoe.radius * cw, a = aoe.angle || Math.PI / 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, -Math.PI / 2 - a / 2, -Math.PI / 2 + a / 2); ctx.closePath(); ctx.fill(); }
      else if (aoe.type === "line") { const len = (aoe.length || 0.5) * cw, wid = aoe.radius * cw; ctx.fillRect(-wid, -len, wid * 2, len); }
      ctx.restore();
    }

    // Items
    for (const item of cur.items) {
      const ix = item.x * cw, iy = item.y * ch, sz = item.size;
      const ring = item.team === "enemy" ? ENEMY_CLR : ALLY_CLR;
      const bg = item.team === "enemy" ? "rgba(255,70,85,0.2)" : "rgba(45,212,191,0.2)";
      const cached = imgCache.get(item.imgUrl);
      const directional = hasDirectionalAoe(item);

      if (item.kind === "spike") { if (cached) ctx.drawImage(cached, ix - sz / 2, iy - sz / 2, sz, sz); else loadImg(item.imgUrl, scheduleRedraw); continue; }
      if (item.kind === "image") {
        const iw = item.imgW || sz, ih = item.imgH || sz;
        if (cached) { ctx.drawImage(cached, ix - iw / 2, iy - ih / 2, iw, ih); /* resize handle */ ctx.beginPath(); ctx.arc(ix + iw / 2, iy + ih / 2, 4, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill(); ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = 1; ctx.stroke(); }
        else loadImg(item.imgUrl, scheduleRedraw);
        continue;
      }

      // Direction arrow + rotation handle (only for directional AOE)
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
        ctx.strokeStyle = ring; ctx.lineWidth = 1.5; ctx.stroke();
      } else {
        ctx.save(); ctx.beginPath(); ctx.arc(ix, iy, sz / 2 + 4, 0, Math.PI * 2);
        ctx.fillStyle = bg; ctx.fill(); ctx.restore();
        if (cached) { ctx.save(); ctx.beginPath(); ctx.arc(ix, iy, sz / 2, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(cached, ix - sz / 2, iy - sz / 2, sz, sz); ctx.restore(); ctx.beginPath(); ctx.arc(ix, iy, sz / 2, 0, Math.PI * 2); ctx.strokeStyle = ring; ctx.lineWidth = 2; ctx.stroke(); }
        else loadImg(item.imgUrl, scheduleRedraw);
      }
    }

    // Text
    for (const t of cur.texts) { const fw = t.bold ? "bold " : ""; ctx.font = `${fw}${t.fontSize}px Inter, system-ui, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; const m = ctx.measureText(t.text); ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.beginPath(); ctx.roundRect(t.x * cw - m.width / 2 - 5, t.y * ch - t.fontSize / 2 - 3, m.width + 10, t.fontSize + 6, 4); ctx.fill(); ctx.fillStyle = t.color; ctx.fillText(t.text, t.x * cw, t.y * ch); }
    ctx.restore();
  }

  // ── Coords ──
  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const c = canvasRef.current; if (!c) return { x: 0, y: 0 };
    const rect = c.getBoundingClientRect();
    const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
    const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
    const sx = cx - rect.left, sy = cy - rect.top, cw = rect.width, ch = rect.height;
    const z = zoomRef.current, pn = panRef.current;
    return { x: ((sx - cw / 2 - pn.x) / z + cw / 2) / cw, y: ((sy - ch / 2 - pn.y) / z + ch / 2) / ch };
  }
  function clamp(pos: { x: number; y: number }) { const b = mapBounds.current, m = 0.015, dx = (b.x2 - b.x1) * m, dy = (b.y2 - b.y1) * m; return { x: Math.max(b.x1 + dx, Math.min(b.x2 - dx, pos.x)), y: Math.max(b.y1 + dy, Math.min(b.y2 - dy, pos.y)) }; }
  function isInMap(pos: { x: number; y: number }) { const b = mapBounds.current; return pos.x >= b.x1 && pos.x <= b.x2 && pos.y >= b.y1 && pos.y <= b.y2; }
  function getCSSPos(e: React.MouseEvent | React.TouchEvent) { const p = containerRef.current; if (!p) return null; const rect = p.getBoundingClientRect(); const cx = "touches" in e ? e.touches[0].clientX : e.clientX; const cy = "touches" in e ? e.touches[0].clientY : e.clientY; return { x: cx - rect.left, y: cy - rect.top }; }

  // ── Hit testing ──
  function findItemAt(pos: { x: number; y: number }): PlacedItem | null {
    const cur = stepsRef.current[stepIdxRef.current]; if (!cur) return null;
    const cw = cssSize.current.w, ch = cssSize.current.h, z = zoomRef.current;
    for (let i = cur.items.length - 1; i >= 0; i--) { const it = cur.items[i]; const dx = (pos.x - it.x) * cw * z, dy = (pos.y - it.y) * ch * z; if (Math.sqrt(dx * dx + dy * dy) < it.size / 2 + 10) return it; }
    return null;
  }
  function findTextAt(pos: { x: number; y: number }): TextItem | null {
    const cur = stepsRef.current[stepIdxRef.current]; if (!cur) return null;
    const cw = cssSize.current.w, ch = cssSize.current.h, z = zoomRef.current;
    for (let i = cur.texts.length - 1; i >= 0; i--) { const t = cur.texts[i]; if (Math.abs((pos.x - t.x) * cw * z) < 40 && Math.abs((pos.y - t.y) * ch * z) < 12) return t; }
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
      if (Math.sqrt(dx * dx + dy * dy) < HANDLE_R + 6) return it;
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
      if (Math.sqrt(dx * dx + dy * dy) < 8) return it;
    }
    return null;
  }

  // ── Events ──
  function onDown(e: React.MouseEvent | React.TouchEvent) {
    const pos = getPos(e);
    // Space or middle click = pan
    if (spaceDown.current || ("button" in e && e.button === 1)) {
      interaction.current = "panning";
      const cx = "touches" in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
      const cy = "touches" in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
      panStart.current = { x: cx, y: cy, ox: panRef.current.x, oy: panRef.current.y };
      return;
    }
    // Text tool
    if (tool === "text") { if (!isInMap(pos)) return; const css = getCSSPos(e); if (css) { setTextInput(""); setTextModal({ x: pos.x, y: pos.y, cx: css.x, cy: css.y }); } return; }
    // Placement
    if (tool === "place" && placementItem) {
      if (!isInMap(pos)) return;
      const clamped = clamp(pos);
      updateStep((s) => ({ ...s, items: [...s.items, { id: uid(), ...clamped, rotation: 0, ...placementItem, team: placementItem.kind === "spike" ? "ally" as Team : team }] }));
      return;
    }
    // Pen/eraser: first check if clicking on an interactive element
    if (tool === "pen" || tool === "eraser") {
      // 1. Rotation handle?
      const rh = findRotHandle(pos);
      if (rh) { interaction.current = "rotating"; targetId.current = rh.id; return; }
      // 2. Resize handle?
      const rsh = findResizeHandle(pos);
      if (rsh) {
        interaction.current = "resizing"; targetId.current = rsh.id;
        const iw = rsh.imgW || rsh.size, ih = rsh.imgH || rsh.size;
        const dx = (pos.x - rsh.x) * cssSize.current.w, dy = (pos.y - rsh.y) * cssSize.current.h;
        resizeStart.current = { dist: Math.sqrt(dx * dx + dy * dy), w: iw, h: ih };
        return;
      }
      // 3. Item?
      const it = findItemAt(pos);
      if (it) { interaction.current = "dragging"; targetId.current = it.id; return; }
      // 4. Text?
      const txt = findTextAt(pos);
      if (txt) { interaction.current = "dragging-text"; targetId.current = txt.id; return; }
      // 5. Draw
      interaction.current = "drawing"; curToolSnap.current = tool; curPath.current = [pos]; return;
    }
  }

  function onMove(e: React.MouseEvent | React.TouchEvent) {
    const pos = getPos(e);
    // Hover label
    const hi = findItemAt(pos); const ht = findTextAt(pos);
    setHoverLabel(hi ? hi.label : ht ? ht.text : "");

    if (interaction.current === "panning") {
      const cx = "touches" in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
      const cy = "touches" in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
      setPanOff({ x: panStart.current.ox + cx - panStart.current.x, y: panStart.current.oy + cy - panStart.current.y });
      return;
    }
    if (tool === "place" && placementItem) { setGhostPos(getCSSPos(e)); return; }

    if (interaction.current === "rotating" && targetId.current) {
      e.preventDefault();
      updateStep((s) => ({ ...s, items: s.items.map((it) => it.id !== targetId.current ? it : { ...it, rotation: Math.atan2(pos.x - it.x, -(pos.y - it.y)) }) }));
      return;
    }
    if (interaction.current === "resizing" && targetId.current) {
      e.preventDefault();
      updateStep((s) => ({ ...s, items: s.items.map((it) => {
        if (it.id !== targetId.current) return it;
        const dx = (pos.x - it.x) * cssSize.current.w, dy = (pos.y - it.y) * cssSize.current.h;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const scale = Math.max(0.3, Math.min(5, dist / resizeStart.current.dist));
        return { ...it, imgW: resizeStart.current.w * scale, imgH: resizeStart.current.h * scale };
      }) }));
      return;
    }
    if (interaction.current === "dragging" && targetId.current) { e.preventDefault(); updateStep((s) => ({ ...s, items: s.items.map((it) => it.id === targetId.current ? { ...it, ...clamp(pos) } : it) })); return; }
    if (interaction.current === "dragging-text" && targetId.current) { e.preventDefault(); updateStep((s) => ({ ...s, texts: s.texts.map((t) => t.id === targetId.current ? { ...t, ...clamp(pos) } : t) })); return; }
    if (interaction.current === "drawing") { e.preventDefault(); curPath.current.push(pos); scheduleRedraw(); return; }
  }

  function onUp() {
    const prev = interaction.current;
    interaction.current = "none"; targetId.current = null;
    if (prev === "drawing") {
      if (curPath.current.length >= 2) {
        updateStep((s) => ({ ...s, paths: [...s.paths, { points: [...curPath.current], color: colorRef.current, size: penSizeRef.current, tool: curToolSnap.current }] }));
        pathCommitted.current = true;
      } else curPath.current = [];
    }
  }

  function onLeave() { setGhostPos(null); setHoverLabel(""); onUp(); }

  function resetView() { setZoom(1); setPanOff({ x: 0, y: 0 }); }
  function updateStep(fn: (s: StratStep) => StratStep) { setSteps((prev) => prev.map((s, i) => i === stepIdx ? fn(s) : s)); }
  function undo() { updateStep((s) => { if (s.texts.length) return { ...s, texts: s.texts.slice(0, -1) }; if (s.items.length) return { ...s, items: s.items.slice(0, -1) }; if (s.paths.length) return { ...s, paths: s.paths.slice(0, -1) }; return s; }); }
  function clearStep() { updateStep(() => emptyStep()); }
  function addStep() { if (steps.length >= 10) { toast("max 10 steps.", "error"); return; } setSteps((p) => [...p, emptyStep()]); setStepIdx(steps.length); }
  function goStep(i: number) { setStepIdx(i); }
  function deleteStep() { if (steps.length <= 1) { clearStep(); return; } setSteps((p) => p.filter((_, i) => i !== stepIdx)); setStepIdx((i) => Math.max(0, i - 1)); }
  function selectPlacement(imgUrl: string, label: string, size: number, kind: PlacedItem["kind"], aoe?: AoeShape, imgW?: number, imgH?: number) { setTool("place"); setPlacementItem({ imgUrl, label, size, kind, aoe, imgW, imgH }); loadImg(imgUrl); }
  function cancelPlacement() { setPlacementItem(null); if (tool === "place") setTool("pen"); setGhostPos(null); }
  function submitText() { if (!textModal || !textInput.trim()) { setTextModal(null); return; } updateStep((s) => ({ ...s, texts: [...s.texts, { id: uid(), x: textModal.x, y: textModal.y, text: textInput.trim(), color, bold: textBold, fontSize: textSize }] })); setTextInput(""); setTextModal(null); }
  function handleImageUpload(file: File) { const url = URL.createObjectURL(file); const img = new Image(); img.onload = () => { imgCache.set(url, img); const max = 80, r = img.width / img.height; const w = r >= 1 ? max : max * r, h = r >= 1 ? max / r : max; selectPlacement(url, file.name, Math.max(w, h), "image", undefined, w, h); }; img.src = url; }

  function saveStrat() { const name = stratName.trim() || `${map.name} ${side}`; const updated = [...savedStrats, { id: uid(), name, map: map.id, side, steps, createdAt: Date.now() }]; setSavedStrats(updated); localStorage.setItem("dv-strats", JSON.stringify(updated)); toast("strategy saved", "success"); }
  function loadStrat(s: Strategy) { setMap(MAPS.find((m) => m.id === s.map) || MAPS[0]); setSide(s.side); setSteps(s.steps.length ? s.steps : [emptyStep()]); setStepIdx(0); setStratName(s.name); setShowStrats(false); cancelPlacement(); resetView(); }
  function deleteStrat(id: string) { const u = savedStrats.filter((s) => s.id !== id); setSavedStrats(u); localStorage.setItem("dv-strats", JSON.stringify(u)); }
  function newStrat() { setSteps([emptyStep()]); setStepIdx(0); setStratName(""); cancelPlacement(); resetView(); }
  function exportImage() { const bg = bgRef.current, fg = canvasRef.current; if (!bg || !fg) return; const m = document.createElement("canvas"); m.width = bg.width; m.height = bg.height; const mctx = m.getContext("2d")!; mctx.drawImage(bg, 0, 0); mctx.drawImage(fg, 0, 0); const a = document.createElement("a"); a.download = `${stratName || "strat"}.png`; a.href = m.toDataURL(); a.click(); }

  const onMapAgents = new Set(steps[stepIdx]?.items.filter((i) => i.kind === "agent").map((i) => i.label) || []);
  let filtered = roleFilter ? agents.filter((a) => a.role === roleFilter) : agents;
  if (onMapFilter) filtered = filtered.filter((a) => onMapAgents.has(a.name));

  const Btn = ({ active, onClick, children, title }: { active?: boolean; onClick: () => void; children: React.ReactNode; title: string }) => (
    <button onClick={onClick} title={title} className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors duration-150 ${active ? "bg-accent text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>{children}</button>
  );

  const cursorClass = spaceDown.current ? "cursor-grab" : tool === "pen" ? "cursor-crosshair" : tool === "eraser" ? "cursor-cell" : tool === "place" ? "cursor-none" : tool === "text" ? "cursor-text" : "cursor-crosshair";

  return (
    <div className="fixed inset-0 top-16 z-40 flex flex-col bg-background">
      {/* Toolbar - cleaner, no move/rotate/pan */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-1.5 sm:px-4">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="cursor-pointer text-muted-foreground hover:text-foreground">{sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}</button>
        <div className="flex items-center gap-1.5"><MapIcon className="h-3.5 w-3.5 text-muted-foreground" /><select value={map.id} onChange={(e) => { setMap(MAPS.find((m) => m.id === e.target.value)!); resetView(); }} className="h-8 cursor-pointer rounded-lg bg-muted px-2 text-xs font-medium text-foreground outline-none">{MAPS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
        <div className="flex rounded-lg bg-muted p-0.5">
          <button onClick={() => setSide("defense")} className={`flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${side === "defense" ? "bg-teal text-white" : "text-muted-foreground"}`}><Shield className="h-3 w-3" /><span className="hidden sm:inline">def</span></button>
          <button onClick={() => setSide("attack")} className={`flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${side === "attack" ? "bg-accent text-white" : "text-muted-foreground"}`}><Swords className="h-3 w-3" /><span className="hidden sm:inline">atk</span></button>
        </div>
        <div className="h-5 w-px bg-border" />
        <div className="flex items-center gap-0.5">
          <Btn active={tool === "pen"} onClick={() => { setTool("pen"); cancelPlacement(); }} title="pen (drag items to move)"><Pen className="h-4 w-4" /></Btn>
          <Btn active={tool === "eraser"} onClick={() => { setTool("eraser"); cancelPlacement(); }} title="eraser"><Eraser className="h-4 w-4" /></Btn>
          <Btn active={tool === "text"} onClick={() => { setTool("text"); cancelPlacement(); }} title="text"><Type className="h-4 w-4" /></Btn>
          <Btn active={tool === "image"} onClick={() => { setTool("image"); cancelPlacement(); fileRef.current?.click(); }} title="image"><ImagePlus className="h-4 w-4" /></Btn>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]); e.target.value = ""; }} />
        <div className="flex rounded-lg bg-muted p-0.5">
          <button onClick={() => setTeam("ally")} className={`flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${team === "ally" ? "bg-teal text-white" : "text-muted-foreground"}`}><Users className="h-3 w-3" /><span className="hidden sm:inline">ally</span></button>
          <button onClick={() => setTeam("enemy")} className={`flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${team === "enemy" ? "bg-accent text-white" : "text-muted-foreground"}`}><UserX className="h-3 w-3" /><span className="hidden sm:inline">enemy</span></button>
        </div>
        <div className="flex items-center gap-1">{COLORS.map((c) => <button key={c} onClick={() => setColor(c)} className={`h-5 w-5 cursor-pointer rounded-full border-2 transition-transform duration-150 ${color === c ? "scale-110 border-foreground" : "border-transparent"}`} style={{ backgroundColor: c }} />)}</div>
        {(tool === "pen" || tool === "eraser") && <input type="range" min={1} max={12} value={penSize} onChange={(e) => setPenSize(+e.target.value)} className="hidden w-20 sm:block" />}
        <div className="h-5 w-px bg-border" />
        <div className="flex items-center gap-0.5"><Btn onClick={undo} title="undo (ctrl+z)"><Undo2 className="h-4 w-4" /></Btn><Btn onClick={clearStep} title="clear"><Trash2 className="h-4 w-4" /></Btn><Btn onClick={exportImage} title="export"><Download className="h-4 w-4" /></Btn></div>
        <div className="h-5 w-px bg-border" />
        <div className="flex items-center gap-0.5"><Btn onClick={() => setZoom((z) => Math.min(4, z * 1.25))} title="zoom in"><ZoomIn className="h-4 w-4" /></Btn><Btn onClick={() => setZoom((z) => Math.max(0.5, z * 0.8))} title="zoom out"><ZoomOut className="h-4 w-4" /></Btn><Btn onClick={resetView} title="reset"><Maximize2 className="h-4 w-4" /></Btn><span className="ml-1 text-[11px] text-muted-foreground">{Math.round(zoom * 100)}%</span></div>
        <div className="flex-1" />
        <input value={stratName} onChange={(e) => setStratName(e.target.value)} placeholder="strat name" className="hidden h-8 w-28 rounded-lg bg-muted px-2 text-xs text-foreground outline-none placeholder:text-muted-foreground sm:block" />
        <Button size="sm" onClick={saveStrat} className="h-8 gap-1 text-xs"><Save className="h-3.5 w-3.5" />save</Button>
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
                <div className="mb-2 flex items-center gap-1"><button onClick={() => setRoleFilter(null)} className={`cursor-pointer rounded-lg px-2 py-1 text-[10px] font-medium transition-colors ${!roleFilter ? "bg-accent/15 text-accent" : "text-muted-foreground hover:bg-muted"}`}>all</button>{ROLES.map((r) => (<button key={r} onClick={() => setRoleFilter(roleFilter === r ? null : r)} title={r.toLowerCase()} className={`cursor-pointer rounded-lg p-1 transition-colors ${roleFilter === r ? "bg-accent/15 ring-1 ring-accent" : "hover:bg-muted"}`}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={ROLE_ICONS[r]} alt={r} className="h-4 w-4 brightness-0 invert opacity-60" /></button>))}</div>
                <div className="mb-5 grid grid-cols-5 gap-1.5">{filtered.map((a) => (<button key={a.uuid} title={a.name} onClick={() => { setSelectedAgent(selectedAgent?.uuid === a.uuid ? null : a); selectPlacement(a.icon, a.name, SZ_AGENT, "agent"); }} className={`cursor-pointer rounded-xl p-0.5 transition-colors ${selectedAgent?.uuid === a.uuid ? "bg-accent/15 ring-1 ring-accent" : "hover:bg-muted"}`}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={a.icon} alt={a.name} className="h-10 w-10 rounded-full" /></button>))}{onMapFilter && filtered.length === 0 && <p className="col-span-5 py-4 text-center text-[11px] text-muted-foreground">no agents on map</p>}</div>
                {selectedAgent && (<><p className="mb-2 text-xs font-medium text-muted-foreground">{selectedAgent.name.toLowerCase()}</p><div className="space-y-1">{selectedAgent.abilities.map((ab) => { const aoe = ABILITY_AOE[ab.name]; return (<button key={ab.slot} onClick={() => selectPlacement(ab.icon, ab.name, SZ_ABILITY, "ability", aoe)} className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2 py-2 transition-colors ${placementItem?.label === ab.name ? "bg-accent/15 ring-1 ring-accent" : "hover:bg-muted"}`}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={ab.icon} alt={ab.name} className="h-7 w-7 rounded-md" /><div className="min-w-0 flex-1"><span className="block truncate text-xs text-muted-foreground">{ab.name.toLowerCase()}</span>{aoe && <span className="text-[9px] text-accent">{aoe.type}</span>}</div></button>); })}</div></>)}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Canvas */}
        <div ref={containerRef} className="relative flex-1 overflow-hidden bg-[#0c0e13]" onContextMenu={(e) => e.preventDefault()}>
          <canvas ref={bgRef} className="absolute inset-0" />
          <canvas ref={canvasRef} className={`absolute inset-0 ${cursorClass}`} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onLeave} onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp} />
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
              <input ref={textInputRef} value={textInput} onChange={(e) => setTextInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submitText(); if (e.key === "Escape") setTextModal(null); }} placeholder="type here..." className="h-9 rounded-lg bg-muted px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground" />
              <div className="flex items-center gap-2"><button onClick={() => setTextBold(!textBold)} className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-xs font-bold transition-colors ${textBold ? "bg-accent text-white" : "bg-muted text-muted-foreground"}`}>B</button><select value={textSize} onChange={(e) => setTextSize(+e.target.value)} className="h-7 rounded-md bg-muted px-1.5 text-xs text-foreground outline-none"><option value={10}>10</option><option value={12}>12</option><option value={14}>14</option><option value={18}>18</option><option value={24}>24</option></select><div className="flex-1" /><button onClick={() => setTextModal(null)} className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">cancel</button><button onClick={submitText} className="cursor-pointer rounded-lg bg-accent px-3 py-1 text-xs font-medium text-white">add</button></div>
            </div>
          )}
        </div>

        {/* Strats panel */}
        <AnimatePresence>
          {showStrats && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 260, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="flex flex-col overflow-hidden border-l border-border bg-background">
              <div className="flex items-center justify-between border-b border-border px-3 py-2.5"><p className="text-xs font-medium text-muted-foreground">saved strats</p><button onClick={() => setShowStrats(false)} className="cursor-pointer text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button></div>
              <div className="flex-1 overflow-y-auto p-2.5">{savedStrats.length === 0 ? <p className="py-10 text-center text-xs text-muted-foreground">no saved strats yet.</p> : (<div className="space-y-2">{savedStrats.map((s) => (<div key={s.id} className="flex items-center gap-2 rounded-xl bg-card p-3 ring-1 ring-border"><div onClick={() => loadStrat(s)} className="min-w-0 flex-1 cursor-pointer"><p className="truncate text-xs font-medium">{s.name}</p><p className="text-[11px] text-muted-foreground">{MAPS.find((m) => m.id === s.map)?.name} · {s.side} · {s.steps.length} step(s)</p></div><button onClick={() => deleteStrat(s.id)} className="cursor-pointer text-muted-foreground hover:text-loss"><Trash2 className="h-3.5 w-3.5" /></button></div>))}</div>)}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 border-t border-border px-3 py-2">
        <button onClick={() => goStep(Math.max(0, stepIdx - 1))} disabled={stepIdx === 0} className="cursor-pointer text-muted-foreground disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
        {steps.map((_, i) => (<button key={i} onClick={() => goStep(i)} className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-xs font-medium transition-colors ${i === stepIdx ? "bg-accent text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{i + 1}</button>))}
        <button onClick={addStep} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-foreground"><Plus className="h-4 w-4" /></button>
        <button onClick={() => goStep(Math.min(steps.length - 1, stepIdx + 1))} disabled={stepIdx === steps.length - 1} className="cursor-pointer text-muted-foreground disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
        <div className="h-5 w-px bg-border" /><button onClick={deleteStep} className="cursor-pointer text-muted-foreground hover:text-loss"><Trash2 className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
