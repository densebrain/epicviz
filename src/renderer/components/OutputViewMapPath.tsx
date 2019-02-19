import * as React from "react"
import getLogger from "common/log/Logger"
import {Fill, IThemedProperties, NestedStyles, StyleDeclaration} from "renderer/styles/ThemedStyles"
import {Selectors, StyledComponent} from "renderer/components/elements/StyledComponent"
import * as classNames from "classnames"
import Tabs from "@material-ui/core/Tabs/Tabs"
import AppBar from "@material-ui/core/AppBar/AppBar"
import Tab from "@material-ui/core/Tab/Tab"
import {useCallback, useRef, useState} from "react"
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
  output:IOutput
}

interface SP {
  workspace:Workspace
}

const selectors = {
  workspace: (state:IRootRendererState) => state.UIState.workspace
} as Selectors<P, SP>


export default StyledComponent<P, SP>(baseStyles, selectors)(function OutputViewMapPath(props: SP & P): React.ReactElement<P> {
  const
    {classes,workspace,output} = props,
    {dataSets} = output,
    mapRef = useRef<HTMLDivElement>(null)
  
  return <div className={classes.root}>
    <div ref={mapRef} className={classes.map}/>
  </div>
})
