import { AnimatedCardStack } from './animate-card-animation'
import { curated } from '../../data/curated'

export default function DemoOne() {
  const cards = curated.hillStations.slice(0, 4).map((p) => ({
    id: p.title,
    title: p.title,
    description: p.tagline ?? 'Tap to explore highlights, map, weather, and nearby spots.',
    href: `/place/${encodeURIComponent(p.title)}`,
  }))

  return <AnimatedCardStack cards={cards} />
}

