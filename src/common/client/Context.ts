import {ILogger} from "common/log/Logger"



export async function makeReplContext(log: ILogger, dir: string): Promise<any> {
  const context = {} as any

  Object.assign(context, {
    maps: (await import("common/client/MapManagement")).makeMapManagement(log, context),
    pkg: (await import("common/client/PackageManagement")).makePackageManagement(log, context, dir),
    outputs: (await import("common/client/OutputManagement")).makeOutputManagement(log, context)
  })

  return context
}


// declare global {
//   interface IReplContext {
//     maps: MapManagementType
//     pkg: PackageManagementType
//     outputs: OutputManagementType
//   }
//
//   // interface IReplContext extends ReplContext {
//   //
//   // }
// }
