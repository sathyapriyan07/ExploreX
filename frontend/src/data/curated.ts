import type { CuratedPlace } from '../types'

export const curated: {
  hillStations: CuratedPlace[]
  keralaEscapes: CuratedPlace[]
  tamilNaduCulture: CuratedPlace[]
  trendingIndia: CuratedPlace[]
  quickTrips: CuratedPlace[]
  globalPicks: CuratedPlace[]
} = {
  hillStations: [
    { title: 'Munnar', region: 'India', category: 'Hills', state: 'Kerala', coords: { lat: 10.0889, lon: 77.0595 } },
    {
      title: 'Ooty',
      region: 'India',
      category: 'Hills',
      state: 'Tamil Nadu',
      coords: { lat: 11.4064, lon: 76.6932 },
      tagline: 'Tea gardens + misty lakes',
    },
    {
      title: 'Kodaikanal',
      region: 'India',
      category: 'Hills',
      state: 'Tamil Nadu',
      coords: { lat: 10.2381, lon: 77.4892 },
      tagline: 'Pine trails + viewpoints',
    },
    {
      title: 'Wayanad',
      region: 'India',
      category: 'Wildlife',
      state: 'Kerala',
      coords: { lat: 11.7152, lon: 76.132 },
      tagline: 'Forests + waterfalls',
    },
  ],
  keralaEscapes: [
    {
      title: 'Kochi',
      region: 'India',
      category: 'Cities',
      state: 'Kerala',
      coords: { lat: 9.9312, lon: 76.2673 },
      tagline: 'Art, cafés, Fort Kochi',
    },
    {
      title: 'Alappuzha',
      region: 'India',
      category: 'Backwaters',
      state: 'Kerala',
      coords: { lat: 9.4981, lon: 76.3388 },
      tagline: 'Houseboats + lagoons',
    },
    {
      title: 'Varkala',
      region: 'India',
      category: 'Beaches',
      state: 'Kerala',
      coords: { lat: 8.7379, lon: 76.7163 },
      tagline: 'Cliffside sunsets',
    },
    {
      title: 'Thekkady',
      region: 'India',
      category: 'Wildlife',
      state: 'Kerala',
      coords: { lat: 9.6033, lon: 77.161 },
      tagline: 'Periyar Tiger Reserve',
    },
  ],
  tamilNaduCulture: [
    {
      title: 'Madurai',
      region: 'India',
      category: 'Temples',
      state: 'Tamil Nadu',
      coords: { lat: 9.9252, lon: 78.1198 },
      tagline: 'Meenakshi Temple nights',
    },
    {
      title: 'Thanjavur',
      region: 'India',
      category: 'Heritage',
      state: 'Tamil Nadu',
      coords: { lat: 10.7867, lon: 79.1378 },
      tagline: 'Chola art + architecture',
    },
    {
      title: 'Mahabalipuram',
      region: 'India',
      category: 'Heritage',
      state: 'Tamil Nadu',
      coords: { lat: 12.6208, lon: 80.1934 },
      tagline: 'Stone temples by the sea',
    },
    {
      title: 'Chennai',
      region: 'India',
      category: 'Cities',
      state: 'Tamil Nadu',
      coords: { lat: 13.0827, lon: 80.2707 },
      tagline: 'Marina + food trails',
    },
  ],
  trendingIndia: [
    { title: 'Coorg', region: 'India', category: 'Hills', state: 'Karnataka', coords: { lat: 12.3375, lon: 75.8069 } },
    {
      title: 'Rameswaram',
      region: 'India',
      category: 'Temples',
      state: 'Tamil Nadu',
      coords: { lat: 9.2881, lon: 79.3129 },
      tagline: 'Island pilgrimage',
    },
    {
      title: 'Kanyakumari',
      region: 'India',
      category: 'Beaches',
      state: 'Tamil Nadu',
      coords: { lat: 8.0883, lon: 77.5385 },
      tagline: 'Sunrise at land’s end',
    },
    {
      title: 'Kumarakom',
      region: 'India',
      category: 'Backwaters',
      state: 'Kerala',
      coords: { lat: 9.6176, lon: 76.429 },
      tagline: 'Bird sanctuary + canals',
    },
  ],
  quickTrips: [
    { title: 'Pondicherry', region: 'India', category: 'Cities', state: 'Tamil Nadu', coords: { lat: 11.9416, lon: 79.8083 } },
    { title: 'Athirappilly Falls', region: 'India', category: 'Heritage', state: 'Kerala', coords: { lat: 10.2851, lon: 76.5698 } },
    { title: 'Yercaud', region: 'India', category: 'Hills', state: 'Tamil Nadu', coords: { lat: 11.7753, lon: 78.209 } },
    { title: 'Hampi', region: 'India', category: 'Heritage', state: 'Karnataka', coords: { lat: 15.335, lon: 76.46 } },
  ],
  globalPicks: [
    { title: 'Bali', region: 'Global', category: 'Beaches', country: 'Indonesia', coords: { lat: -8.4095, lon: 115.1889 } },
    { title: 'Kyoto', region: 'Global', category: 'Heritage', country: 'Japan', coords: { lat: 35.0116, lon: 135.7681 } },
    { title: 'Zermatt', region: 'Global', category: 'Hills', country: 'Switzerland', coords: { lat: 46.0207, lon: 7.7491 } },
    { title: 'Reykjavík', region: 'Global', category: 'Cities', country: 'Iceland', coords: { lat: 64.1466, lon: -21.9426 } },
  ],
}

