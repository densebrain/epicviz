import * as React from "react"
import {useRef} from "react"
import { IThemedProperties } from "renderer/styles/ThemedStyles";
import { isString } from "typeguard";
import getLogger from "common/log/Logger";

const log = getLogger(__filename)

export default function TernTooltip(props: IThemedProperties): React.ReactElement<IThemedProperties> {
  const
    {children,...other} = props,
    wrapperRef = useRef<HTMLDivElement>(null),
    htmlPatch = {} as any

  
  Object.assign(htmlPatch, isString(children) ? {
      dangerouslySetInnerHTML: {
        __html: children
      }
    } : {children})

  React.useLayoutEffect(() => {
    if (!wrapperRef.current) return
    const
      node = wrapperRef.current,
      jNode = $(node),
    inset = jNode.outerHeight(true) - jNode.height(),
    height = (inset + $('.tooltip-value').outerHeight(true))

    node.style.height = height + 'px'

    log.info("Height",$('.tooltip-value').height(),inset,height)
  },[wrapperRef.current])

  return <div ref={wrapperRef} {...htmlPatch}/>
}