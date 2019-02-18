import {makeMapManagement, MapManagementType} from "common/client/MapManagement"
import {makePackageManagement, PackageManagementType} from "common/client/PackageManagement"
import {ILogger} from "common/log/Logger"
import {makeOutputManagement, OutputManagementType} from "common/client/OutputManagement"

declare global {
  interface IReplContext {
    maps: MapManagementType
    pkg: PackageManagementType
    outputs: OutputManagementType
  }
}
export function makeReplContext(log:ILogger,dir:string):IReplContext {
  const context:IReplContext = {} as any
  Object.assign(context,{
    maps: makeMapManagement(log,context),
    pkg: makePackageManagement(log,context,dir),
    outputs: makeOutputManagement(log,context)
  })
  return context
}
