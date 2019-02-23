import * as CodeMirror from 'codemirror'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/mode/css/css'
import 'codemirror/lib/codemirror.css'
import 'codemirror/addon/hint/show-hint.css'
import 'codemirror/addon/hint/show-hint'
import 'codemirror/addon/selection/active-line'
import 'codemirror/addon/selection/mark-selection'
import 'codemirror/addon/comment/comment'
import 'codemirror/addon/comment/continuecomment'
import 'codemirror/addon/display/placeholder'
//import 'codemirror/addon/display/autorefresh'
import 'codemirror/addon/edit/matchtags'
import 'codemirror/addon/edit/closebrackets'
// import 'codemirror/addon/runmode/runmode'
// import 'codemirror/addon/runmode/runmode.node'
// import 'codemirror/addon/runmode/colorize'
//import 'codemirror/addon/selection/active-line'
//import 'codemirror/addon/selection/mark-selection'
import 'codemirror/addon/lint/lint'
import 'codemirror/addon/lint/javascript-lint'
import 'codemirror/addon/lint/json-lint'
import 'codemirror/addon/fold/foldgutter'
import 'codemirror/addon/fold/foldgutter.css'
import 'codemirror/addon/fold/indent-fold'
import 'codemirror/addon/fold/brace-fold'
import 'codemirror/addon/dialog/dialog.css'
import 'codemirror/addon/dialog/dialog'
import 'codemirror/addon/hint/anyword-hint'
import 'codemirror/addon/hint/javascript-hint'
import "renderer/assets/css/darcula.scss"
import "renderer/assets/css/tern.css"

import JavaScript from "common/languages/javascript"

import * as React from "react"
import {useCallback, useEffect, useRef, useState} from "react"
import getLogger from "common/log/Logger"
import {
  Fill,
  FillWidth, FlexColumn,
  IThemedProperties, makeHeightConstraint,
  makePadding,
  OverflowAuto,
  PositionAbsolute, PositionRelative,
  rem,
  StyleDeclaration
} from "renderer/styles/ThemedStyles"
import classNames from 'classnames'
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {guard} from "typeguard"
import * as Path from "path"
import attachHistory from "renderer/components/editor/Editor.History"
import attachInput from "renderer/components/editor/Editor.Input"
import {addHotDisposeHandler} from "common/HotUtil"

Object.assign(global,{
  CodeMirror
})

const
  Sh = require("shelljs"),
  log = getLogger(__filename)

// const
//   LanguageServerPort = process.env.LANGUAGE_SERVER_PORT,
//   //Tmp =
//   SysTmpDir = process.cwd(),//Sh.tempdir()
//   TmpDir = Path.resolve(SysTmpDir,`epicviz-${Date.now()}`)//Fs.mkdtempSync("epicviz")
//
// Sh.mkdir('-p',TmpDir)
// log.info(`Using temp dir: ${TmpDir}`)
//
// function mkTempNewFile():string | null {
//   for (const index of _.range(0,1000)) {
//     const file = Path.resolve(TmpDir,`Untitled_${index}.js`)
//     if (!Fs.existsSync(file)) {
//       Fs.writeFileSync(file,"")
//       return file
//     }
//   }
//
//   return null
// }

type Classes = "root"

function baseStyles(theme: Theme): StyleDeclaration<Classes> {
  const
    {palette, components: {TextField}} = theme,
    {primary, secondary} = palette,
    gutterWidth = 30,
    maxHeight = ({fill}:P):(string | number) => fill ? "100%" : "25vh"

  return {
    root: {
      ...FlexColumn,
      ...FillWidth,
      ...makeHeightConstraint(({fill}:P):(string | number) => fill ? "100%" : "auto"),
      ...OverflowAuto,
      ...PositionRelative,
      "& .CodeMirror": {
        ...Fill
      }
    },

    "@global": {
      ".CodeMirror": {
        borderRadius: theme.spacing.unit / 2,
        height: ({fill}:P):(string | number) => fill ? "100%" : "auto",
        ...PositionRelative,
        //...OverflowAuto,

        // "&.cm-s-darcula": {
        //   backgroundColor: lighten(TextField.colors.bg, 0.1)
        // },
        "&, & *": {
          fontFamily: "FiraCode",
          fontSize: rem(1.1)
        },
        "& .CodeMirror-cursors": {
          visibility: 'visible',

          "&.CodeMirror-cursorsVisible": {
            visibility: 'visible !important'
          }
        },
        "&.CodeMirror-focused::after": {...theme.focus, ...PositionAbsolute, ...Fill,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10,
          content: "' '",
          pointerEvents: "none"
        },
        "& .CodeMirror-gutter": {
          width: gutterWidth + (theme.spacing.unit / 2)
        },
        "& .CodeMirror-linenumber": {...makePadding(0),
          width: gutterWidth
        },

        "& .CodeMirror-linenumbers": {...makePadding(0, theme.spacing.unit),
          width: gutterWidth
        },
        "& .CodeMirror-lines": {
          ...makePadding(theme.spacing.unit * 2, theme.spacing.unit),
          //width: gutterWidth,
          "& .CodeMirror-gutter-wrapper": {
            //left: `calc(-${theme.spacing.unit * 2}px - ${gutterWidth}px) !important`
          }
        }
      }
    }
  } as any
}

