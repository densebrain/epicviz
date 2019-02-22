import * as React from "react"
import {useCallback, useEffect, useRef, useState} from "react"
import getLogger from "common/log/Logger"
import {
  Fill,
  FillWidth,
  FlexColumn,
  FlexScale,
  IThemedProperties,
  OverflowAuto,
  StyleDeclaration
} from "renderer/styles/ThemedStyles"
import {Selectors, StyledComponent} from "renderer/components/elements/StyledComponent"
import * as classNames from "classnames"
import * as Path from "path"
import Editor from "renderer/components/editor/Editor"
import {StringMap} from "common/Types"
import {Workspace} from "common/models/Workspace"
import {projectDirSelector} from "renderer/store/selectors/UISelectors"
import {UIActionFactory} from "renderer/store/actions/UIActionFactory"
import {useCommandManager} from "renderer/command-manager-ui"
import {CommandContainerBuilder, ICommandContainerItems} from "common/command-manager"
import {guard} from "typeguard"
import CommonElementIds from "renderer/CommonElements"
import {focusRepl, getWorkspace, runWorkspace} from "renderer/actions/WorkspaceActions"
import ReplSnippet from "renderer/components/ReplSnippet"
import ResizeAware from 'react-resize-aware'
import EventListener, {withOptions} from 'react-event-listener'

const log = getLogger(__filename)

type Classes = "root" | "history"

function baseStyles(theme: Theme): StyleDeclaration<Classes> {
  const
    {palette} = theme,
    {primary, secondary} = palette

  return {
    root: {
      ...Fill,
      ...FlexColumn,
      background: primary["400"]
    },
    history: {
      ...FlexScale,
      ...FillWidth,
      ...OverflowAuto
    }
  }
}

interface P extends IThemedProperties<Classes> {

}

interface SP {
  splitters: StringMap<number | string>
  projectDir: string
  workspace: Workspace | null
}

const selectors = {
  projectDir: projectDirSelector,
  workspace: (state:IRootRendererState) => state.UIState.workspace
} as Selectors<P, SP>

export default StyledComponent<P, SP>(baseStyles, selectors)(function Repl(props: SP & P): React.ReactElement<P> {
  const
    {classes,workspace,projectDir} = props,
    [historyHeight,setHistoryHeight] = useState<number>(0),
    rootRef = useRef<HTMLDivElement>(null),
    historyRef = useRef<HTMLDivElement>(null),
    [scrollAuto,setScrollAuto] = useState<boolean>(true),
    id = CommonElementIds.Repl,
    setSnippetCode = useCallback((code:string) => {
      new UIActionFactory().patchSnippet({code})
    },[]),
    {props: commandManagerProps} = useCommandManager(
      id,
      useCallback((builder: CommandContainerBuilder): ICommandContainerItems => {
        return builder
          .command(
            "CommandOrControl+Enter",
            (cmd, event) => guard(() => {
              log.info("Repl - enter pressed, execute")
              runWorkspace(getWorkspace())
            }),
            {
              name: "Execute current repl code",
              hidden: false,
              overrideInput: true
            }
          )
          .make()
      }, []),
      rootRef
    ),
    handleResize = useCallback(({height}) => {
      setHistoryHeight(height)
    }, [])



  // AUTO SCROLL
  useEffect(() => {
    //log.info("history height",historyHeight,scrollAuto)
    if (!historyRef.current || !scrollAuto || !historyHeight) return
    const historyContent = document.getElementById("history")
    historyRef.current.scrollTo(0,historyContent.scrollHeight)
  },[scrollAuto, historyHeight, historyRef.current,workspace])

  return <div
    ref={rootRef}
    className={classNames(classes.root, {})}
    tabIndex={-1}
    {...commandManagerProps}
  >
    <EventListener
      target="window"
      onFocus={focusRepl}
    />

    <div ref={historyRef} className={classes.history}>
      <ResizeAware
        id="history"
        style={{ ...FillWidth, ...FlexColumn, position: 'relative' }}
        onlyEvent
        onResize={handleResize}
      >
        {workspace.history.map(snippet =>
          <ReplSnippet key={snippet.id} snippet={snippet} />
        )}
      </ResizeAware>
    </div>
    <Editor
      id="repl-input"
      autoFocus
      file={!projectDir ? null : Path.resolve(projectDir, `${workspace.snippet.id}.js`)}
      value={workspace.snippet.code}
      onValueChange={setSnippetCode}
    />
  </div>
})
