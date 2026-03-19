import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet'
import type { ReactNode } from 'react'
import { useAppStore } from '../../store/useAppStore'

export type MapMarker = {
  id: string
  lat: number
  lon: number
  label: string
  details?: ReactNode
}

export function LeafletMap({
  center,
  zoom,
  markers,
  heightClassName,
  onClick,
}: {
  center: { lat: number; lon: number }
  zoom: number
  markers: MapMarker[]
  heightClassName?: string
  onClick?: (coords: { lat: number; lon: number }) => void
}) {
  const theme = useAppStore((s) => s.theme)
  const mapStyle = useAppStore((s) => s.mapStyle)
  const toggleMapStyle = useAppStore((s) => s.toggleMapStyle)
  const tile = getTileConfig({ theme, mapStyle })

  return (
    <div className={(heightClassName ?? 'h-[420px]') + ' relative'}>
      <MapContainer
        center={[center.lat, center.lon]}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-white/10"
      >
        <TileLayer attribution={tile.attribution} url={tile.url} />
        <ClickHandler onClick={onClick} />
        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lon]}>
            <Popup>
              <div className="space-y-1">
                <div className="text-sm font-semibold">{m.label}</div>
                {m.details}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="absolute right-3 top-3 z-[1000]">
        <button
          onClick={toggleMapStyle}
          className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-white dark:border-white/10 dark:bg-base-950/80 dark:text-white dark:hover:bg-base-950"
          type="button"
        >
          {mapStyle === 'satellite' ? 'Satellite' : 'Standard'}
        </button>
      </div>
    </div>
  )
}

function ClickHandler({ onClick }: { onClick?: (coords: { lat: number; lon: number }) => void }) {
  useMapEvents({
    click(e) {
      onClick?.({ lat: e.latlng.lat, lon: e.latlng.lng })
    },
  })
  return null
}

function getTileConfig(input: { theme: 'dark' | 'light'; mapStyle: 'standard' | 'satellite' }) {
  const key = import.meta.env.VITE_MAPTILER_KEY as string | undefined
  const styleLight = (import.meta.env.VITE_MAPTILER_STYLE_LIGHT as string | undefined) ?? 'streets-v2'
  const styleDark = (import.meta.env.VITE_MAPTILER_STYLE_DARK as string | undefined) ?? styleLight
  const styleSatellite = (import.meta.env.VITE_MAPTILER_STYLE_SATELLITE as string | undefined) ?? 'hybrid-v4'

  const style =
    input.mapStyle === 'satellite' ? styleSatellite : input.theme === 'dark' ? styleDark : styleLight

  if (key) {
    return {
      url: `https://api.maptiler.com/maps/${style}/256/{z}/{x}/{y}.png?key=${key}`,
      attribution:
        '<a href="https://www.maptiler.com/copyright/" target="_blank" rel="noreferrer">&copy; MapTiler</a> ' +
        '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">&copy; OpenStreetMap contributors</a>',
    }
  }

  return {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }
}
