import {IThemedProperties} from "renderer/styles/ThemedStyles"
import * as React from "react"
import baseStyles from "./SplitPane.styles"
import {StyledComponent} from "renderer/components/elements/StyledComponent"

const SplitPane = require("react-split-pane")

export interface IHorizontalSplitPaneProps extends IThemedProperties {
  defaultSize?: number|string
  minSize?: number|string
  maxSize?: number|string
  primary?: "first"|"second"
  onChange?: (event:any) => any
}

/**
 * App Navigation
 */
//@withStatefulStyles(baseStyles)
export const HorizontalSplitPane = StyledComponent(baseStyles)((props:IHorizontalSplitPaneProps)=> {

    const {classes, children,onChange,...other} = props

    return <SplitPane
      className={classes.root}
      resizerClassName={classes.resizer}
      paneClassName={classes.pane}
      pane1ClassName={classes.pane1}
      pane2ClassName={classes.pane2}
      split="horizontal"
      onDragFinished={onChange}
      {...other}
    >
      {children}
    </SplitPane>

})
