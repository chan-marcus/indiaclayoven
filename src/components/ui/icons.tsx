/**
 * Simple line icons, deliberately used in place of emoji.
 * All inherit currentColor and a 1.5px stroke for a consistent weight.
 */

type P = { className?: string };

const base = (className?: string) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: className ?? "h-5 w-5",
  "aria-hidden": true,
});

export const IconBag = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M6 7h12l-1 13H7L6 7Z" />
    <path d="M9.5 9.5V6a2.5 2.5 0 0 1 5 0v3.5" />
  </svg>
);

export const IconPin = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

export const IconClock = ({ className }: P) => (
  <svg {...base(className)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5V12l3 1.75" />
  </svg>
);

export const IconPhone = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5Z" />
  </svg>
);

export const IconArrowRight = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M4 12h15" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);

export const IconChevronLeft = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="m14.5 5-7 7 7 7" />
  </svg>
);

export const IconChevronRight = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="m9.5 5 7 7-7 7" />
  </svg>
);

export const IconClose = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export const IconMenu = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const IconPlus = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconMinus = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M5 12h14" />
  </svg>
);

export const IconCheck = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const IconLock = ({ className }: P) => (
  <svg {...base(className)}>
    <rect x="4.5" y="10" width="15" height="10" rx="1.5" />
    <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
  </svg>
);

export const IconFlame = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 3s5 4.2 5 8.6a5 5 0 0 1-10 0C7 9.2 9 8 9 8s.4 2 1.6 2.6C11.4 9.6 12 7.5 12 3Z" />
  </svg>
);

export const IconLeaf = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M20 4S8 4.5 6 11c-1.3 4.2 1 7 1 7s4-.4 6.5-3C17 11.5 20 4 20 4Z" />
    <path d="M5 20c1.5-4 4-7 8-9.5" />
  </svg>
);

export const IconFax = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M7 9V4h10v5" />
    <rect x="3" y="9" width="18" height="8" rx="1.5" />
    <path d="M7 17v3h10v-3" />
    <path d="M17.5 12.5h.01" />
  </svg>
);

export const IconTrash = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M4.5 7h15" />
    <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
    <path d="M6.5 7 7.5 20h9L17.5 7" />
  </svg>
);

export const IconEdit = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
    <path d="m14.5 5.5 4 4" />
  </svg>
);

export const IconSearch = ({ className }: P) => (
  <svg {...base(className)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </svg>
);

export const IconGrid = ({ className }: P) => (
  <svg {...base(className)}>
    <rect x="4" y="4" width="7" height="7" rx="1" />
    <rect x="13" y="4" width="7" height="7" rx="1" />
    <rect x="4" y="13" width="7" height="7" rx="1" />
    <rect x="13" y="13" width="7" height="7" rx="1" />
  </svg>
);

export const IconReceipt = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M6 3.5h12v17l-2.5-1.5L13 20.5 10.5 19 8 20.5 6 19V3.5Z" />
    <path d="M9.5 8.5h5M9.5 12.5h5" />
  </svg>
);

export const IconSettings = ({ className }: P) => (
  <svg {...base(className)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3" />
  </svg>
);
