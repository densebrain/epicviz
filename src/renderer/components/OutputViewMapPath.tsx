import "!!style-loader!css-loader!leaflet/dist/leaflet.css"
import * as L from 'leaflet'
//$(iframe.contentDocument.head).append($('<link rel="stylesheet" href="https://unpkg.com/leaflet@1.4.0/dist/leaflet.css" integrity="sha512-puBpdR0798OZvTTbP4A8Ix/l+A4dHDD0DGqYW6RQ+9jxkRFclaxxQb/SJAWZfWAkuyeQUytO7+7N4QKrDh+drA==" crossorigin=""/>'))

import * as React from "react"
import getLogger from "common/log/Logger"
import {Fill, IThemedProperties, NestedStyles, StyleDeclaration} from "renderer/styles/ThemedStyles"
import {Selectors, StyledComponent} from "renderer/components/elements/StyledComponent"
import * as classNames from "classnames"
import Tabs from "@material-ui/core/Tabs/Tabs"
import AppBar from "@material-ui/core/AppBar/AppBar"
import Tab from "@material-ui/core/Tab/Tab"
import {useCallback, useEffect, useRef, useState} from "react"
import {IOutput, OutputType, Workspace} from "common/models/Workspace"

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
    const osm = new L.TileLayer(osmUrl, {minZoom: 4, maxZoom: 20, attribution: osmAttrib});

    setMap(() => {
      const map = L.map(mapWrapperRef.current)
      map.setView([40.7,-74],16)
      map.addLayer(osm)
      return map
    })

  },[mapWrapperRef.current])

  useEffect(() => {
    if (!map) return

    const allPoints = Array<L.LatLngTuple>()

    dataSets.forEach(data => {
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
    })

    map.fitBounds(allPoints)
    //map.setView(new L.LatLng(config.center[0],config.center[1]), config.zoom)

  },[dataSets,map])


  return <div className={classes.root}>
    <div ref={mapWrapperRef} className={classes.map}/>
  </div>
})
