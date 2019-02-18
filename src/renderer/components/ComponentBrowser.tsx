import * as React from "react"
import getLogger from "common/log/Logger"
import {Fill, IThemedProperties, NestedStyles, StyleDeclaration} from "renderer/styles/ThemedStyles"
import {Selectors, StyledComponent} from "renderer/components/elements/StyledComponent"
import * as classNames from "classnames"
import Tabs from "@material-ui/core/Tabs/Tabs"
import AppBar from "@material-ui/core/AppBar/AppBar"
import Tab from "@material-ui/core/Tab/Tab"
import {useCallback, useState} from "react"

const log = getLogger(__filename)

type Classes = "root" | "content"

function baseStyles(theme: Theme): StyleDeclaration<Classes> {
  const
    {palette} = theme,
    {primary, secondary} = palette

  return {
    root: {
      ...Fill
    },
    content: {}
  }
}

interface P extends IThemedProperties<Classes> {

}

interface SP {
}

const selectors = {} as Selectors<P, SP>

type TabValue = "data" | "sources" | "loaders"

export default StyledComponent<P, SP>(baseStyles, selectors)(function ComponentBrowser(props: SP & P): React.ReactElement<P> {
  const
    {classes} = props,
    [tab,setTab] = useState<TabValue>("data")

  return <div className={classes.root}>
    <AppBar position="static" color="default">
      <Tabs
        value={tab}
        onChange={(e, tab) => setTab(tab)}
        indicatorColor="primary"
        textColor="secondary"
        scrollButtons="auto"
      >
        <Tab value="data" label="Data" />
        <Tab value="sources" label="Sources" />
        <Tab value="loaders" label="Loaders" />
      </Tabs>
    </AppBar>
    <div className={classes.content}>

    </div>
  </div>
})
