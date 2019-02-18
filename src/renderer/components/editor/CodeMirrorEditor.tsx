import * as CodeMirror from 'codemirror'
//import 'codemirror/mode/javascript/javascript'
import JavaScript from "common/languages/javascript"
import 'codemirror/lib/codemirror.css'
import 'codemirror/addon/tern/tern.css'
import 'codemirror/theme/darcula.css'
import 'codemirror/addon/dialog/dialog.css'
import 'codemirror/addon/dialog/dialog'
import 'codemirror/addon/hint/show-hint.css'
import 'codemirror/addon/hint/show-hint'
import 'codemirror/addon/selection/mark-selection'


import * as React from "react"
import getLogger from "common/log/Logger"
import {
  IThemedProperties,
  NestedStyles,
  rem,
  FillWidth, makePaddingRem, mergeClasses, makePadding, PositionAbsolute, Fill, StyleDeclaration, OverflowAuto, remToPx
} from "renderer/styles/ThemedStyles"

import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {useCallback, useEffect, useRef, useState} from "react"
import {guard} from "typeguard"
import {getCommandManager} from "common/command-manager"
import {lighten} from "@material-ui/core/styles/colorManipulator"
import * as Path from "path"
import * as Fs from "fs"
import {stopEvent} from "renderer/util/Event"

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


function baseStyles(theme: Theme): StyleDeclaration {
  const
    {palette, components: {TextField}} = theme,
    {primary, secondary} = palette,
    gutterWidth = 30,
    maxHeight = "25vh"

  return {
    root: {
      ...FillWidth,
      ...OverflowAuto,
    },
    "@global": [{
      ".CodeMirror": {
        borderRadius: theme.spacing.unit / 2,
        height: "auto",
        ...OverflowAuto,

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

export default StyledComponent<P>(baseStyles,{withTheme:true})(function CodeMirrorEditor(props: P): React.ReactElement<P> {
  const
    {value, theme,classes, language = "javascript", file,className, onValueChange, autoFocus = false, ...other} = props,
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
    isNewFile = !file ? true : file.isEmpty(),
    filePath = isNewFile ? null : Path.resolve(file),
    dir = isNewFile ? null : Path.dirname(filePath)


  useEffect(() => {
    const
      container = textareaRef.current,
      wrapper = wrapperRef.current

    if (!filePath || !dir || !wrapper || codeMirrorRef.current) return () => {}

    const
      doc = new CodeMirror.Doc(value || "","javascript"),
      newEditor = codeMirrorRef.current = CodeMirror(wrapper as any, {
        value: doc,
        autofocus: autoFocus,
        //lineWrapping: true,
        styleSelectedText: true,
        lineNumbers: true,
        mode: language,
        theme: "darcula"
      } as any)


    const server = JavaScript.attach(dir,newEditor)
    server.addDoc(filePath,doc)

    newEditor.on("viewportChange", editor => {
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

    return () => {
      if (DEBUG) {
        Object.assign(global, {
          editor: null
        })
      }

      server.destroy()
    }
  }, [filePath, wrapperRef, textareaRef])

  useEffect(() => {
    if (codeMirrorRef.current) {
      codeMirrorRef.current.setValue(value)
    }
  },[filePath])

  return <div
    ref={wrapperRef} className={mergeClasses(classes.root, className)}
  />
})


