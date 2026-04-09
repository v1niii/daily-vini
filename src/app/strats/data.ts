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
  aoe?: AoeShape; imgW?: number; imgH?: number; aoeScale?: number;
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

// Agent-themed colors. Sizes use per-map JSON when available, these are fallbacks.
export const ABILITY_AOE: Record<string, AoeShape> = {
  // ── Ult AOEs ──
  "Orbital Strike":  { type: "circle", radius: 0.032,  color: "rgba(255,120,50,0.22)" },    // Brimstone — orange fire
  "Lockdown":        { type: "circle", radius: 0.100,  color: "rgba(255,210,50,0.10)" },    // Killjoy — yellow tech (bigger)
  "NULL/cmd":        { type: "circle", radius: 0.100,  color: "rgba(80,160,255,0.10)" },    // KAY/O — tech blue (bigger)
  "Viper's Pit":     { type: "circle", radius: 0.090,  color: "rgba(30,200,80,0.08)" },     // Viper — toxic green (bigger)
  "Seekers":         { type: "circle", radius: 0.040,  color: "rgba(80,200,100,0.08)" },    // Skye — natural green
  "Reckoning":       { type: "cone",   radius: 0.100,  angle: Math.PI / 1.8, color: "rgba(40,180,220,0.10)" },   // Harbor — water teal (wider cone)
  "Steel Garden":    { type: "circle", radius: 0.060,  color: "rgba(160,170,200,0.12)" },   // Vyse — steel silver (bigger)
  "Armageddon":      { type: "line",   radius: 0.016,  length: 0.12,  color: "rgba(255,120,60,0.18)" },          // Tejo — wider rect
  "Rolling Thunder": { type: "cone",   radius: 0.180,  angle: Math.PI / 1.8, color: "rgba(255,160,40,0.08)" },   // Breach — wider cone
  "Nightfall":       { type: "line",   radius: 0.020,  length: 0.16, color: "rgba(80,40,160,0.10)" },            // Fade — rectangle AOE
  "Showstopper":     { type: "cone",   radius: 0.050,  angle: Math.PI / 3, color: "rgba(255,100,50,0.00)" },     // Raze — direction only
  "Thrash":          { type: "cone",   radius: 0.028,  angle: Math.PI / 3, color: "rgba(100,220,50,0.00)" },     // Gekko — direction only
  "Kill Contract":   { type: "line",   radius: 0.012,  length: 0.10, color: "rgba(160,80,255,0.12)" },           // Iso — rectangle area
  "Hunter's Fury":   { type: "line",   radius: 0.005,  length: 0.20, color: "rgba(50,150,255,0.18)" },           // Sova — shorter
  "Cosmic Divide":   { type: "line",   radius: 0.008,  length: 0.50, color: "rgba(160,100,255,0.22)" },          // Astra — cosmic purple wall
  "Annihilation":    { type: "line",   radius: 0.004,  length: 0.08, color: "rgba(100,190,220,0.20)" },          // Deadlock — longer range
  "Bassquake":       { type: "cone",   radius: 0.120,  angle: Math.PI / 1.8, color: "rgba(180,80,255,0.08)" },   // Miks — wider cone
  "Convergent Paths": { type: "line",  radius: 0.020,  length: 0.14, color: "rgba(255,200,100,0.14)" },          // Waylay — wider rect
  // ── Smokes ──
  "Sky Smoke":       { type: "circle", radius: 0.017,  color: "rgba(255,120,50,0.18)" },
  "Dark Cover":      { type: "circle", radius: 0.018,  color: "rgba(80,60,180,0.18)" },
  "Nebula":          { type: "circle", radius: 0.019,  color: "rgba(160,100,255,0.16)" },
  "Ruse":            { type: "circle", radius: 0.017,  color: "rgba(180,100,200,0.16)" },
  "Poison Cloud":    { type: "circle", radius: 0.017,  color: "rgba(30,200,80,0.18)" },
  "Cove":            { type: "circle", radius: 0.017,  color: "rgba(40,180,220,0.16)" },
  "Cloudburst":      { type: "circle", radius: 0.007,  color: "rgba(180,220,255,0.18)" },
  "Waveform":        { type: "circle", radius: 0.017,  color: "rgba(180,80,255,0.16)" },
  // ── Mollies ──
  "Incendiary":      { type: "circle", radius: 0.016,  color: "rgba(255,120,50,0.22)" },
  "Snake Bite":      { type: "circle", radius: 0.014,  color: "rgba(30,200,80,0.22)" },
  "Hot Hands":       { type: "circle", radius: 0.014,  color: "rgba(255,140,40,0.22)" },
  "FRAG/ment":       { type: "circle", radius: 0.024,  color: "rgba(80,160,255,0.16)" },
  "Mosh Pit":        { type: "circle", radius: 0.028,  color: "rgba(100,220,50,0.14)" },
  "Nanoswarm":       { type: "circle", radius: 0.020,  color: "rgba(255,210,50,0.18)" },
  // ── Utility ──
  "Regrowth":        { type: "circle", radius: 0.036,  color: "rgba(80,200,100,0.10)" },
  "Stim Beacon":     { type: "circle", radius: 0.020,  color: "rgba(255,120,50,0.10)" },
  "Nova Pulse":      { type: "circle", radius: 0.019,  color: "rgba(160,100,255,0.14)" },
  "Gravity Well":    { type: "circle", radius: 0.019,  color: "rgba(160,100,255,0.14)" },
  "Slow Orb":        { type: "circle", radius: 0.026,  color: "rgba(80,200,220,0.14)" },
  "Paranoia":        { type: "line",   radius: 0.008,  length: 0.06, color: "rgba(80,60,180,0.14)" },            // Omen — shorter range
  // ── Walls ──
  "Toxic Screen":    { type: "line",   radius: 0.006,  length: 0.35, color: "rgba(30,200,80,0.25)" },
  "Barrier Orb":     { type: "line",   radius: 0.005,  length: 0.06, color: "rgba(80,200,220,0.25)" },
  "Barrier Mesh":    { type: "line",   radius: 0.004,  length: 0.06, color: "rgba(100,190,220,0.18)" },
  "High Tide":       { type: "line",   radius: 0.006,  length: 0.18, color: "rgba(40,180,220,0.25)" },
  "Blaze":           { type: "line",   radius: 0.005,  length: 0.10, color: "rgba(255,140,40,0.30)" },           // Phoenix — longer, more orange
  "Contingency":     { type: "line",   radius: 0.010,  length: 0.16, color: "rgba(160,80,255,0.20)" },
  "Fast Lane":       { type: "line",   radius: 0.016,  length: 0.10, color: "rgba(60,120,255,0.14)" },           // Neon — gap between twin walls
  // ── Other abilities ──
  "Aftershock":      { type: "circle", radius: 0.012,  color: "rgba(255,160,40,0.20)" },
  "GravNet":         { type: "circle", radius: 0.022,  color: "rgba(100,190,220,0.16)" },
  "Haunt":           { type: "circle", radius: 0.036,  color: "rgba(80,40,160,0.08)" },
  "Shock Bolt":      { type: "circle", radius: 0.022,  color: "rgba(50,150,255,0.16)" },
  "Special Delivery": { type: "circle", radius: 0.014, color: "rgba(255,120,60,0.18)" },
  "Guided Salvo":    { type: "circle", radius: 0.020,  color: "rgba(255,120,60,0.14)" },
  "Meddle":          { type: "circle", radius: 0.014,  color: "rgba(180,100,200,0.16)" },
  "M-Pulse":         { type: "circle", radius: 0.020,  color: "rgba(180,80,255,0.14)" },
  "Seize":           { type: "circle", radius: 0.022,  color: "rgba(80,40,160,0.18)" },
  "Paint Shells":    { type: "circle", radius: 0.022,  color: "rgba(255,100,50,0.16)" },
  "Saturate":        { type: "circle", radius: 0.022,  color: "rgba(255,200,100,0.14)" },
  "Storm Surge":     { type: "circle", radius: 0.022,  color: "rgba(40,180,220,0.16)" },
  "Relay Bolt":      { type: "circle", radius: 0.026,  color: "rgba(60,120,255,0.14)" },
  "Leer":            { type: "circle", radius: 0.010,  color: "rgba(180,50,200,0.10)" },    // Reyna — smaller
  "Interceptor":     { type: "circle", radius: 0.010,  color: "rgba(100,180,220,0.10)" },   // Veto — smaller
  "Chokehold":       { type: "line",   radius: 0.004,  length: 0.04, color: "rgba(100,180,220,0.18)" },          // Veto — directional, no circle
  "FLASH/drive":     { type: "cone",   radius: 0.020,  angle: Math.PI / 3, color: "rgba(80,160,255,0.10)" },
  "Flashpoint":      { type: "circle", radius: 0.016,  color: "rgba(255,160,40,0.10)" },
  "Razorvine":       { type: "circle", radius: 0.020,  color: "rgba(160,170,200,0.14)" },
};

