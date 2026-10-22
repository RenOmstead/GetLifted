const PATHS = {
  home: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z',
  dumbbell: 'M6.5 6.5v11M17.5 6.5v11M3.5 9.5v5M20.5 9.5v5M6.5 12h11',
  food: 'M7 3v7a2 2 0 0 0 2 2v9M5 3v5M9 3v5M17 3c-2 0-3.5 2.2-3.5 5.5S15 13 17 13v8',
  timer: 'M12 8.5V13l3 2M9 2.5h6M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
  body: 'M3 12h4l3-7 4 14 3-7h4',
  settings: 'M4 6h9m4 0h3M4 12h3m4 0h9M4 18h11m4 0h1M15 4v4M9 10v4M17 16v4',
  plus: 'M12 5v14M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7',
  chevronLeft: 'M15 18l-6-6 6-6',
  chevronRight: 'M9 18l6-6-6-6',
  chevronDown: 'M6 9l6 6 6-6',
  x: 'M6 6l12 12M18 6L6 18',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5',
  play: 'M7 4.5v15l12.5-7.5z',
  pause: 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01',
  alert: 'M12 3.5 22 20.5H2zM12 10v4.5M12 17.5h.01',
  flame: 'M12 3c1 4 5.5 5.5 5.5 10.5a5.5 5.5 0 0 1-11 0c0-3 2-4.5 2-7.5 2 1 3.5 3 3.5 5',
  droplet: 'M12 3s6.5 7 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10 12 3 12 3z',
  pill: 'M9.5 20.5a5 5 0 0 1-7-7l7-7a5 5 0 0 1 7 7zM6 10l8 8',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20.5h8M9.5 17h5v3.5h-5z',
  camera: 'M4 8h3.5l2-3h5l2 3H20v11H4zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  book: 'M5 4.5A1.5 1.5 0 0 1 6.5 3H20v15H6.5A1.5 1.5 0 0 0 5 19.5zM5 19.5A1.5 1.5 0 0 0 6.5 21H20v-3',
  list: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  arrowUp: 'M12 19V5M5.5 11.5 12 5l6.5 6.5',
  arrowDown: 'M12 5v14M18.5 12.5 12 19l-6.5-6.5',
  history: 'M3.5 12a8.5 8.5 0 1 0 2.7-6.2L3.5 8.5M3.5 3.5v5h5M12 7.5V12l3 2',
  star: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z',
  barcode: 'M4 6v12M7 6v12M10.5 6v12M13.5 6v12M17 6v12M20 6v12',
  download: 'M12 4v11M7 10.5l5 5 5-5M5 20h14',
  upload: 'M12 16V5M7 9.5l5-5 5 5M5 20h14',
  external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  repeat: 'M17 2.5 20.5 6 17 9.5M3.5 11V9.5A3.5 3.5 0 0 1 7 6h13.5M7 21.5 3.5 18 7 14.5M20.5 13v1.5A3.5 3.5 0 0 1 17 18H3.5',
  skip: 'M5.5 5 15 12l-9.5 7zM18.5 5v14',
  grip: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM12 12h.01',
  stretch: 'M13 4.5a1.5 1.5 0 1 0 0 .01M8 21l3.5-7 3 2.5V21M6 10.5l4.5-3 3.5 2 4 1M11.5 14l1.5-4.5',
  minus: 'M5 12h14',
  sun: 'M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4',
} as const

export type IconName = keyof typeof PATHS

const FILLED: Partial<Record<IconName, boolean>> = { play: true, pause: true }

export function Icon({ name, size = 22, className, strokeWidth = 2 }: { name: IconName; size?: number; className?: string; strokeWidth?: number }) {
  const filled = FILLED[name]
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`icon ${className ?? ''}`}
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
