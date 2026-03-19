import L from 'leaflet'

export function initLeafletIcons() {
  const anyL = L as unknown as {
    Icon: typeof L.Icon & { Default: typeof L.Icon.Default & { mergeOptions: (opts: any) => void } }
  }

  delete (anyL.Icon.Default.prototype as any)._getIconUrl
  anyL.Icon.Default.mergeOptions({
    iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString(),
    iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString(),
    shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString(),
  })
}

