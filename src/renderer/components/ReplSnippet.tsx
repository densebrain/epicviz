import * as React from "react"
import getLogger from "common/log/Logger"
import {IThemedProperties, NestedStyles, StyleDeclaration} from "renderer/styles/ThemedStyles"
import {Selectors, StyledComponent} from "renderer/components/elements/StyledComponent"
import * as classNames from "classnames"
import {ISnippet} from "common/models/Workspace"
import ReplOutput from "./output/ReplOutput"
import ReplCommon from "./output/ReplCommon"
import ReplOutputTranspile from "./output/ReplOutputTranspile"
import {getValue} from "typeguard"

const log = getLogger(__filename)

type Classes = "root"

function baseStyles(theme: Theme): StyleDeclaration<Classes> {
  const
    {palette} = theme,
    {primary, secondary} = palette

  return {
    root: {}
  }
}

interface P extends IThemedProperties<Classes> {
  snippet: ISnippet
}


export default StyledComponent<P>(baseStyles)(function ReplSnippet(props: P): React.ReactElement<P> {
  const {snippet, classes} = props
  return <div className={classNames(`${classes.root} repl-snippet`, {})}>
    <div className="repl-entry-message">
      <div className='repl-entry-command-container'>
        <div className='repl-entry-message-output' dangerouslySetInnerHTML={{__html:ReplCommon.highlight(snippet.code,'js')}}/>

        {/*<ReplOutputTranspile output={snippet.code} html={ReplCommon.highlight(snippet.code,'js')} />*/}
        {/*<div className="repl-entry-message-command" dangerouslySetInnerHTML={{__html:ReplCommon.highlight(snippet.code)}}/>*/}
      </div>

    {snippet.output.map((output, index) => {
      if (getValue(() => output.type === "log", false)) {
        const {tag, level, args} = output
        output = `[${level}] (${tag}) ${args.map(it => it.toString()).join(" ")}`
      }
      return <div key={index} className="repl-entry-command-container">{ReplOutput.transformObject(output)}</div>
    })}
    </div>
  </div>
})
