/**
 * Storybook character illustrations, one per move: src/assets/moves/<exercise id>.webp.
 * Any file added there is picked up automatically at build time.
 */
const FILES = import.meta.glob<string>('../assets/moves/*.webp', { eager: true, query: '?url', import: 'default' })

export const ART: Record<string, string> = Object.fromEntries(
  Object.entries(FILES).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1, -'.webp'.length), url]),
)

export const artUrl = (exerciseId: string): string | undefined => ART[exerciseId]
