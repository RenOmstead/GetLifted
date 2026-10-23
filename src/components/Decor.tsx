/** Painted illustrations (shared with Novellow) used as little decorations. */
export type DecorName =
  | 'amethyst_cluster'
  | 'black_cat'
  | 'drying_herbs'
  | 'lantern_string'
  | 'moth_garland'
  | 'mushroom_lamp'
  | 'orb_garland'
  | 'pink_lamp'
  | 'plum_mug'
  | 'potion_trio'
  | 'rose_vine'
  | 'sage_mug'
  | 'star_lantern'

export function decorUrl(name: string): string {
  return `${import.meta.env.BASE_URL}decor/${name}.webp`
}

export function Decor({ name, className }: { name: DecorName | string; className?: string }) {
  return <img src={decorUrl(name)} alt="" aria-hidden="true" className={`decor ${className ?? ''}`} loading="lazy" decoding="async" draggable={false} />
}
