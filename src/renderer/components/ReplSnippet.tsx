import * as React from "react"
import getLogger, {LogLevel} from "common/log/Logger"
import {
  FillWidth,
  FlexAuto, FlexColumn, FlexRow,
  FlexRowCenter, FlexScale,
  IThemedProperties, makeDimensionConstraints, makeMargin, makePadding,
  makePaddingRem, makeWidthConstraint,
  NestedStyles, OverflowHidden, rem, remToPx,
  StyleDeclaration
} from "renderer/styles/ThemedStyles"
import {Selectors, StyledComponent} from "renderer/components/elements/StyledComponent"
import * as classNames from "classnames"
import {ISnippet} from "common/models/Workspace"
import ReplOutput from "./output/ReplOutput"
import ReplCommon from "./output/ReplCommon"
import ReplOutputTranspile from "./output/ReplOutputTranspile"
import {getValue, isString} from "typeguard"
import Paper from "@material-ui/core/Paper/Paper"
import {darken} from "@material-ui/core/styles/colorManipulator"
import IconButton from "@material-ui/core/IconButton/IconButton"
import ReplayIcon from "@material-ui/icons/Replay"
import EditIcon from "@material-ui/icons/Edit"
import BookmarkIcon from "@material-ui/icons/Bookmark"
import {runWorkspace, saveSnippet, setCurrentSnippet} from "renderer/actions/WorkspaceActions"
import {useCallback, useEffect, useState} from "react"

const log = getLogger(__filename)

type Classes = "root" | "paper"

function baseStyles(theme: Theme): StyleDeclaration<Classes> {
  const
    {palette} = theme,
    {primary, secondary, error, info, warn} = palette

  return {
    root: {
      ...makePaddingRem(0.5),
      ...FlexRowCenter,
      ...FlexAuto,
      ...FillWidth,
      "&, & *": {
        fontFamily: "FiraCode",
      }
    },
    paper: {
      ...FlexScale,
      ...FlexColumn,
      ...makePadding(0),
      ...makeMargin(0),
      ...OverflowHidden,

      "& .top, & .bottom": {
        ...makePaddingRem(0.5)
      },

      "& .top": {
        ...FlexAuto,
        ...FlexRowCenter,
        background: primary["700"],

        "& > .entry": {
          ...FlexScale,
          overflowX: 'auto',

          "& > .source": {
            overflowWrap: "normal !important",
            wordBreak: 'keep-all !important',

            "& > pre": {
              ...makeMargin(0)
            }
          }
        },
        "& > .controls": {
          ...FlexAuto,
          ...makePadding(0,0,0,remToPx(1)),

          "& .button": {
            ...makeDimensionConstraints(rem(1.4)),
            ...makePaddingRem(0.2),
            ...FlexAuto,
            "& .icon": {
              ...makeDimensionConstraints(rem(1)),
              fontSize: rem(1),
              color: darken(primary.contrastText,0.15)
            }
          }
        }
      },
      "& .bottom": {
        ...FlexColumn,
        ...FlexAuto,
        background: primary["500"],

        "& > .output": {
          ...FlexRow,
          ...FlexAuto,
          ...makePaddingRem(0.25, 0),
          "&.expired": {
            color: darken(primary.contrastText,0.3)
          },
          "& > .level": {
            ...FlexAuto,
            ...makeWidthConstraint(rem(5)),
            ...makePaddingRem(0.25, 0.5),
            justifyContent: "center",

            "&.info": {
              color: info.main,
              //background: info.contrastText
            },
            "&.warn": {
              color: warn.main,
              //background: warn.contrastText
            },
            "&.error": {
              color: error.main,
              //background: error.contrastText
            }
          },
          "& > .tag": {
            ...FlexAuto,
            ...makePaddingRem(0, 0.5)
          },
          "& > .value": {
            ...FlexScale,
            ...makePaddingRem(0.25, 0.5)
          }
        }
      }
    }
  }
}

interface P extends IThemedProperties<Classes> {
  snippet: ISnippet
}


export default StyledComponent<P>(baseStyles)(function ReplSnippet(props: P): React.ReactElement<P> {
  const
    {snippet, classes} = props,
    [codeHighlighted,setCodeHighlighted] = useState<any | null>(null)

  useEffect(() => {
    setCodeHighlighted({__html: ReplCommon.highlight(snippet.code, 'js')})
  },[snippet.code])

  const
    setSnippet = useCallback(() => setCurrentSnippet(snippet),[snippet]),
    runSnippet = useCallback(() => runWorkspace(getWorkspace(), snippet),[snippet]),
    save = useCallback(() => saveSnippet(snippet),[snippet])

  return <div className={classNames(`${classes.root} repl-snippet CodeMirror`, {})}>
    <Paper className={classes.paper}>
      <div className="top repl-entry-message">
        <div className='entry repl-entry-command-container'>
          <div className='source repl-entry-message-output'>
            <pre dangerouslySetInnerHTML={codeHighlighted} />
          </div>
          {/*<ReplOutputTranspile output={snippet.code} html={ReplCommon.highlight(snippet.code,'js')} />*/}
          {/*<div className="repl-entry-message-command" dangerouslySetInnerHTML={{__html:ReplCommon.highlight(snippet.code)}}/>*/}
        </div>
        <div className="controls">
          <IconButton className="button" onClick={setSnippet}>
            <EditIcon className="icon"/>
          </IconButton>
          <IconButton className="button" onClick={runSnippet}>
            <ReplayIcon className="icon"/>
          </IconButton>
          <IconButton className="button" onClick={save}>
            <BookmarkIcon className="icon"/>
          </IconButton>
        </div>
      </div>
      <div className="bottom repl-entry-message">
        {snippet.output.isEmpty() && <div className="repl-entry-message-output output expired">
          output has expired
        </div>}
        {snippet.output.map((output, index) => {
          let level = (output && output.stack ? LogLevel.error : LogLevel.info) as any
          let tag = "REPL"
          if (getValue(() => output.type === "log", false)) {
            level = (LogLevel[output.level] as any)
            tag = output.tag
            output = output.args
            //output = `[${level}] (${tag}) ${args.map(it => it.toString()).join(" ")}`
          }
          level = LogLevel[level]

          if (Array.isArray(output) && output.length === 1 && isString(output[0]))
            output = output[0]

          return <div key={index} className="repl-entry-message-output output">
            <div className={`level ${level}`}>{level}</div>
            {/*<div className="tag">{tag}</div>*/}
            <div className="repl-entry-command-container value">
              {ReplOutput.transformObject(output)}
            </div>
          </div>
        })}

      </div>
    </Paper>
  </div>
})
