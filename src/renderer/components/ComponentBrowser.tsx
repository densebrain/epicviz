///<reference path="../../../node_modules/tsx-control-statements/index.d.tsx"/>
import * as React from "react"
import getLogger from "common/log/Logger"
import {
  Fill,
  FlexColumn, FlexScale,
  IThemedProperties,
  NestedStyles,
  PositionRelative,
  StyleDeclaration
} from "renderer/styles/ThemedStyles"
import {Selectors, StyledComponent} from "renderer/components/elements/StyledComponent"
import * as classNames from "classnames"
import Tabs from "@material-ui/core/Tabs/Tabs"
import AppBar from "@material-ui/core/AppBar/AppBar"
import Tab from "@material-ui/core/Tab/Tab"
import {useCallback, useState} from "react"


import ComponentSnippets from "renderer/components/ComponentSnippets"
import {hot} from "react-hot-loader/root"
import {makeTabSelector} from "renderer/store/selectors/UISelectors"
import {UIActionFactory} from "renderer/store/actions/UIActionFactory"

const log = getLogger(__filename)

type Classes = "root" | "content"

function baseStyles(theme: Theme): StyleDeclaration<Classes> {
  const
    {palette,components:{List}} = theme,
    {primary, secondary} = palette

  return {
    root: {
      ...Fill,
      ...FlexColumn
    },
    content: {
      ...PositionRelative,
      ...FlexScale,
      background: List.colors.background
    }
  }
}

interface P extends IThemedProperties<Classes> {

}

interface SP {
  tab: number
}

const selectors = {
  tab: makeTabSelector("components")
} as Selectors<P, SP>

type TabValue = "data" | "sources" | "loaders" | "snippets"

const TabComponents:{[key in TabValue]:() => React.ReactElement} = {
  data: () => <div/>,
  sources: () => <div/>,
  loaders: () => <div/>,
  snippets: () => <ComponentSnippets />
}

const ComponentBrowser = StyledComponent<P, SP>(baseStyles, selectors)(function ComponentBrowser(props: SP & P): React.ReactElement<P> {
  const
    {classes,tab} = props,
    Content = TabComponents[tab] || (():React.ReactElement => <div/>),
    setTab = useCallback((e,tab) => {
      new UIActionFactory().setTab("components",tab)
    },[])

  return <div className={classes.root}>
    <AppBar position="static" color="default">
      <Tabs
        value={tab}
        onChange={setTab}
        indicatorColor="primary"
        textColor="secondary"
        scrollButtons="auto"
      >
        <Tab value="data" label="Data" />
        <Tab value="sources" label="Sources" />
        <Tab value="loaders" label="Loaders" />
        <Tab value="snippets" label="Snippets" />
      </Tabs>
    </AppBar>
    <div className={classes.content}>
      <Content/>
    </div>
  </div>
})

export default ComponentBrowser
