import "codemirror/lib/codemirror.css"
import "codemirror/lib/codemirror"
import 'codemirror/mode/javascript/javascript';
//import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/css/css';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/darcula.css';
import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/addon/hint/show-hint';
import * as CodeMirror from 'codemirror'
import  '!!./tern'
let server:any | null = null

export function attach(editor:CodeMirror.Editor):CodeMirror.Editor {
  server = server || new (CodeMirror as any).TernServer({
  
  });
  editor.setOption("extraKeys", {
    "Ctrl-Space": function(cm) { server.complete(cm); },
    "Ctrl-I": function(cm) { server.showType(cm); },
    "Ctrl-O": function(cm) { server.showDocs(cm); },
    "Alt-.": function(cm) { server.jumpToDef(cm); },
    "Alt-,": function(cm) { server.jumpBack(cm); },
    "Ctrl-Q": function(cm) { server.rename(cm); },
    "Ctrl-.": function(cm) { server.selectName(cm); }
  })
  editor.on("cursorActivity", function(cm) { server.updateArgHints(cm); });
  return editor
}
