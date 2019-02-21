import * as React from "react"
import getLogger from "common/log/Logger"
import {
  Fill, FillWidth,
  FlexColumn, FlexColumnCenter,
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
import {useCallback, useEffect, useRef, useState} from "react"
import {OutputType, Workspace} from "common/models/Workspace"
import OutputViewMapPath from "renderer/components/OutputViewMapPath"
import OutputViewPlot2D from "renderer/components/OutputViewPlot2D"
import ReplOutput from "./output/ReplOutput"

const log = getLogger(__filename)

type Classes = "root" | "content" | "errorWrapper"

function baseStyles(theme: Theme): StyleDeclaration<Classes> {
  const
    {palette} = theme,
    {primary, secondary} = palette,
    error = theme.components.OutputViewErrorBoundary

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
    },
    errorWrapper: {
      ...FlexColumnCenter,
      ...Fill,
      ...FillWidth,
      backgroundColor: error.colors.bg,
      color: error.colors.text
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
    errorRef = useRef<OutputViewErrorBoundary>(null),
    output = workspace.outputs[tab]

  useEffect(() => {
    const {outputs} = workspace
    setTab(Math.max(outputs.length - 1,0))
    // if (tab >= outputs.length || tab < 0)
    //   setTab(0)
  },[workspace.outputs])

  useEffect(() => {
    if (errorRef.current)
      errorRef.current.clearError()
  },[errorRef.current,tab])

  return <div className={classes.root}>
    <AppBar position="static" color="primary">
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
      {/* WRAPPED IN ERROR BOUNDARY IN CASE BAD DATA IS PROVIDED*/}
      <OutputViewErrorBoundary ref={errorRef} classes={classes}>
        {output && (
          output.type === "map-path" ?
            <OutputViewMapPath output={output} /> :
            output.type === "plot-2d" ?
              <OutputViewPlot2D output={output} /> :
            null
        )}
      </OutputViewErrorBoundary>
    </div>
  </div>
})

interface IErrorProps extends IThemedProperties<Classes> {

}

interface IErrorState {
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

class OutputViewErrorBoundary extends React.Component<IErrorProps,IErrorState> {

  constructor(props) {
    super(props)

    this.state = {
      error: null,
      errorInfo: null
    }
  }

  static renderError({classes}:IErrorProps, error: Error, errorInfo: React.ErrorInfo): React.ReactNode {
    return <div className={classes.errorWrapper}>
      {ReplOutput.transformObject(error)}
    </div>
  }

  static getDerivedStateFromError(error:Error | null):Partial<IErrorState> {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({error, errorInfo})
  }

  clearError():void {
    this.setState({
      error:null,
      errorInfo:null
    })
  }

  render(): React.ReactNode {
    const
      {error,errorInfo} = this.state,
      {children} = this.props

    return error ? OutputViewErrorBoundary.renderError(this.props,error,errorInfo) : <>{children}</>
  }
}