// Maps ability name → local IG (in-game) image path for map canvas rendering.
// Only abilities with _IG files get entries; others use the API icon.
export const ABILITY_IG_IMAGES: Record<string, string> = {
  // Astra
  "Gravity Well":    "/agent_abilities/astra/1_Gravity_Well_IG.png",
  "Nova Pulse":      "/agent_abilities/astra/2_Nova_Pulse_IG.png",
  "Nebula":          "/agent_abilities/astra/3_Nebula_IG.png",
  // Breach
  "Aftershock":      "/agent_abilities/breach/1_Aftershock_IG.webp",
  // Brimstone
  "Incendiary":      "/agent_abilities/brimstone/2_Incendiary_IG.png",
  "Sky Smoke":       "/agent_abilities/brimstone/3_Sky_Smoke_IG.png",
  // Clove
  "Meddle":          "/agent_abilities/clove/2_Meddle_IG.webp",
  "Ruse":            "/agent_abilities/clove/3_Ruse_IG.webp",
  // Deadlock
  "GravNet":         "/agent_abilities/deadlock/1_GravNet_IG.png",
  // Fade
  "Haunt":           "/agent_abilities/fade/3_Haunt_IG.png",
  // Gekko
  "Mosh Pit":        "/agent_abilities/gekko/1_Mosh_Pit_IG.png",
  "Wingman":         "/agent_abilities/gekko/2_Wingman_IG.png",
  // Harbor
  "Storm Surge":     "/agent_abilities/harbor/1_Storm_Surge_IG.webp",
  "Cove":            "/agent_abilities/harbor/3_Cove_IG.png",
  // Jett
  "Cloudburst":      "/agent_abilities/jett/1_Cloudburst_IG.png",
  // KAY/O
  "FRAG/ment":       "/agent_abilities/kayo/1_FRAG-ment_IG.png",
  // Killjoy
  "Nanoswarm":       "/agent_abilities/killjoy/1_Nanoswarm_IG.png",
  "Alarmbot":        "/agent_abilities/killjoy/2_Alarmbot_IG.png",
  "Turret":          "/agent_abilities/killjoy/3_Turret_IG.png",
  // Miks
  "M-Pulse":         "/agent_abilities/miks/1_M-Pulse_IG.webp",
  "Waveform":        "/agent_abilities/miks/3_Waveform_IG.webp",
  // Omen
  "Dark Cover":      "/agent_abilities/omen/3_Dark_Cover_IG.png",
  // Phoenix
  "Hot Hands":       "/agent_abilities/phoenix/3_Hot_Hands_IG.png",
  // Raze
  "Boom Bot":        "/agent_abilities/raze/1_Boom_Bot_IG.png",
  // Reyna
  "Leer":            "/agent_abilities/reyna/1_Leer_IG.png",
  // Sage
  "Barrier Orb":     "/agent_abilities/sage/1_Barrier_Orb_IG.png",
  "Slow Orb":        "/agent_abilities/sage/2_Slow_Orb_IG.png",
  // Sova
  "Shock Bolt":      "/agent_abilities/sova/2_Shock_Bolt_IG.png",
  // Tejo
  "Special Delivery": "/agent_abilities/tejo/2_Special_Delivery_IG.webp",
  "Guided Salvo":    "/agent_abilities/tejo/3_Guided_Salvo_IG.webp",
  // Veto
  "Interceptor":     "/agent_abilities/veto/3_Interceptor_IG.png",
  // Viper
  "Snake Bite":      "/agent_abilities/viper/1_Snake_Bite_IG.png",
  "Poison Cloud":    "/agent_abilities/viper/2_Poison_Cloud_IG.png",
  "Viper's Pit":     "/agent_abilities/viper/4_Viper's_Pit_ult_IG.png",
  // Vyse
  "Razorvine":       "/agent_abilities/vyse/1_Razorvine_IG.webp",
  // Waylay
  "Saturate":        "/agent_abilities/waylay/1_Saturate_IG.webp",
};

