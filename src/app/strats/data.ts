export interface MapData {
  id: string;
  name: string;
  atkImg: string;
  defImg: string;
}

export const MAPS: MapData[] = [
  { id: "abyss", name: "Abyss", atkImg: "/maps/abyss_atk.png", defImg: "/maps/abyss_def.png" },
  { id: "ascent", name: "Ascent", atkImg: "/maps/ascent_atk.png", defImg: "/maps/ascent_def.png" },
  { id: "bind", name: "Bind", atkImg: "/maps/bind_atk.png", defImg: "/maps/bind_def.png" },
  { id: "breeze", name: "Breeze", atkImg: "/maps/breeze_atk.png", defImg: "/maps/breeze_def.png" },
  { id: "fracture", name: "Fracture", atkImg: "/maps/fracture_atk.png", defImg: "/maps/fracture_def.png" },
  { id: "haven", name: "Haven", atkImg: "/maps/haven_atk.png", defImg: "/maps/haven_def.png" },
  { id: "icebox", name: "Icebox", atkImg: "/maps/icebox_atk.png", defImg: "/maps/icebox_def.png" },
  { id: "lotus", name: "Lotus", atkImg: "/maps/lotus_atk.png", defImg: "/maps/lotus_def.png" },
  { id: "pearl", name: "Pearl", atkImg: "/maps/pearl_atk.png", defImg: "/maps/pearl_def.png" },
  { id: "split", name: "Split", atkImg: "/maps/split_atk.png", defImg: "/maps/split_def.png" },
  { id: "sunset", name: "Sunset", atkImg: "/maps/sunset_atk.png", defImg: "/maps/sunset_def.png" },
];

export const ROLE_ICONS: Record<string, string> = {
  Controller: "https://media.valorant-api.com/agents/roles/4ee40330-ecdd-4f2f-98a8-eb1243428373/displayicon.png",
  Duelist: "https://media.valorant-api.com/agents/roles/dbe8757e-9e92-4ed4-b39f-9dfc589691d4/displayicon.png",
  Initiator: "https://media.valorant-api.com/agents/roles/1b47567f-8f7b-444b-aae3-b0c634622d10/displayicon.png",
  Sentinel: "https://media.valorant-api.com/agents/roles/5fc02f99-4091-4486-a531-98459a3e95e9/displayicon.png",
};

export const COLORS = ["#ff4655", "#2dd4bf", "#fbbf24", "#60a5fa", "#ffffff", "#a855f7"];

export interface AgentAbility { name: string; slot: string; icon: string; }
export interface AgentData { uuid: string; name: string; icon: string; role: string; abilities: AgentAbility[]; }

export interface DrawPath {
  points: { x: number; y: number }[];
  color: string;
  size: number;
  tool: "pen" | "eraser" | "arrow";
}

export interface PlacedItem {
  id: string; x: number; y: number; rotation: number;
  imgUrl: string; label: string; size: number;
  team: "ally" | "enemy"; kind: "agent" | "ability" | "spike" | "image";
  aoe?: AoeShape; imgW?: number; imgH?: number;
}

export interface AoeShape {
  type: "circle" | "cone" | "line";
  radius: number; angle?: number; length?: number; color: string;
}

export interface TextItem {
  id: string; x: number; y: number; text: string;
  color: string; bold: boolean; fontSize: number;
}

export interface StratStep { paths: DrawPath[]; items: PlacedItem[]; texts: TextItem[]; label?: string; }
export interface Strategy { id: string; name: string; map: string; side: "attack" | "defense"; steps: StratStep[]; createdAt: number; tags?: string[]; }

