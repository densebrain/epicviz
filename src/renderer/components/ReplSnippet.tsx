import * as React from "react"
import getLogger, {LogLevel} from "common/log/Logger"
import {
  FillWidth,
  FlexAuto, FlexColumn, FlexRow,
  FlexRowCenter, FlexScale,
  IThemedProperties, makeMargin, makePadding,
  makePaddingRem, makeWidthConstraint,
  NestedStyles, OverflowHidden, rem,
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
        background: primary["700"]
      },
      "& .bottom": {
        ...FlexColumn,
        ...FlexAuto,
        background: primary["500"],

        "& > .output": {
          ...FlexRow,
          ...FlexAuto,
          ...makePaddingRem(0.25, 0),

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
  const {snippet, classes} = props
  return <div className={classNames(`${classes.root} repl-snippet`, {})}>
    <Paper className={classes.paper}>
      <div className="top repl-entry-message">
        <div className='repl-entry-command-container'>
          <div className='repl-entry-message-output'
               dangerouslySetInnerHTML={{__html: ReplCommon.highlight(snippet.code, 'js')}}/>

          {/*<ReplOutputTranspile output={snippet.code} html={ReplCommon.highlight(snippet.code,'js')} />*/}
          {/*<div className="repl-entry-message-command" dangerouslySetInnerHTML={{__html:ReplCommon.highlight(snippet.code)}}/>*/}
        </div>
      </div>
      <div className="bottom repl-entry-message">

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
