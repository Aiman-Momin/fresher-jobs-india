import type { ReactNode } from "react";

function Svg({ children, size = 16, w = 1.8 }: { children: ReactNode; size?: number; w?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const SearchIcon = () => <Svg size={18} w={2}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Svg>;
export const FilterIcon = () => <Svg size={18}><path d="M3 5h18l-7 8.5V19l-4 2v-7.5L3 5Z" /></Svg>;
export const CloseIcon = () => <Svg size={16} w={2}><path d="M6 6l12 12M18 6 6 18" /></Svg>;
export const PinIcon = () => <Svg size={15}><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></Svg>;
export const BriefcaseIcon = () => <Svg size={15}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 13h18" /></Svg>;
export const CalendarIcon = () => <Svg size={15}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></Svg>;
export const UserIcon = () => <Svg size={15}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Svg>;
export const TrendIcon = () => <Svg size={14} w={2.2}><path d="m3 17 6-6 4 4 8-8M15 7h6v6" /></Svg>;
export const ClockIcon = () => <Svg size={13}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>;
export const ChevronRight = () => <Svg size={14} w={2.2}><path d="m9 6 6 6-6 6" /></Svg>;
export const SunIcon = () => <Svg size={18}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Svg>;
export const MoonIcon = () => <Svg size={18}><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" /></Svg>;

export function BookmarkIcon({ filled, size = 18 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor"
      strokeWidth={1.8} strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1Z" />
    </svg>
  );
}
