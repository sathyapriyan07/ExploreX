import { supabase } from './supabase'
import type { Testimonial } from '../data/testimonials'
import { testimonials as seeded } from '../data/testimonials'

// Supabase-ready shape (future-proof). If Supabase isn't configured, falls back to seeded testimonials.
export async function getTestimonials(input?: { place?: string; region?: 'India' | 'Global'; limit?: number }) {
  const place = input?.place?.trim()
  const region = input?.region
  const limit = input?.limit ?? 6

  if (supabase) {
    // Optional integration if `reviews` table exists.
    // If it doesn't, this will safely fall back to seeded data.
    try {
      let q = supabase.from('reviews').select('id, place_title, quote, rating, trip_type, user_name, user_image, region').order('created_at', { ascending: false })
      if (place) q = q.eq('place_title', place)
      if (region) q = q.eq('region', region)
      q = q.limit(limit)
      const { data, error } = await q
      if (!error && data?.length) {
        const mapped: Testimonial[] = data.map((r: any) => ({
          id: String(r.id),
          place: r.place_title ?? undefined,
          region: (r.region === 'Global' ? 'Global' : 'India') as 'India' | 'Global',
          rating: clampRating(Number(r.rating)),
          name: r.user_name ?? 'Traveler',
          role: r.trip_type ?? 'Traveler',
          quote: r.quote ?? '',
          image: null,
        }))
        return mapped.slice(0, limit)
      }
    } catch {
      // ignore
    }
  }

  const filtered = seeded
    .filter((t) => (place ? t.place?.toLowerCase() === place.toLowerCase() : true))
    .filter((t) => (region ? t.region === region : true))
  return filtered.slice(0, limit)
}

function clampRating(n: number): 1 | 2 | 3 | 4 | 5 {
  if (n >= 5) return 5
  if (n <= 1) return 1
  return Math.round(n) as 1 | 2 | 3 | 4 | 5
}
