import "!!style-loader!css-loader!leaflet/dist/leaflet.css"
import * as L from 'leaflet'
import * as React from "react"
import {useEffect, useRef, useState} from "react"
import getLogger from "common/log/Logger"
import {Fill, IThemedProperties, StyleDeclaration} from "renderer/styles/ThemedStyles"
import {Selectors, StyledComponent} from "renderer/components/elements/StyledComponent"
import {IOutput, Workspace} from "common/models/Workspace"
//$(iframe.contentDocument.head).append($('<link rel="stylesheet" href="https://unpkg.com/leaflet@1.4.0/dist/leaflet.css" integrity="sha512-puBpdR0798OZvTTbP4A8Ix/l+A4dHDD0DGqYW6RQ+9jxkRFclaxxQb/SJAWZfWAkuyeQUytO7+7N4QKrDh+drA==" crossorigin=""/>'))

const log = getLogger(__filename)

type Classes = "root" | "map"

function baseStyles(theme: Theme): StyleDeclaration<Classes> {
  const
    {palette} = theme,
    {primary, secondary} = palette

  return {
    root: {
      ...Fill
    },
    map: {
      ...Fill
    }
  }
}

interface P extends IThemedProperties<Classes> {
  output:IOutput<"map-path">
}

interface SP {
  workspace:Workspace
}

const selectors = {
  workspace: (state:IRootRendererState) => state.UIState.workspace
} as Selectors<P, SP>


export default StyledComponent<P, SP>(baseStyles, selectors,{withTheme:true})(function OutputViewMapPath(props: SP & P): React.ReactElement<P> {
  const
    {classes,workspace,output,theme} = props,
    {dataSets} = output,
    mapWrapperRef = useRef<HTMLDivElement>(null),
    [map,setMap] = useState<L.Map>(null)

  useEffect(() => {
    if (!mapWrapperRef.current || map) return

    const osmUrl='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const osmAttrib='Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors';
    const osm = new L.TileLayer(osmUrl, {minZoom: 4, maxZoom: 19, attribution: osmAttrib});

    setMap(() => {
      const map = L.map(mapWrapperRef.current)
      map.setView([40.7,-74],16)
      map.addLayer(osm)
      return map
    })

  },[mapWrapperRef.current])

  useEffect(() => {
    if (!map) return () => {}

    const allPoints = Array<L.LatLngTuple>()
    //map.eachLayer(layer => map.remove())
    const lines = dataSets.map(data => {
      const
        {rows,config:providedConfig} = data,
        config = {
          center: [-0.09,51.505],
          zoom: 17,
          color: theme.palette.action.main,
          ...providedConfig
        },
        points = rows.map(row => [row.latitude,row.longitude] as L.LatLngTuple)

      allPoints.push(...points)

      log.info("Points",points)
      const line = new L.Polyline(points,{color: config.color})
      line.addTo(map)
      return line
    })

    const markers = allPoints.map(point => {
      const marker = new L.CircleMarker(point,{
        color: "#FF0000",
        fillColor: "#FF0000",
        radius: 1
      })
      marker.addTo(map)
      return marker
    })

    map.fitBounds(allPoints)
    //map.setView(new L.LatLng(config.center[0],config.center[1]), config.zoom)
    return () => {
      lines.forEach(line => line.removeFrom(map))
      markers.forEach(marker => marker.removeFrom(map))
    }
  },[dataSets,map])


  return <div className={classes.root}>
    <div ref={mapWrapperRef} className={classes.map}/>
  </div>
})
