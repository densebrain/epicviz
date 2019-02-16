import * as React from "react"
import getLogger from "common/log/Logger"
import {Fill, IThemedProperties, NestedStyles, OverflowAuto, StyleDeclaration} from "renderer/styles/ThemedStyles"
import {Selectors, StyledComponent} from "renderer/components/elements/StyledComponent"
import * as classNames from "classnames"
import * as Path from "path"
import CodeMirrorEditor from "renderer/components/editor/CodeMirrorEditor"
import {StringMap} from "common/Types"
import {Workspace} from "common/models/Workspace"
import {projectDirSelector} from "renderer/store/selectors/UISelectors"
import {useCallback} from "react"
import {UIActionFactory} from "renderer/store/actions/UIActionFactory"
import {useCommandManager} from "renderer/command-manager-ui"
import {CommandContainerBuilder, CommandType, ICommandContainerItems} from "common/command-manager"
import {guard} from "typeguard"
import EventHub from "common/events/Event"
import {areDialogsOpen} from "renderer/util/UIHelper"
import {useRef} from "react"
import CommonElementIds from "renderer/CommonElements"
import {getWorkspace, runWorkspace} from "renderer/actions/WorkspaceActions"
import ReplSnippet from "renderer/components/ReplSnippet"

const log = getLogger(__filename)

type Classes = "root"

function baseStyles(theme: Theme): StyleDeclaration<Classes> {
  const
    {palette} = theme,
    {primary, secondary} = palette

  return {
    root: {
      ...Fill,
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
    rootRef = useRef<any>(null),
    id = CommonElementIds.Repl,
    setSnippetCode = useCallback((code:string) => {
      new UIActionFactory().patchSnippet({code})
    },[]),
    {props: commandManagerProps} = useCommandManager(
      id,
      useCallback((builder: CommandContainerBuilder): ICommandContainerItems => {
        return builder
          .command(
            "Enter",
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
    )

  return <div
    ref={rootRef}
    className={classNames(classes.root, {})}
    tabIndex={-1}
    {...commandManagerProps}
  >
    {workspace.history.map(snippet => <ReplSnippet key={snippet.id} snippet={snippet} />)}

    <CodeMirrorEditor
      file={!projectDir ? null : Path.resolve(projectDir, `${workspace.snippet.id}.js`)}
      value={workspace.snippet.code} onValueChange={setSnippetCode}
    />
  </div>
})
