import * as CodeMirror from "codemirror"

export default function attachInput(editor:CodeMirror.Editor):void {

  editor.on("cursorActivity", function (editor:CodeMirror.Editor) {
    CodeMirror.signal(editor,"epicUpdateArgHints")
  })

  editor.setOption("extraKeys", {
    "Ctrl-Space": function (editor:CodeMirror.Editor) {
      CodeMirror.signal(editor,"epicShowCompletions",editor)

    },
    "Ctrl-D,Cmd-D": function (editor:CodeMirror.Editor) {
      CodeMirror.signal(editor,"epicShowType",editor)
    },
    "Alt-P": function (editor:CodeMirror.Editor) {
      CodeMirror.signal(editor,"epicShowDocs",editor)
    },
    "Ctrl-L,Cmd-L": function (editor:CodeMirror.Editor) {
      CodeMirror.signal(editor,"epicFormat",editor)
    },
    // "Alt-.": function (cm) {
    //   server.jumpToDef(cm);
    // },
    // "Alt-,": function (cm) {
    //   server.jumpBack(cm);
    // },
    // "Ctrl-Q": function (cm) {
    //   server.rename(cm);
    // },
    // "Ctrl-.": function (cm) {
    //   server.selectName(cm);
    // }
  })

  editor.on("inputRead", (editor: CodeMirror.Editor) => {
    if (editor.state.completionActive) {
      return
    }
    const cur = (editor as any).getCursor()
    const token = (editor as any).getTokenAt(cur)
    if (token.type && token.type !== "comment") {
      CodeMirror.signal(editor,"epicShowCompletions",editor)
    }
  })

  ;(CodeMirror as any).hintOptions = {
    completeSingle: false,
    closeOnUnfocus: false
  }
}