export const ABILITY_AOE: Record<string, AoeShape> = {
  // ── Ult AOEs ──
  "Orbital Strike":  { type: "circle", radius: 0.028,  color: "rgba(255,120,50,0.30)" },
  "Lockdown":        { type: "circle", radius: 0.10,   color: "rgba(255,220,50,0.12)" },
  "NULL/cmd":        { type: "circle", radius: 0.045,  color: "rgba(100,180,255,0.16)" },
  "Viper's Pit":     { type: "circle", radius: 0.055,  color: "rgba(0,200,80,0.14)" },
  "Seekers":         { type: "circle", radius: 0.07,   color: "rgba(100,220,100,0.12)" },
  "Reckoning":       { type: "circle", radius: 0.032,  color: "rgba(50,180,220,0.16)" },
  "Steel Garden":    { type: "circle", radius: 0.025,  color: "rgba(160,160,200,0.18)" },
  "Armageddon":      { type: "circle", radius: 0.028,  color: "rgba(255,100,50,0.22)" },
  "Rolling Thunder": { type: "cone",   radius: 0.065,  angle: Math.PI / 2.5, color: "rgba(255,180,50,0.18)" },
  "Nightfall":       { type: "cone",   radius: 0.08,   angle: Math.PI / 3,   color: "rgba(80,50,150,0.18)" },
  "Showstopper":     { type: "cone",   radius: 0.045,  angle: Math.PI / 5,   color: "rgba(255,80,80,0.22)" },
  "Thrash":          { type: "cone",   radius: 0.035,  angle: Math.PI / 4,   color: "rgba(100,220,50,0.18)" },
  "Hunter's Fury":   { type: "line",   radius: 0.003,  length: 0.25, color: "rgba(50,150,255,0.28)" },
  "Cosmic Divide":   { type: "line",   radius: 0.002,  length: 0.28, color: "rgba(180,100,255,0.28)" },
  "Annihilation":    { type: "line",   radius: 0.004,  length: 0.09, color: "rgba(100,200,220,0.25)" },
  // ── Smokes (10% smaller) ──
  "Sky Smoke":       { type: "circle", radius: 0.015,  color: "rgba(255,140,50,0.25)" },
  "Dark Cover":      { type: "circle", radius: 0.014,  color: "rgba(100,50,200,0.25)" },
  "Nebula":          { type: "circle", radius: 0.016,  color: "rgba(180,100,255,0.22)" },
  "Ruse":            { type: "circle", radius: 0.015,  color: "rgba(200,100,200,0.22)" },
  "Poison Cloud":    { type: "circle", radius: 0.015,  color: "rgba(0,200,80,0.25)" },
  "Cove":            { type: "circle", radius: 0.015,  color: "rgba(50,180,220,0.22)" },
  "Cloudburst":      { type: "circle", radius: 0.011,  color: "rgba(200,220,255,0.22)" },
  // ── Mollies ──
  "Incendiary":      { type: "circle", radius: 0.009,  color: "rgba(255,100,50,0.30)" },
  "Snake Bite":      { type: "circle", radius: 0.008,  color: "rgba(0,200,80,0.30)" },
  "Hot Hands":       { type: "circle", radius: 0.008,  color: "rgba(255,150,50,0.30)" },
  "FRAG/ment":       { type: "circle", radius: 0.010,  color: "rgba(100,180,255,0.25)" },
  "Mosh Pit":        { type: "circle", radius: 0.013,  color: "rgba(100,220,50,0.25)" },
  "Nanoswarm":       { type: "circle", radius: 0.008,  color: "rgba(255,220,50,0.25)" },
  // ── Utility ──
  "Regrowth":        { type: "circle", radius: 0.013,  color: "rgba(100,220,100,0.18)" },
  "Stim Beacon":     { type: "circle", radius: 0.012,  color: "rgba(255,140,50,0.16)" },
  "Nova Pulse":      { type: "circle", radius: 0.013,  color: "rgba(180,100,255,0.18)" },
  "Gravity Well":    { type: "circle", radius: 0.013,  color: "rgba(180,100,255,0.18)" },
  // ── Walls ──
  "Toxic Screen":    { type: "line",   radius: 0.003,  length: 0.14, color: "rgba(0,200,80,0.25)" },
  "Barrier Mesh":    { type: "line",   radius: 0.003,  length: 0.04, color: "rgba(100,200,220,0.25)" },
  "High Tide":       { type: "line",   radius: 0.004,  length: 0.12, color: "rgba(50,180,220,0.25)" },
  "Blaze":           { type: "line",   radius: 0.003,  length: 0.05, color: "rgba(255,150,50,0.25)" },
  "Contingency":     { type: "line",   radius: 0.003,  length: 0.04, color: "rgba(180,100,255,0.25)" },
  // ── Directional abilities ──
  "FLASH/drive":     { type: "cone",   radius: 0.02,   angle: Math.PI / 3,   color: "rgba(100,180,255,0.14)" },
  "Flashpoint":      { type: "cone",   radius: 0.015,  angle: Math.PI / 2.5, color: "rgba(255,180,50,0.14)" },
};

export function hasDirectionalAoe(item: PlacedItem): boolean {
  return !!item.aoe && (item.aoe.type === "cone" || item.aoe.type === "line");
}

export function emptyStep(): StratStep { return { paths: [], items: [], texts: [] }; }
export function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