// Maps ability name → filename in /out_aoe/{map}/ (circle AOE overlays)
export const AOE_CIRCLE_FILES: Record<string, string> = {
  "Sky Smoke": "Brimstone_-_Sky_Smoke.png", "Dark Cover": "Omen_-_Dark_Cover.png",
  "Nebula": "Astra_-_Nebula.png", "Gravity Well": "Astra_-_Gravity_Well.png",
  "Nova Pulse": "Astra_-_Nova_Pulse.png", "Ruse": "Clove_-_Ruse.png",
  "Poison Cloud": "Viper_-_Poison_Cloud.png", "Cove": "Harbor_-_Cove.png",
  "Waveform": "Miks_-_Waveform.png", "Cloudburst": "Jett_-_Cloudburst.png",
  "Incendiary": "Brimstone_-_Incendiary.png", "Snake Bite": "Viper_-_Snake_Bite.png",
  "Hot Hands": "Phoenix_-_Hot_Hands.png", "Nanoswarm": "Killjoy_-_Nanoswarm.png",
  "FRAG/ment": "KAY-O_-_FRAG-ment.png", "Stim Beacon": "Brimstone_-_Stim_Beacon.png",
  "Slow Orb": "Sage_-_Slow_Orb.png", "Seize": "Fade_-_Seize.png",
  "Mosh Pit": "Gekko_-_Mosh_Pit.png", "Paint Shells": "Raze_-_Paint_Shells.png",
  "Blast Pack": "Raze_-_Blast_Pack.png", "Relay Bolt": "Neon_-_Relay_Bolt.png",
  "ZERO/point": "KAY-O_-_ZERO-point.png", "Special Delivery": "Tejo_-_Special_Delivery.png",
  "Alarmbot": "Killjoy_-_Alarmbot.png", "Sonic Sensor": "Deadlock_-_Sonic_Sensor.png",
  "GravNet": "Deadlock_-_GravNet.png", "Chokehold": "Veto_-_Chokehold.png",
  "Razorvine": "Vyse_-_Razorvine.png", "Saturate": "Waylay_-_Saturate.png",
  "M-Pulse": "Miks_-_M-Pulse.png", "Regrowth": "Skye_-_Regrowth.png",
  "Shock Bolt": "Sova_-_Shock_Bolt.png", "Recon Bolt": "Sova_-_Recon_Bolt.png",
  "Leer": "Reyna_-_Leer.png", "Storm Surge": "Harbor_-_Storm_Surge.png",
  "Undercut": "Iso_-_Undercut.png", "Stealth Drone": "Tejo_-_Stealth_Drone.png",
  "Orbital Strike": "Brimstone_-_Orbital_Strike_(ult).png",
  "Viper's Pit": "Viper_-_Vipers_Pit_(ult).png",
  "Lockdown": "Killjoy_-_Lockdown_(ult).png",
  "NULL/cmd": "KAY-O_-_NULL-cmd_(ult).png",
  "Showstopper": "Raze_-_Showstopper_(ult).png",
  "Thrash": "Gekko_-_Thrash_(ult).png",
  "Steel Garden": "Vyse_-_Steel_Garden_(ult).png",
};

