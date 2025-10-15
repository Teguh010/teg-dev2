import { useEffect, useRef } from 'react'

export const HereMap = ({
  lat = null,
  lon = null,
  zoom = 15,
  width = '100%',
  height = '500px',
  locations = [],
}) => {
  const mapRef = useRef(null)
  const eiffelIcon = 'https://cdn3.iconfinder.com/data/icons/tourism/eiffel200.png'

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const H = window.H
      const platform = new H.service.Platform({
        apikey: process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN,
      })
      const defaultLayers = platform.createDefaultLayers()
      const pixelRatio = window.devicePixelRatio || 1
      const pngIcon = new H.map.Icon(eiffelIcon, { size: { w: 56, h: 56 } })

      let map

      if (locations.length > 0) {
        const latitudes = locations.map((location) => location.lat)
        const longitudes = locations.map((location) => location.lon)
        const bounds = new H.geo.Rect(
          Math.min(...latitudes),
          Math.min(...longitudes),
          Math.max(...latitudes),
          Math.max(...longitudes)
        )

        map = new H.Map(mapRef.current, defaultLayers.vector.normal.map, {
          bounds,
          zoom,
          pixelRatio,
        })

        locations.forEach((location) => {
          const marker = new H.map.Marker(
            { lat: location.lat, lng: location.lon },
            { icon: pngIcon }
          )
          map.addObject(marker)
        })

        map.getViewModel().setLookAtData({ bounds })
      } else {
        const initialCenter = { lat, lng: lon }

        map = new H.Map(mapRef.current, defaultLayers.vector.normal.map, {
          center: initialCenter,
          zoom,
          pixelRatio,
        })

        const initialMarker = new H.map.Marker(initialCenter, { icon: pngIcon })
        map.addObject(initialMarker)
      }

      const mapEvents = new H.mapevents.MapEvents(map)
      new H.mapevents.Behavior(mapEvents)
      H.ui.UI.createDefault(map, defaultLayers)

      return () => {
        map.dispose()
      }
    }
  }, [lat, lon, zoom, locations])

  return <div ref={mapRef} style={{ width, height }} />
}
