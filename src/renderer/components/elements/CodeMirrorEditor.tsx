import * as CodeMirror from 'codemirror';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/css/css';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/darcula.css';
// The plugin currently requires the show-hint extension from CodeMirror, which must be
// installed by the app that uses the LSP connection
import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/addon/hint/show-hint';

// You are required to install the show-hint addon
// import 'codemirror/addon/hint/show-hint.css'
// import 'codemirror/addon/hint/show-hint'

// Each adapter can have its own CSS
import 'lsp-editor-adapter/lib/codemirror-lsp.css'
import {LspWsConnection, CodeMirrorAdapter} from 'lsp-editor-adapter'

import * as React from "react"
import getLogger from "common/log/Logger"
import {
  IThemedProperties,
  NestedStyles,
  rem,
  FillWidth, makePaddingRem, mergeClasses, makePadding, PositionAbsolute, Fill, StyleDeclaration
} from "renderer/styles/ThemedStyles"

import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {useCallback, useEffect, useRef} from "react"
import {guard} from "typeguard"
import {getCommandManager} from "common/command-manager"
import {lighten} from "@material-ui/core/styles/colorManipulator"
import * as Path from "path"
import * as Fs from "fs"

const
  Sh = require("shelljs"),
  log = getLogger(__filename)

const
  LanguageServerPort = process.env.LANGUAGE_SERVER_PORT,
  //Tmp =
  TmpDir = Sh.tempdir()//Fs.mkdtempSync("epicviz")

log.info(`Using temp dir: ${TmpDir}`)

function mkTempNewFile():string | null {
  for (const index of _.range(0,1000)) {
    const file = Path.resolve(TmpDir,`Untitled_${index}.js`)
    if (!Fs.existsSync(file)) {
      Fs.writeFileSync(file,"")
      return file
    }
  }

  return null
}


function baseStyles(theme: Theme): StyleDeclaration {
  const
    {palette, components: {TextField}} = theme,
    {primary, secondary} = palette,
    gutterWidth = 30

  return {
    root: [FillWidth, {}],
    "@global": [{
      ".CodeMirror": {
        borderRadius: theme.spacing.unit / 2,
        "&.cm-s-darcula": {
          backgroundColor: lighten(TextField.colors.bg, 0.1)
        },
        "&, & *": {
          fontFamily: "FiraCode",
          fontSize: rem(1.1)
        },
        "&.CodeMirror-focused::after": [theme.focus, PositionAbsolute, Fill, {
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10,
          content: "' '",
          pointerEvents: "none"
        }],
        "& .CodeMirror-gutter": [{
          width: gutterWidth + (theme.spacing.unit / 2)
        }],
        "& .CodeMirror-linenumber": [makePadding(0), {
          width: gutterWidth
        }],

        "& .CodeMirror-linenumbers": [makePadding(0, theme.spacing.unit), {
          width: gutterWidth
        }],
        "& .CodeMirror-lines": [makePadding(theme.spacing.unit * 2, theme.spacing.unit), {
          //width: gutterWidth,
          "& .CodeMirror-gutter-wrapper": [{
            //left: `calc(-${theme.spacing.unit * 2}px - ${gutterWidth}px) !important`
          }]
        }]
      }
    }]
  }
}

interface P extends IThemedProperties {
  value: string
  file:string
  language?:string
  autoFocus?: boolean
  onValueChange: (source: string) => void
}

export default StyledComponent<P>(baseStyles)(function CodeMirrorEditor(props: P): React.ReactElement<P> {
  const
    {value, classes, language = "javascript", file,className, onValueChange, autoFocus = false, ...other} = props,
    wrapperRef = useRef<HTMLDivElement | null>(null),
    textareaRef = useRef<HTMLTextAreaElement | null>(null),
    codeMirrorRef = useRef<CodeMirror.Editor | null>(null),
    onChangedInternal = useCallback(event => {
      const newValue = event.getValue()
      log.debug("Changed event", newValue)
      guard(() => onValueChange(newValue))
    }, [onValueChange])

  const
    isNewFile = file.isEmpty(),
    filePath = isNewFile ? mkTempNewFile() : Path.resolve(file),
    dir = Path.dirname(filePath)


  useEffect(() => {
    const
      container = textareaRef.current,
      wrapper = wrapperRef.current

    if (!wrapper || !container || codeMirrorRef.current) return () => {}

    log.debug("Recreating code mirror")
    const newEditor = codeMirrorRef.current = CodeMirror.fromTextArea(container, {
      value: value || "test",
      //autofocus: autoFocus,
      // lineWrapping: true,
      // lineNumbers: true,
      gutters: ['CodeMirror-lsp'],

      mode: language,
      theme: "darcula"
    })
    //codeMirror.setValue(defaultValue)
    //newEditor.on("change", onChangedInternal)
    // codeMirror.on("focus",(event) => {
    //   log.info("On focus", event, wrapper, container)
    //   if (event && wrapper && container)
    //     getCommandManager().updateFocusedContainers()
    // })
    // newEditor.on("keydown", (cm, event) => {
    //   getCommandManager().onKeyDown(event, true)
    // })



    // Take a look at how the example is configured for ideas
    const js = {
      // Required: Web socket server for the given language server
      serverUri: `ws://localhost:${LanguageServerPort}/${language}`,
      // The following options are how the language server is configured, and are required
      rootUri: `file://${dir}`,
      documentUri: `file://${filePath}`,
      documentText: () => newEditor.getValue(),
      languageId: language
    }

    // The WebSocket is passed in to allow testability
    const jsConnection = new LspWsConnection(js)
      .connect(new WebSocket(js.serverUri))

    // The adapter is what allows the editor to provide UI elements
    const jsAdapter = new CodeMirrorAdapter(jsConnection, {
      // UI-related options go here, allowing you to control the automatic features of the LSP, i.e.
      //suggestOnTriggerCharacters: false
      quickSuggestionsDelay: 50
    }, newEditor)

    // You can also provide your own hooks:
    jsConnection.on('error', (e) => {
      log.error(e)
    })

    // You might need to provide your own hooks to handle navigating to another file, for example:
    jsConnection.on('goTo', (locations) => {
      // Do something to handle the URI in this object
    })



    return () => {
      jsAdapter.remove();
      jsConnection.close();
    }
  }, [wrapperRef, textareaRef])

  return <div ref={wrapperRef} className={mergeClasses(classes.root, className)}>
    <textarea ref={textareaRef} {...other}/>
  </div>
})