interface P extends IThemedProperties {
  value: string
  file:string
  clearOnChange?:boolean
  fill?: boolean | null
  language?:string
  autoFocus?: boolean
  onValueChange: (source: string) => void
}

interface IElementSize {
  width:number
  minWidth:number
  maxWidth:number
  height:number
  minHeight:number
  maxHeight:number
}

type EditorSizes = {
  parent:IElementSize
  editor:IElementSize
}

function getElementSize(elem):IElementSize {
  return ["min-height","max-height","height","min-width","max-width","width"].reduce((values,prop) => {
    let value = parseInt(elem.css(prop),10)
    if (isNaN(value)) {
      value = 0
    }

    values[_.camelCase(prop)] = value

    return values
  },{} as IElementSize)
}

function getEditorSizes():EditorSizes {
  const elem = $(".CodeMirror-sizer")
  return {
    editor: getElementSize(elem),
    parent: getElementSize(elem.parents(".Pane"))
  }



}

export default StyledComponent<P>(baseStyles,{withTheme:true})(function Editor(props: P): React.ReactElement<P> {
  const
    {value, fill = false,theme,classes,clearOnChange = false, language = "javascript", file:inFile,className, onValueChange, autoFocus = false, ...other} = props,
    wrapperRef = useRef<HTMLDivElement | null>(null),
    textareaRef = useRef<HTMLTextAreaElement | null>(null),
    codeMirrorRef = useRef<CodeMirror.Editor | null>(null),
    [editor,setEditor] = useState<CodeMirror.Editor | null>(null),
    [server,setServer] = useState<any | null>(null),
    onChangedInternal = useCallback(newValue => {
      log.debug("Changed event", newValue)
      guard(() => onValueChange(newValue))
    }, [onValueChange])

  const
    isNewFile = !inFile ? true : inFile.isEmpty(),
    file = isNewFile ? null : Path.resolve(inFile),
    dir = isNewFile ? null : Path.dirname(file)


  useEffect(():void => {
    const
      container = textareaRef.current,
      wrapper = wrapperRef.current

    if (!file || !dir || !wrapper || codeMirrorRef.current) return

    const
      doc = new CodeMirror.Doc(value || "","javascript"),
      newEditor = codeMirrorRef.current = CodeMirror(wrapper as any, {
        value: doc,
        autofocus: autoFocus,
        //lineWrapping: true,
        indentWithTabs: false,
        indentUnit: 2,
        smartIndent: true,
        tabSize: 2,
        electricChars: true,
        continueComments: true,
        styleSelectedText: true,
        lineNumbers: true,
        mode: language,
        autoCloseBrackets: true,
        closeBrackets: true,
        theme: "darcula"
      } as any)


    const server = JavaScript.attach(dir,file,newEditor,doc)
    attachHistory(newEditor)
    attachInput(newEditor)


    let cursorInterval:any = null
    const clearCursorInterval = ():void => {
      if (cursorInterval)
        clearInterval(cursorInterval)

      cursorInterval = null
    }
    addHotDisposeHandler(module,clearCursorInterval)

    const toggleCursor = (clear:boolean = false):void => {
      const cursors = $(".CodeMirror-cursors")
      cursors.css({
        visibility: clear ? null : cursors.css('visibility') === 'visible' ? 'hidden' : 'visible'
      })
    }

    newEditor.on('blur', () => {
      clearCursorInterval()
      cursorInterval = setInterval(toggleCursor,500)
    })
    newEditor.on('focus', () => {
      clearCursorInterval()
      toggleCursor(true)
    })

    newEditor.on("keydown",(editor,event:KeyboardEvent) => {
      if (event.key === "Escape") {
        (editor as any).closeHint()
        CodeMirror.signal(editor,"setDoc")
      }

      if (event.key === "l" && event.ctrlKey) {
        CodeMirror.signal(editor,"epicFormat",editor)
      }
      //log.info("Key down", editor, event)
    })

    newEditor.on("viewportChange", editor => {
      if (fill) return

      const
        scrollInfo = editor.getScrollInfo(),
        doc = editor.getDoc(),
        lines = doc.lineCount(),
        sizes = getEditorSizes(),
        maxHeight = sizes.parent.height * 0.75

      let height = scrollInfo.height
      if (scrollInfo.clientHeight > maxHeight) {
        height = maxHeight
      } else {
        height = scrollInfo.height
      }
      const
        viewport = editor.getViewport(),
        contentHeight = editor.heightAtLine(lines, null, true)

      height = Math.min(height, maxHeight, sizes.editor.minHeight)
      editor.setSize(scrollInfo.clientWidth, height)
    })

    // ON CHANGES REPORT NEW DATA
    newEditor.on("change",() => {
      onChangedInternal(newEditor.getValue())
    })

    setEditor(newEditor)
    setServer(server)

    if (DEBUG) {
      Object.assign(global, {
        editor: newEditor
      })
    }
  }, [file, wrapperRef, textareaRef])

  useEffect(() => {
    if (codeMirrorRef.current) {
      if (clearOnChange) {
        const doc = new CodeMirror.Doc(value || "", "javascript")
        codeMirrorRef.current.swapDoc(doc)
      } else {
        codeMirrorRef.current.setValue(value)
      }
    }
  },[file])
  //cm-s-darcula
  return <div
    ref={wrapperRef}
    className={classNames(`${classes.root} ${className}`)}
    {...other}
  />
})


