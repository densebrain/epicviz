import * as React from "react"
import getLogger from "common/log/Logger"
import {
  Fill, FillWidth,
  FlexColumn,
  FlexScale,
  IThemedProperties,
  NestedStyles, PositionRelative,
  StyleDeclaration
} from "renderer/styles/ThemedStyles"
import {Selectors, StyledComponent} from "renderer/components/elements/StyledComponent"
import * as classNames from "classnames"
import Tabs from "@material-ui/core/Tabs/Tabs"
import AppBar from "@material-ui/core/AppBar/AppBar"
import Tab from "@material-ui/core/Tab/Tab"
import {useCallback, useEffect, useState} from "react"
import {OutputType, Workspace} from "common/models/Workspace"
import OutputViewMapPath from "renderer/components/OutputViewMapPath"

const log = getLogger(__filename)

type Classes = "root" | "content"

function baseStyles(theme: Theme): StyleDeclaration<Classes> {
  const
    {palette} = theme,
    {primary, secondary} = palette

  return {
    root: {
      ...Fill,
      ...FlexColumn,
      ...PositionRelative
    },
    content: {
      ...FlexScale,
      ...PositionRelative,
      ...FillWidth
    }
  }
}

interface P extends IThemedProperties<Classes> {

}

interface SP {
  workspace:Workspace
}

const selectors = {
  workspace: (state:IRootRendererState) => state.UIState.workspace
} as Selectors<P, SP>


export default StyledComponent<P, SP>(baseStyles, selectors)(function OutputView(props: SP & P): React.ReactElement<P> {
  const
    {classes,workspace} = props,
    [tab,setTab] = useState<number>(0),
    output = workspace.outputs[tab]

  useEffect(() => {
    const {outputs} = workspace
    setTab(Math.max(outputs.length - 1,0))
    // if (tab >= outputs.length || tab < 0)
    //   setTab(0)
  },[workspace.outputs])

  return <div className={classes.root}>
    <AppBar position="static" color="default">
      <Tabs
        value={tab}
        onChange={(e, tab) => setTab(tab)}
        indicatorColor="primary"
        textColor="secondary"
        scrollButtons="auto"
      >
        {workspace.outputs.map((output,index) =>
          <Tab key={output.id} value={index} label={output.name} />
        )}

      </Tabs>
    </AppBar>
    <div className={classes.content}>
      {output && (
        output.type === "map-path" ?
          <OutputViewMapPath output={output} /> :
          null
      )}
    </div>
  </div>
})
