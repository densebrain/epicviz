import getLogger from "common/log/Logger"
import * as Path from "path"
import * as Fs from "async-file"
import {shortId} from "common/IdUtil"
import {IMapPathConfig, MapCoordinateRowType} from "common/models/MapManagementTypes"
import * as _ from 'lodash'
import {Plot2DConfig, Plot2DRowType} from "common/models/PlotManagementTypes"


const log = getLogger(__filename)

export interface ISnippet {
  id:string
  name:string
  code:string
  timestamp:number
  output:any[]
}

export type OutputType = "map-path" | "plot-2d"

export type RowTypes<Type extends OutputType = any> =
  Type extends "map-path" ? MapCoordinateRowType :
  Type extends "plot-2d" ? Plot2DRowType :
    never

export type DataConfigTypes<Type extends OutputType = any> =
  Type extends "map-path" ? IMapPathConfig :
  Type extends "plot-2d" ? Plot2DConfig :
  never

export interface IDataSet<Type extends OutputType = any> {
  config: DataConfigTypes<Type>
  columns:Array<string>
  rows:Array<RowTypes<Type>>
}

export interface IOutput<Type extends OutputType = any> {
  id:string
  name:string
  type:Type
  dataSets:Array<IDataSet<Type>>
}

export function makeOutput<T extends OutputType>(name:string,type:T):IOutput<T> {
  return {
    id: shortId(),
    name,
    type,
    dataSets: Array<IDataSet<T>>()
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

  savedSnippets = Array<ISnippet>()

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
        savedSnippets: this.savedSnippets,
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

export interface IWorkspaceRunner {
  executeRunRequest(dir: string, command: WorkspaceRunCommand, payload?: ISnippet | null, onOutput?: ((output: any[]) => void) | null): Promise<IWorkspaceRunResponseResult>
}

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

