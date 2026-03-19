export type Testimonial = {
  id: string
  place?: string
  image?: string | null
  quote: string
  name: string
  role: string
  rating: 1 | 2 | 3 | 4 | 5
  region: 'India' | 'Global'
}

// Seeded travel testimonials (Supabase-ready: mirrors a future `reviews` table)
export const testimonials: Testimonial[] = [
  {
    id: 'munnar-1',
    place: 'Munnar',
    region: 'India',
    rating: 5,
    name: 'Ananya',
    role: 'Couple Trip',
    quote: 'Munnar felt like a slow movie—tea gardens, misty mornings, and viewpoints that actually delivered.',
    image: null,
  },
  {
    id: 'ooty-1',
    place: 'Ooty',
    region: 'India',
    rating: 4,
    name: 'Rahul',
    role: 'Weekend Getaway',
    quote: 'Perfect hill-station reset. Lakeside walks and early drives were the highlight—avoid peak-hour traffic.',
    image: null,
  },
  {
    id: 'kodaikanal-1',
    place: 'Kodaikanal',
    region: 'India',
    rating: 5,
    name: 'Meera',
    role: 'Solo Traveler',
    quote: 'Sunrise viewpoints + pine forests. The itinerary suggestions helped me keep days balanced and unrushed.',
    image: null,
  },
  {
    id: 'wayanad-1',
    place: 'Wayanad',
    region: 'India',
    rating: 4,
    name: 'Karthik',
    role: 'Nature + Trek',
    quote: 'Waterfalls, trails, and green everywhere. Nearby attractions were surprisingly accurate for planning.',
    image: null,
  },
  {
    id: 'kerala-1',
    place: 'Alappuzha',
    region: 'India',
    rating: 5,
    name: 'Diya',
    role: 'Family Trip',
    quote: 'Backwaters were serene. We used the map to find quieter stretches and timed it around weather.',
    image: null,
  },
  {
    id: 'global-1',
    place: 'Bali',
    region: 'Global',
    rating: 5,
    name: 'James',
    role: 'Digital Nomad',
    quote: 'Easy to explore. Loved the map + nearby spots combo—it felt like having a local guide.',
    image: null,
  },
]
