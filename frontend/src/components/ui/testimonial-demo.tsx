import { TestimonialSlider } from './testimonial-slider'
import { testimonials } from '../../data/testimonials'

export function TestimonialDemo() {
  return <TestimonialSlider testimonials={testimonials.slice(0, 4)} />
}

