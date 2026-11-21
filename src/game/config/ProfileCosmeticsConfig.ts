export type ProfileAvatarId =
  | 'vanguard'
  | 'phoenix'
  | 'nova'
  | 'specter'
  | 'aegis'
  | 'orbit'
  | 'eclipse'
  | 'sovereign';

export type ProfileBorderId =
  | 'standard_alloy'
  | 'cyan_pulse'
  | 'solar_gold'
  | 'crimson_edge'
  | 'astral_prism'
  | 'celestial_crown';

export interface ProfileAvatarDef {
  id: ProfileAvatarId;
  name: string;
  subtitle: string;
  accentHex: string;
  bgTintClass: string;
}

export interface ProfileBorderDef {
  id: ProfileBorderId;
  name: string;
  tierLabel: string;
  previewRingClass: string;
  frameClass: string;
  accentHex: string;
}

export const PROFILE_AVATARS: readonly ProfileAvatarDef[] = [
  {
    id: 'vanguard',
    name: 'Vanguard Crest',
    subtitle: 'Earth Defense Shield',
    accentHex: '#38BDF8',
    bgTintClass: 'bg-sky-500/14',
  },
  {
    id: 'phoenix',
    name: 'Solar Phoenix',
    subtitle: 'Winged Ace Emblem',
    accentHex: '#FACC15',
    bgTintClass: 'bg-amber-400/14',
  },
  {
    id: 'nova',
    name: 'Nova Pulsar',
    subtitle: 'Quantum Star Core',
    accentHex: '#818CF8',
    bgTintClass: 'bg-indigo-400/16',
  },
  {
    id: 'specter',
    name: 'Specter Phantom',
    subtitle: 'Stealth Strike Unit',
    accentHex: '#F43F5E',
    bgTintClass: 'bg-rose-500/14',
  },
  {
    id: 'aegis',
    name: 'Aegis Bastion',
    subtitle: 'Orbital Citadel Hex',
    accentHex: '#10B981',
    bgTintClass: 'bg-emerald-500/14',
  },
  {
    id: 'orbit',
    name: 'Delta Interceptor',
    subtitle: 'Vanguard Squadron',
    accentHex: '#22D3EE',
    bgTintClass: 'bg-cyan-400/14',
  },
  {
    id: 'eclipse',
    name: 'Void Eclipse',
    subtitle: 'Singularity Horizon',
    accentHex: '#E879F9',
    bgTintClass: 'bg-fuchsia-500/14',
  },
  {
    id: 'sovereign',
    name: 'Astral Crown',
    subtitle: 'Fleet Marshal Insignia',
    accentHex: '#FDE047',
    bgTintClass: 'bg-amber-300/15',
  },
] as const;

export const PROFILE_BORDERS: readonly ProfileBorderDef[] = [
  {
    id: 'standard_alloy',
    name: 'Standard Alloy',
    tierLabel: 'Classic',
    accentHex: '#64748B',
    previewRingClass: 'border border-slate-500/75 bg-[#070f20]',
    frameClass: 'border border-slate-600/80 bg-[#070f20]/90',
  },
  {
    id: 'cyan_pulse',
    name: 'Ion Circuit',
    tierLabel: 'Tactical',
    accentHex: '#22D3EE',
    previewRingClass: 'border-2 border-cyan-300/80 bg-[#061328] ring-1 ring-cyan-400/25',
    frameClass: 'border-2 border-cyan-300/80 bg-[#07142b]/92 shadow-[0_0_12px_rgba(34,211,238,0.22)]',
  },
  {
    id: 'solar_gold',
    name: 'Solar Aureole',
    tierLabel: 'Commander',
    accentHex: '#FACC15',
    previewRingClass: 'border-2 border-amber-300/85 bg-[#151107] ring-1 ring-amber-400/25',
    frameClass: 'border-2 border-amber-300/85 bg-[#141108]/92 shadow-[0_0_12px_rgba(250,204,21,0.22)]',
  },
  {
    id: 'crimson_edge',
    name: 'Crimson Edge',
    tierLabel: 'Striker',
    accentHex: '#F43F5E',
    previewRingClass: 'border-2 border-rose-400/85 bg-[#190910] ring-1 ring-rose-500/25',
    frameClass: 'border-2 border-rose-400/85 bg-[#180a12]/92 shadow-[0_0_12px_rgba(244,63,94,0.22)]',
  },
  {
    id: 'astral_prism',
    name: 'Astral Prism',
    tierLabel: 'Elite',
    accentHex: '#818CF8',
    previewRingClass: 'border-2 border-indigo-300/85 bg-gradient-to-br from-indigo-950/90 to-cyan-950/90 ring-1 ring-cyan-300/35',
    frameClass: 'border-2 border-indigo-300/85 bg-gradient-to-br from-[#0e1535]/95 to-[#081b2e]/95 ring-1 ring-cyan-300/30 shadow-[0_0_14px_rgba(129,140,248,0.28)]',
  },
  {
    id: 'celestial_crown',
    name: 'Celestial Sovereign',
    tierLabel: 'Mythic',
    accentHex: '#E879F9',
    previewRingClass: 'border-2 border-fuchsia-300/90 bg-gradient-to-br from-fuchsia-950/90 via-[#150b2a] to-amber-950/70 ring-1 ring-amber-300/45',
    frameClass: 'border-2 border-fuchsia-300/90 bg-gradient-to-br from-[#1b0b2e]/95 via-[#0b1028]/95 to-[#201608]/90 ring-1 ring-amber-300/45 shadow-[0_0_16px_rgba(232,121,249,0.28)]',
  },
] as const;

export const PROFILE_AVATAR_MAP: Record<ProfileAvatarId, ProfileAvatarDef> = Object.fromEntries(
  PROFILE_AVATARS.map((a) => [a.id, a])
) as Record<ProfileAvatarId, ProfileAvatarDef>;

export const PROFILE_BORDER_MAP: Record<ProfileBorderId, ProfileBorderDef> = Object.fromEntries(
  PROFILE_BORDERS.map((b) => [b.id, b])
) as Record<ProfileBorderId, ProfileBorderDef>;

export function isValidAvatarId(val: unknown): val is ProfileAvatarId {
  return typeof val === 'string' && val in PROFILE_AVATAR_MAP;
}

export function isValidBorderId(val: unknown): val is ProfileBorderId {
  return typeof val === 'string' && val in PROFILE_BORDER_MAP;
}
