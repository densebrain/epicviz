import * as React from "react"
import getLogger from "common/log/Logger"
import {IThemedProperties, NestedStyles, rem, StyleDeclaration} from "renderer/styles/ThemedStyles"
import {Selectors, StyledComponent} from "renderer/components/elements/StyledComponent"
import * as classNames from "classnames"

const log = getLogger(__filename)

type Classes = "root"

function baseStyles(theme: Theme): StyleDeclaration<Classes> {
  const
    {palette,components:{NoContent}} = theme,
    {primary, secondary} = palette

  return {
    root: {
      ...NoContent.colors,
      fontWeight: 500,
      fontSize: rem(1.2),
      textTransform: 'uppercase'
    }
  }
}

interface P extends IThemedProperties<Classes> {
  label?: string | null
}


export default StyledComponent<P>(baseStyles)(function NoContent(props: P): React.ReactElement<P> {
  const {classes,label = ""} = props
  return <div className={classNames(classes.root, {})}>{label && !label.isEmpty() ? label : "No content"}</div>
})
