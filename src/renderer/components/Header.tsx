import * as React from "react"
import getLogger from "common/log/Logger"
import {
	Ellipsis, Fill,
	FillHeight,
	FillWidth,
	FlexAuto,
	FlexRowCenter,
	FlexScale,
	IThemedProperties,
	makeDimensionConstraints,
	makeHeightConstraint,
	makeTransition, makeWidthConstraint,
	mergeClasses,
	OverflowHidden,
	PositionAbsolute,
	PositionRelative,
	rem,
	StyleDeclaration
} from "renderer/styles/ThemedStyles"
import {WindowControls} from "renderer/components/elements/WindowControls"
import {remote} from "electron"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {projectDirSelector} from "renderer/store/selectors/UISelectors"
import {elevationStyles} from "renderer/components/elements/Elevation"


const log = getLogger(__filename)


type Classes = "root"

function baseStyles(theme:Theme):StyleDeclaration<Classes> {
	const
		{palette,components:{Header}} = theme,
		{action, primary, secondary} = palette

	return {
		root: {
			...makeHeightConstraint(rem(2)),
			...FillWidth,
			...FlexRowCenter,
			...PositionRelative,
			//...OverflowHidden,
			position: 'fixed',
			zIndex: 2,
			top: 0,
			left: 0,
			background: Header.colors.bg,
			boxShadow: Header.colors.boxShadow,

			// "&::after": {
			// 	content: "' '",
			// 	...PositionAbsolute,
			// 	...Fill,
			// 	top: "100%",
			// 	left: 0,
			// 	...elevationStyles.elevation6
			// },

			"& > .left, & > .right": {
				...FlexRowCenter,
				...FillHeight,
				...makeWidthConstraint(200)
			},
			"& > .left": {
				justifyContent: "flex-start"

			},
			"& > .right": {
				...FlexAuto,
				justifyContent: "flex-end"
			},

			"&:hover > .logo .overlay": {
				boxShadow: "inset 0 0 0.6rem rgba(100,100,100,0.8)"
			},

			"& > .title": {
				...FlexScale,
				...FlexRowCenter,
				...FillHeight,
				...Ellipsis,
        color: secondary.main,
        fontSize: rem(1.1),
			},

			"& .logo": {
				...FlexAuto,
				...PositionRelative,
				color: secondary.main,
        fontFamily: "Jura",
				fontWeight: 400,
				fontSize: rem(1.1),
				paddingLeft: rem(0.5),
				marginTop: rem(-0.2),
				lineHeight: 1,
				"-webkit-user-select": "none",
				"-webkit-app-region": "drag",
				"&, & *, &:hover, &:hover *": {
					cursor: "move !important",
				}
			},
			"& > .spacer": {
				...FlexScale,
        "-webkit-app-region": "drag"
			}
		}
	}
}

interface P extends IThemedProperties<Classes> {
	rightControls?: React.ReactNode
  leftControls?: React.ReactNode
}

interface SP {
	projectDir:string
}

const selectors = {
	projectDir: projectDirSelector
}

function onDoubleClick():void {
	const win = remote.getCurrentWindow()
	if (win.isMaximized())
		win.restore()
	else
		win.maximize()
}

export default StyledComponent<P,SP>(baseStyles,selectors)(function Header(props:SP & P):React.ReactElement<P> {
  const
    {classes,className,leftControls,rightControls, projectDir} = props


  return <div
		className={mergeClasses(classes.root,className)}
		onDoubleClick={onDoubleClick}
	>

    <div className="left">
      <WindowControls />
      <div className="logo">
        epicviz
      </div>
			{leftControls}
    </div>

    <div className="title">
			{projectDir ? projectDir : "Choose a Workspace"}
    </div>

    <div className="right">
      {rightControls}
    </div>
  </div>
})
