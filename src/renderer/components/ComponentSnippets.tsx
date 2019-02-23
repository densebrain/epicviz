import * as React from "react"
import getLogger from "common/log/Logger"
import {
  CursorPointer, Ellipsis,
  Fill, FillWidth, FlexColumn, FlexColumnCenter, FlexRow, FlexRowCenter, FlexScale,
  IThemedProperties, makeDimensionConstraints, makeHeightConstraint, makePaddingRem,
  PositionAbsolute,
  PositionRelative, rem, remToPx,
  StyleDeclaration
} from "renderer/styles/ThemedStyles"
import {Selectors, StyledComponent} from "renderer/components/elements/StyledComponent"
import * as classNames from "classnames"
import {ISnippet, Workspace} from "common/models/Workspace"
import {VerticalSplitPane} from "renderer/components/elements/VerticalSplitPane"
import List, {ListRowProps} from "renderer/components/elements/List"
import {useCallback, useEffect, useState} from "react"
import {IDataSet, makeDataSet} from "common/Types"
import {getValue} from "typeguard"
import * as Path from "path"
import Editor from "renderer/components/editor/Editor"
import {makeSplitterSelector, projectDirSelector, savedSnippetsSelector} from "renderer/store/selectors/UISelectors"
import NoContent from "renderer/components/NoContent"
import {UIActionFactory} from "renderer/store/actions/UIActionFactory"
import {Divider} from "@material-ui/core"
import EditIcon from "@material-ui/icons/Edit"
import IconButton from "@material-ui/core/IconButton"
import {inputTextDialog} from "renderer/util/UIHelper"

const log = getLogger(__filename)

type Classes = "root" | "list" | "editor"

function baseStyles(theme: Theme): StyleDeclaration<Classes> {
  const
    {palette, components: {ListItem: {colors}}} = theme,
    {primary, secondary} = palette


  return {
    root: {
      ...Fill
    },
    list: {
      ...Fill,
      ...PositionRelative,
      "& .item": {
        ...PositionRelative,
        ...FillWidth,
        ...makeHeightConstraint(rem(3)),
        ...FlexColumnCenter,
        ...CursorPointer,

        background: colors.normal.bg,
        color: colors.normal.text,

        "&.selected": {
          background: colors.selected.bg,
          color: colors.selected.text,

          "&::after": {
            ...theme.focus, ...PositionAbsolute, ...Fill,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
            content: "' '",
            pointerEvents: "none"
          }
        },

        "& > .label": {
          ...makePaddingRem(0.3, 1),
          ...FlexScale,
          ...FlexRow,
          ...FillWidth,
          textTransform: 'capitalize',
          alignItems: 'center',
          textAlign: 'left',

          "& > .text": {
            ...FlexScale,
            ...Ellipsis
          },

          "& .icon": {
            ...makeDimensionConstraints(rem(1)),
            fontSize: remToPx(1)
          }
        },

        "& hr": {
          ...FillWidth
        }
      }
    },
    editor: {
      ...Fill,
      ...FlexColumnCenter

    }
  }
}

interface P extends IThemedProperties<Classes> {

}

interface SP {
  workspace: Workspace
  savedSnippets: Array<ISnippet>
  projectDir: string
  splitter: number
}

const selectors = {
  workspace: (state: IRootRendererState) => state.UIState.workspace,
  projectDir: projectDirSelector,
  splitter: makeSplitterSelector("snippets"),
  savedSnippets: savedSnippetsSelector
} as Selectors<P, SP>

export default StyledComponent<P, SP>(baseStyles, selectors)(function ComponentSnippets(props: SP & P): React.ReactElement<P> {
  const
    {classes, workspace, savedSnippets, splitter, projectDir} = props,
    [snippets, setSnippets] = useState<IDataSet<ISnippet>>(() => makeDataSet(workspace.savedSnippets)),
    [selectedIndexes, setSelectedIndexes] = useState<Array<number>>([]),
    [currentSnippet, setCurrentSnippet] = useState<ISnippet | null>(null),
    setCurrentSnippetCode = useCallback((code: string) => {
      if (!currentSnippet) return
      patchWorkspace(ws => {
        const
          newSavedSnippets = [...ws.savedSnippets],
          index = newSavedSnippets.findIndex(it => it.id === currentSnippet.id)

        if (index === -1) return {}
        newSavedSnippets[index] = {
          ...newSavedSnippets[index],
          code
        }

        return {
          savedSnippets: newSavedSnippets
        }
      })
    }, [currentSnippet]),
    setSplitter = useCallback((newSize: number) => {
      new UIActionFactory().setSplitter("snippets", newSize)
    }, []),
    rowRenderer = useCallback((rowProps: ListRowProps<ISnippet>): React.ReactNode => {
      const
        {
          key,
          index,
          onClick,
          style,
          dataSet,
          selectedIndexesContext
        } = rowProps,
        snippet = dataSet.data[index] as ISnippet,
        rename = async ():Promise<void> => {
          const newName = await inputTextDialog(`Renaming ${snippet.name}`,"Rename","",snippet.name)
          if (!newName || newName.isEmpty()) return

          patchWorkspace(ws => {
            const
              newSavedSnippets = [...ws.savedSnippets],
              index = newSavedSnippets.findIndex(it => snippet.id === it.id)

            if (index === -1) return {}

            newSavedSnippets[index] = {
              ...newSavedSnippets[index],
              name:newName
            }

            return {
              savedSnippets: newSavedSnippets
            }

          })
        },
        Consumer = getValue(() => selectedIndexesContext.Consumer, null as React.Consumer<Array<number>> | null)
      return !Consumer ? <div
        key={key}
        style={style}
      /> : <Consumer key={key}>
        {(selectedIndexes: Array<number> | null) => <div
          style={style}
          onClick={onClick}
          className={classNames("item", {
            selected: selectedIndexes && selectedIndexes.includes(index)
          })}
        >
          <div className="label">
            <div className="text">{snippet.name}</div>
            <IconButton className="button" onClick={rename}>
              <EditIcon className="icon"/>
            </IconButton>
          </div>

          <Divider/>
        </div>}
      </Consumer>


    }, [])


  useEffect(() => {
    setSnippets(makeDataSet(savedSnippets))
  }, [savedSnippets])

  useEffect(() => {
    setCurrentSnippet(selectedIndexes.isEmpty() ? null : savedSnippets[selectedIndexes[0]])
  }, [selectedIndexes, savedSnippets])

  return <VerticalSplitPane
    className={classNames(classes.root, {})}
    primary="first"
    minSize={rem(10)}
    defaultSize={splitter}
    onChanged={setSplitter}
  >
    <div className={classes.list}>
      <List
        id="snippets"
        rowRenderer={rowRenderer}
        dataSet={snippets}
        onSelectedIndexesChanged={(dataSet: IDataSet<ISnippet>, indexes: number[]) => setSelectedIndexes(indexes)}
        selectedIndexes={selectedIndexes}
        rowHeight={remToPx(3)}
      />

    </div>
    <div className={classes.editor}>
      {!currentSnippet ?
        <NoContent label="Please select or create a snippet"/> :
        <Editor
          fill={true}
          clearOnChange={true}
          file={!projectDir ? null : Path.resolve(projectDir, `${currentSnippet.id}.js`)}
          value={currentSnippet.code}
          onValueChange={setCurrentSnippetCode}
        />
      }

    </div>
  </VerticalSplitPane>
})
