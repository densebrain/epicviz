import {IDialog} from "renderer/models/Dialog"
import {createSelector, OutputSelector, Selector} from "reselect"
import {DataState} from "common/store/state/DataState"
import {IDataSet, makeDataSet} from "common/Types"
import {ISearchChip, ISearchChipData, SearchProvider} from "renderer/search/Search"
import Dexie from "dexie"
import db from "renderer/db/ObjectDatabase"
import getLogger from "common/log/Logger"
import * as _ from 'lodash'
import UIState, {UISplitterNames, UITabNames} from "renderer/store/state/UIState"
import {ISnippet} from "common/models/Workspace"

const log = getLogger(__filename)

export const dialogsSelector = (state:IRootRendererState):Array<IDialog> => state.UIState.dialogs

export const currentDialogSelector =  (state:IRootRendererState):IDialog | null =>
  _.last(dialogsSelector(state))


export function uiSelector<T>(
  fn:(state:UIState, props?:any) => T
):Selector<IRootState,T> {
  return ((state:IRootState,props:any) => fn(state.UIState,props) as T) as any
}

export function makeSplitterSelector<K extends UISplitterNames>(key:K):Selector<IRootState,string | number> {
  return uiSelector(state => state.splitters[key])
}

export function makeTabSelector<K extends UITabNames>(key:K):Selector<IRootState,string | number> {
  return uiSelector(state => state.tabs[key])
}

export const projectDirSelector = uiSelector(state => state.projectDir || "")

export const savedSnippetsSelector = createSelector(
  uiSelector(state => state.workspace.savedSnippets),
  (snippets:Array<ISnippet>):Array<ISnippet> => snippets.sortBy(it => it.name)
)

export type SearchChipSelector = OutputSelector<IRootRendererState, Array<ISearchChip>, (res: {[id:string]:Array<ISearchChipData>}) => Array<ISearchChip>>

export function makeSearchChipsSelector<
  T = any,
  PK = any,
  DB extends Dexie = typeof db,
  TableName extends keyof DB = DB[TableName] extends IDataSet<T> ? TableName : never,
  P extends SearchProvider<DB, TableName,T,PK,any> = SearchProvider<DB, TableName,T,PK,any>
>(
  id: string,
  tableName:TableName,
  provider:P
): SearchChipSelector {
  return createSelector(
    (state:IRootRendererState) => state.UIState.searches,
    (searches: {[id:string]:Array<ISearchChipData>}):Array<ISearchChip> => {
      if (!searches || !searches[id])
        return []


      return provider.hydrate(searches[id])
    }

  )
}

// eslint-disable-next-line typescript/explicit-function-return-type
export function makeSearchDatasetSelector<
  T,
  PK,
  DB extends Dexie,
  TableName extends keyof DB,
  DataSetName extends Exclude<keyof DataState,"toJS">,
  P extends SearchProvider<DB, TableName,T,PK,any> = SearchProvider<DB, TableName,T,PK,any>
>(
  searchChipSelector:SearchChipSelector,
  dataSetName:DataSetName,
  provider:P
) {
  return createSelector(
    searchChipSelector,
    (state:IRootRendererState) => state.DataState[dataSetName] as any,
    (searchChips: Array<ISearchChip>, dataSet:IDataSet<T>):IDataSet<T> => {
      // if (!searchChips || !searchChips.length)
      //   return (dataSet || makeDataSet()) as IDataSet<T>


      const finalItems = provider.filter(searchChips,dataSet.data)
      return makeDataSet(finalItems) as IDataSet<T>

    }

  )
}

