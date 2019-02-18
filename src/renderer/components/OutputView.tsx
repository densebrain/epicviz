import * as React from "react"
import getLogger from "common/log/Logger"
import {Fill, IThemedProperties, NestedStyles, StyleDeclaration} from "renderer/styles/ThemedStyles"
import {Selectors, StyledComponent} from "renderer/components/elements/StyledComponent"
import * as classNames from "classnames"
import {useEffect, useRef} from "react"

const log = getLogger(__filename)

type Classes = "root" | "outputView"

function baseStyles(theme: Theme): StyleDeclaration<Classes> {
  const
    {palette} = theme,
    {primary, secondary} = palette

  return {
    root: {
      ...Fill
    },
    outputView: {
      ...Fill
    }
  }
}

interface P extends IThemedProperties<Classes> {

}

interface SP {
}

const selectors = {} as Selectors<P, SP>

export default StyledComponent<P, SP>(baseStyles, selectors)(function OutputView(props: SP & P): React.ReactElement<P> {
  const
    {classes} = props,
    rootRef = useRef<HTMLDivElement>(null),
    iframeRef = useRef<HTMLIFrameElement>(null)

  // useEffect(() => {
  //   if (!rootRef.current || iframeRef.current) return
  //
  //   const
  //     iframe = iframeRef.current = document.createElement("iframe"),
  //     body = document.createElement("body"),
  //     content = document.createElement("div")
  //
  //   iframe.append(body)
  //
  //
  //
  //
  //   /*
  //   * <iframe
  //     className={classes.outputView}
  //     id="output-view"
  //     name="output-view"
  //     marginHeight={0}
  //     marginWidth={0}
  //     frameBorder="0"
  //   />
  //   */
  //   Object.assign(iframe,{
  //     id: "output-view",
  //     className: classes.outputView,
  //     name: "output-view",
  //     margin: 0,
  //     padding: 0,
  //     frameBorder: 0
  //   })
  //
  //   Object.assign(content,{
  //     id: "content",
  //     className: classes.outputView
  //   })
  //
  //   Object.assign(global,{
  //     outputView: iframe
  //   })
  //   rootRef.current.append(iframe)
  //   iframe.contentDocument.body.append(content)
  //
  //   $(content).css({
  //     ...Fill
  //   })
  //
  //
  //   Object.assign(iframe.contentWindow,{
  //     L,
  //     Plotly
  //   })
  // },[rootRef.current])


  return <div ref={rootRef} className={classNames(classes.root, {})}/>

})
