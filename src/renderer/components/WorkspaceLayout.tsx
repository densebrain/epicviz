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
  makeMarginRem,
  makePaddingRem,
  PositionRelative,
  rem
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
import {projectDirSelector} from "renderer/store/selectors/UISelectors"
import {Workspace} from "common/models/Workspace"
import Repl from "renderer/components/Repl"
import {openWorkspaceFolder} from "renderer/actions/WorkspaceActions"
import {HorizontalSplitPane} from "renderer/components/elements/HorizontalSplitPane"
import ComponentBrowser from "renderer/components/ComponentBrowser"
import OutputView from "renderer/components/OutputView"

const AvatarDefaultURL = require("renderer/assets/images/avatar-default.png")

const log = getLogger(__filename)

function baseStyles(theme: Theme): any {
  const
    {palette, components: {IssuesLayout}} = theme,
    {action, notifications, primary, secondary, background} = palette

  return {
    root: {
      ...Fill,
      ...FlexColumnCenter,
      background: theme.background.global,

      "& .enable": {
        "& .repo": {
          ...makePaddingRem(0, 1),
          borderRadius: rem(0.5),
          background: IssuesLayout.colors.bg
        },
        "& .button": {
          ...makeMarginRem(2),
          "& .icon": {
            ...makeDimensionConstraints(rem(4)),
            fontSize: rem(6)
          }
        }
      }
    },
    header: {
      ...FlexAuto
    },
    controls: {
      ...FlexRowCenter,
      ...FlexAuto,
      ...PositionRelative,
      background: IssuesLayout.colors.controlsBg,
      "& img, & .notificationsButton": {
        ...makeDimensionConstraints(rem(2)),
        ...makePaddingRem(0)
      },
      "&:hover, &.open": {
        ...CursorPointer,
        background: IssuesLayout.colors.controlsBgHover
      },
      "& .notificationsButton": {
        ...PositionRelative,
        ...makeHeightConstraint(rem(2)),
        borderRadius: 0,
        "&.unread": {
          backgroundColor: notifications.main,
          "& svg": {
            fontSize: rem(0.6)
          }
        },
        "& svg": {
          fontSize: rem(1)
        },
        "& .badge": {
          //...makePaddingRem(0.2,0.3)
        }
      }
    },
    content: {...FlexScale, ...FlexColumnCenter, ...PositionRelative, ...Fill, ...FillWidth},
    container: {...PositionRelative, ...FlexScale, ...FillWidth}
  }
}

interface P extends IThemedProperties {

}

interface SP {
  splitters: StringMap<number | string>
  projectDir: string
  workspace: Workspace | null
}

const selectors = {
  splitters: (state: IRootRendererState) => state.UIState.splitters,
  projectDir: projectDirSelector,
  workspace: (state: IRootRendererState) => state.UIState.workspace
}

const appActions = new AppActionFactory()
const uiActions = new UIActionFactory()

export default StyledComponent<P, SP>(baseStyles, selectors)(function (props: P & SP): React.ReactElement<P & SP> {
  const
    {classes, splitters, workspace, projectDir} = props,
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


  const onSplitterChange = useCallback((splitterId: string) => (newSize: number): void => {
    uiActions.setSplitter(splitterId, newSize)
  }, [])


  return <div
    ref={rootRef}
    className={classes.root}
    tabIndex={-1}
    {...commandManagerProps}
  >
    <Header/>
    <div className={classes.container}>
      {workspace &&
      <VerticalSplitPane
        defaultSize={"50%"}
        primary="first"
      >
        <Repl/>
        <div>
          <HorizontalSplitPane
            defaultSize={"50%"}
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

