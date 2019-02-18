import getLogger from "common/log/Logger"
import * as Path from "path"
import * as Fs from "async-file"
import {shortId} from "common/IdUtil"
import {IMapPathConfig, MapCoordinateRowType} from "common/client/MapManagementTypes"
import {getWorkspace} from "renderer/actions/WorkspaceActions"


const log = getLogger(__filename)

export interface ISnippet {
  id:string
  name:string
  code:string
  timestamp:number
  output:any[]
}

export type OutputType = "map-path"

export type RowTypes<Type> = Type extends "map-path" ?
  MapCoordinateRowType :
  never

export interface IDataSet<RowType = any> {
  config: IMapPathConfig
  columns:Array<string>
  rows:Array<RowType>
}

export interface IOutput<Type = any> {
  id:string
  name:string
  type:Type
  dataSets:Array<IDataSet<RowTypes<Type>>>
}

export function makeOutput<T extends OutputType>(type:T):IOutput<T> {
  return {
    id: shortId(),
    name: `Output-${getWorkspace().history.length + 1}`,
    type,
    dataSets: Array<IDataSet<RowTypes<T>>>()
  }
}

export function makeSnippet(name:string = "", code:string = "",timestamp:number = Date.now(), output:any[] = []):ISnippet {
  return {
    id: shortId(),
    name,
    code,
    timestamp,
    output
  }
}

export class Workspace {

  history = Array<ISnippet>()

  snippet:ISnippet = makeSnippet()

  filename:string

  outputs = Array<IOutput>()

  constructor(public dir:string) {
    this.filename = Workspace.makeWorkspaceFile(dir)
  }

  patch(patch:Partial<Workspace>):this {
    return Object.assign(_.clone(this),patch)
  }

  patchSnippet(snippet:Partial<ISnippet>):this {
    return this.patch({
      snippet: {
        ...this.snippet,
        ...snippet
      }
    })
  }

  async save():Promise<void> {
    const
      filename = this.filename,
      state = {
        history: this.history.map(it => ({...it,output:[]})),
        snippet: this.snippet,
        outputs: []
      }

    log.info("Saving",filename)
    await Fs.writeFile(filename,JSON.stringify(state))
  }

  static async load(dir:string):Promise<Workspace> {
    const
      filename = this.makeWorkspaceFile(dir),
      workspace = new Workspace(dir)

    try {
      if (await Fs.exists(filename)) {
        const state = JSON.parse(await Fs.readFile(filename, "utf8"))
        Object.assign(workspace, state)
      }
    } catch (err) {
      log.error("Unable to load workspace content",err)
    }
    return workspace
  }

  static makeWorkspaceFile(dir:string):string {
    return Path.resolve(dir,"workspace.json")
  }
}

export enum WorkspaceRunStatus {
  Created,
  Success,
  Error,
  CompileError,
  TransmitError
}

export type WorkspaceRunCommand = "init" | "execute"

export interface IWorkspaceRunRequest {
  id:string
  command: WorkspaceRunCommand
  dir:string
  payload:ISnippet
}

export type WorkspaceRunResponseType = "result" | "output"

export interface IWorkspaceRunResponseResult {
  status: WorkspaceRunStatus
  message?: string | null
  stack?:string | null
  output?: any | null
  error?: Error | null
}

export type WorkspaceRunResponsePayload<Type> = Type extends "result" ?
  IWorkspaceRunResponseResult :
    Type extends "output" ?
      any[] :
      never

export interface IWorkspaceRunResponse<Type extends WorkspaceRunResponseType = any> {
  id:string
  type: Type

  payload: WorkspaceRunResponsePayload<Type>

}

