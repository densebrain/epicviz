import "!!style-loader!css-loader!leaflet/dist/leaflet.css"
import * as L from 'leaflet'
import * as React from "react"
import {useEffect, useRef, useState} from "react"
import getLogger from "common/log/Logger"
import {Fill, IThemedProperties, StyleDeclaration} from "renderer/styles/ThemedStyles"
import {Selectors, StyledComponent} from "renderer/components/elements/StyledComponent"
import {IOutput, Workspace} from "common/models/Workspace"
//import Plotly, {PlotlyHTMLElement} from "plotly.js"
//$(iframe.contentDocument.head).append($('<link rel="stylesheet" href="https://unpkg.com/leaflet@1.4.0/dist/leaflet.css" integrity="sha512-puBpdR0798OZvTTbP4A8Ix/l+A4dHDD0DGqYW6RQ+9jxkRFclaxxQb/SJAWZfWAkuyeQUytO7+7N4QKrDh+drA==" crossorigin=""/>'))

const log = getLogger(__filename)

type Classes = "root" | "plot"

function baseStyles(theme: Theme): StyleDeclaration<Classes> {
  const
    {palette} = theme,
    {primary, secondary} = palette

  return {
    root: {
      ...Fill
    },
    plot: {
      ...Fill
    }
  }
}

interface P extends IThemedProperties<Classes> {
  output:IOutput<"plot-2d">
}

interface SP {
  workspace:Workspace
}

const selectors = {
  workspace: (state:IRootRendererState) => state.UIState.workspace
} as Selectors<P, SP>


export default StyledComponent<P, SP>(baseStyles, selectors,{withTheme:true})(function OutputViewPlot2D(props: SP & P): React.ReactElement<P> {
  const
    {classes,workspace,output,theme} = props,
    {dataSets} = output,
    plotWrapperRef = useRef<HTMLDivElement>(null),
    [plot,setPlot] = useState<Plotly.PlotlyHTMLElement>(null)

  useEffect(() => {
    if (!plotWrapperRef.current) return

    const data = dataSets
      .map(({config,rows}) => {
        let data:Plotly.Data | null = null
        switch(config.type) {
          case "bar":
            data = {
              x: rows.map(it => it.x),
              y: rows.map(it => it.y),
              type: config.type
            }
            break
        }
        return data
      })
      .filterNotNull()

    Plotly.newPlot(plotWrapperRef.current, data)
      .then(newPlot => setPlot(newPlot))
      .catch(err => log.error("Unable to plot",err))

  },[dataSets,plotWrapperRef.current])


  return <div className={classes.root}>
    <div ref={plotWrapperRef} className={classes.plot}/>
  </div>
})
