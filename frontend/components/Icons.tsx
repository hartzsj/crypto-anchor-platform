// Shared SVG Icons

interface IconProps {
  size?: number;
  className?: string;
}

export const SearchIcon = ({ size = 20, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <circle cx="9" cy="9" r="7" />
    <path d="M14 14l4 4" />
  </svg>
);

export const FilterIcon = ({ size = 20, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <path d="M3 4h14M6 10h8M8 16h4" />
  </svg>
);

export const PackageIcon = ({ size = 64, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="var(--text-muted)" strokeWidth="1" className={className}>
    <rect x="8" y="16" width="48" height="40" rx="4" />
    <path d="M8 32h48M32 16v40" />
  </svg>
);

export const PackageSmallIcon = ({ size = 32, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <rect x="4" y="8" width="24" height="18" rx="2" />
    <path d="M4 12h24M16 8v18M10 8l6 4 6-4" />
  </svg>
);

export const StarIcon = ({ size = 14, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="var(--accent)" className={className}>
    <path d="M7 1l1.5 3 3.5.5-2.5 2.5.5 3.5L7 9l-2.5 2 .5-3.5L2.5 5l3.5-.5L7 1z" />
  </svg>
);

export const TruckIcon = ({ size = 20, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <rect x="1" y="4" width="12" height="10" rx="1" />
    <path d="M13 8h4l2 4v2h-6V8z" />
    <circle cx="5" cy="14" r="2" />
    <circle cx="15" cy="14" r="2" />
  </svg>
);

export const CheckIcon = ({ size = 20, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M4 10l4 4 8-8" />
  </svg>
);

export const XIcon = ({ size = 20, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M4 4l12 12M16 4l-12 12" />
  </svg>
);

export const WalletIcon = ({ size = 32, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <rect x="4" y="8" width="24" height="18" rx="2" />
    <path d="M4 12h24M20 18h6" />
  </svg>
);

export const LockIcon = ({ size = 32, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <rect x="6" y="14" width="20" height="14" rx="2" />
    <path d="M11 14v-4a5 5 0 0110 0v4" />
    <circle cx="16" cy="21" r="2" />
  </svg>
);

export const ClockIcon = ({ size = 32, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <circle cx="16" cy="16" r="12" />
    <path d="M16 8v8l6 4" />
  </svg>
);

export const LinkIcon = ({ size = 24, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <path d="M10 13a5 5 0 007 0l2-2a5 5 0 00-7-7l-1 1" />
    <path d="M14 11a5 5 0 00-7 0l-2 2a5 5 0 007 7l1-1" />
  </svg>
);

export const ArrowUpIcon = ({ size = 24, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <path d="M12 4v16M6 10l6-6 6 6" />
  </svg>
);

export const EyeIcon = ({ size = 18, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <path d="M1 9s2-5 8-5 8 5 8 5-2 5-8 5-8-5-8-5z" />
    <circle cx="9" cy="9" r="2" />
  </svg>
);

export const EyeOffIcon = ({ size = 18, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <path d="M2 2l14 14M6 4c-3 1-5 5-5 5s2 5 8 5c2 0 4-1 5-2" />
  </svg>
);

export const CopyIcon = ({ size = 18, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <rect x="4" y="4" width="12" height="12" rx="2" />
    <path d="M2 12V2a2 2 0 012-2h10" />
  </svg>
);

export const UserIcon = ({ size = 24, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
  </svg>
);

export const SettingsIcon = ({ size = 24, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

export const ChartIcon = ({ size = 24, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <path d="M3 3v18h18" />
    <path d="M7 16l4-4 4 2 6-6" />
  </svg>
);

export const ChevronDownIcon = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <path d="M4 6l4 4 4-4" />
  </svg>
);

export const EmptyBoxIcon = ({ size = 64, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="var(--text-muted)" strokeWidth="1" className={className}>
    <rect x="8" y="16" width="48" height="40" rx="4" />
    <path d="M8 32h48M32 16v40" />
  </svg>
);