// Maps ability name → filename in /directional_abilities/{map}/ (cones, lines, walls)
export const AOE_DIRECTIONAL_FILES: Record<string, string> = {
  "Toxic Screen": "Viper_-_Toxic_Screen.png", "Blaze": "Phoenix_-_Blaze.png",
  "Fast Lane": "Neon_-_Fast_Lane.png", "High Tide": "Harbor_-_High_Tide.png",
  "Contingency": "Iso_-_Contingency.png", "Aftershock": "Breach_-_Aftershock.png",
  "Fault Line": "Breach_-_Fault_Line.png", "Undercut": "Iso_-_Undercut.png",
  "FLASH/drive": "KAY-O_-_FLASH-drive.png",
  "Blindside": "Yoru_-_Blindside.png", "Boom Bot": "Raze_-_Boom_Bot.png",
  "Wingman": "Gekko_-_Wingman.png", "Dizzy": "Gekko_-_Dizzy.png",
  "Prowler": "Fade_-_Prowler.png", "Trailblazer": "Skye_-_Trailblazer.png",
  "Guiding Light": "Skye_-_Guiding_Light.png", "Owl Drone": "Sova_-_Owl_Drone.png",
  "Gatecrash": "Yoru_-_Gatecrash.png",
  "Rolling Thunder": "Breach_-_Rolling_Thunder_(ult).png",
  "Nightfall": "Fade_-_Nightfall_(ult).png",
  "Hunter's Fury": "Sova_-_Hunters_Fury_(ult).png",
  "Reckoning": "Harbor_-_Reckoning_(ult).png",
  "Bassquake": "Miks_-_Bassquake_(ult).png",
  "Convergent Paths": "Waylay_-_Convergent_Paths_(ult).png",
  "Armageddon": "Tejo_-_Armageddon_(ult).png",
};

export function hasDirectionalAoe(item: PlacedItem): boolean {
  return !!item.aoe && (item.aoe.type === "cone" || item.aoe.type === "line");
}

export function emptyStep(): StratStep { return { paths: [], items: [], texts: [] }; }
export function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
