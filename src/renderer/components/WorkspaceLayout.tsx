import * as React from "react"
import {useCallback, useEffect, useRef, useState} from "react"
import getLogger from "common/log/Logger"

import {
  CursorPointer,
  Fill,
  FillWidth,
  FlexAuto,
  FlexColumnCenter,
  FlexRowCenter,
  FlexScale,
  IThemedProperties,
  makeDimensionConstraints,
  makeHeightConstraint,
  makeMarginRem, makePadding,
  makePaddingRem,
  PositionRelative,
  rem, remToPx, StyleDeclaration
} from "renderer/styles/ThemedStyles"
import {VerticalSplitPane} from "renderer/components/elements/VerticalSplitPane"
import {AppActionFactory} from "common/store/actions/AppActionFactory"
import Header from "renderer/components/Header"
import {useCommandManager} from "renderer/command-manager-ui"
import {CommandContainerBuilder, ICommandContainerItems} from "common/command-manager"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import CommonElementIds from "renderer/CommonElements"
import {UIActionFactory} from "renderer/store/actions/UIActionFactory"
import {StringMap} from "common/Types"
import {makeSplitterSelector, projectDirSelector} from "renderer/store/selectors/UISelectors"
import {Workspace} from "common/models/Workspace"
import Repl from "renderer/components/Repl"
import {openWorkspaceFolder} from "renderer/actions/WorkspaceActions"
import {HorizontalSplitPane} from "renderer/components/elements/HorizontalSplitPane"
import ComponentBrowser from "renderer/components/ComponentBrowser"
import OutputView from "renderer/components/OutputView"
import {UISplitterNames} from "renderer/store/state/UIState"

const AvatarDefaultURL = require("renderer/assets/images/avatar-default.png")

const log = getLogger(__filename)

type Classes = "root" | "container"

function baseStyles(theme: Theme): StyleDeclaration<Classes> {
  const
    {palette, components: {WorkspaceLayout}} = theme,
    {action, notifications, primary, secondary, background} = palette

  return {
    root: {
      ...Fill,
      ...FlexColumnCenter,
      ...makePadding(remToPx(2),0,0,0),
      background: theme.background.global,
    },
    container: {...PositionRelative, ...FlexScale, ...FillWidth}
  }
}

interface P extends IThemedProperties<Classes> {

}

interface SP {
  splitter: number | string
  projectDir: string
  workspace: Workspace | null
}

const selectors = {
  splitter: makeSplitterSelector("repl"),
  projectDir: projectDirSelector,
  workspace: (state: IRootRendererState) => state.UIState.workspace
}

const appActions = new AppActionFactory()
const uiActions = new UIActionFactory()

export default StyledComponent<P, SP>(baseStyles, selectors)(function (props: P & SP): React.ReactElement<P & SP> {
  const
    {classes, splitter, workspace, projectDir} = props,
    rootRef = useRef<any>(null),
    containerRef = useRef<any>(null),
    id = CommonElementIds.App,
    //{props:CommandManagerProps} = useCommandManager(id,builder => builder.make(),containerRef),
    [value, setValue] = useState<string>(""),
    [value2, setValue2] = useState<string>(""),
    {props: commandManagerProps} = useCommandManager(
      id,
      useCallback((builder: CommandContainerBuilder): ICommandContainerItems =>
          builder.make()
        , []),
      rootRef
    )


  useEffect(() => {
    if (!projectDir || projectDir.isEmpty()) {
      openWorkspaceFolder()
    }
  }, [projectDir])


  const onSplitterChange = useCallback((newSize: number): void => {
    uiActions.setSplitter("repl", newSize)
  }, [])


  return projectDir.isEmpty() ? null : <div
    ref={rootRef}
    className={classes.root}
    tabIndex={-1}
    {...commandManagerProps}
  >
    <Header/>
    <div className={classes.container}>
      {workspace &&
      <VerticalSplitPane
        defaultSize={splitter}
        primary="first"
        onChanged={onSplitterChange}
      >
        <Repl/>
        <div>
          <HorizontalSplitPane
            defaultSize={"50%"}
            maxSize="70%"
            primary="first"
          >
            <ComponentBrowser/>
            <OutputView />
          </HorizontalSplitPane>
        </div>
        {/*<CodeMirrorEditor file="" value={value2} onValueChange={setValue2} />*/}
        {/*<MonacoEditor path="/1" value={value} onValueChange={newValue => setValue(newValue)}/>*/}
        {/*<MonacoEditor path="/2" value={value2} onValueChange={newValue => setValue2(newValue)}/>*/}
        {/*minSize={notificationsOpen ? 300 : 0}
        maxSize={notificationsOpen ? "50%" : 0}*/}

        {/*<NotificationList />*/}
      </VerticalSplitPane>}
    </div>
  </div>

})

