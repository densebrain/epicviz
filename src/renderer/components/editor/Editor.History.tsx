import * as CodeMirror from "codemirror"
import {getWorkspace} from "renderer/actions/WorkspaceActions"
import {stopEvent} from "renderer/util/Event"
import {getCommandManager} from "common/command-manager"
import getLogger from "common/log/Logger"

const log = getLogger(__filename)


export default function attachHistory(editor:CodeMirror.Editor):void {
  // HISTORY NAVIGATION
  let historyIndex = -1
  let navigatedHistory = false

  const navigateHistory = (editor: CodeMirror.Editor, event: KeyboardEvent): boolean => {
    const
      cursor = (editor as any).getCursor(),
      isLine0 = cursor.line === 0,
      history = getWorkspace().history,
      doc = editor.getDoc()

    if (navigatedHistory && !['ArrowUp', 'ArrowDown'].includes(event.key)) {
      navigatedHistory = false
      historyIndex = -1
    }

    if (event.key === "ArrowUp" && isLine0) {
      if (!navigatedHistory) {
        historyIndex = getWorkspace().history.length
      }

      if (historyIndex < 0) {
        return false
      }

      stopEvent(event)
      historyIndex = Math.max(0, historyIndex - 1)
      navigatedHistory = true

      const snippet = history[historyIndex]
      if (!snippet) {
        navigatedHistory = false
        historyIndex = -1
        return false
      }

      doc.setValue(snippet.code)
      return true
    }

    if (event.key === "ArrowDown" && navigatedHistory && historyIndex > -1) {
      historyIndex = Math.min(history.length, historyIndex + 1)
      navigatedHistory = true
      doc.undo()
      stopEvent(event)
      return true
    }

    return false
  }

  editor.on("keydown", (editor: CodeMirror.Editor, event: KeyboardEvent) => {
    if (navigateHistory(editor, event))
      return

    getCommandManager().onKeyDown(event)
  })
}
