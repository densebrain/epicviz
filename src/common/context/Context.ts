import {ILogger} from "common/log/Logger"



// eslint-disable-next-line
export async function makeReplContext(log: ILogger, dir: string) {
  const context = {}

  const completeContext = {
    maps: (await import("./MapManagement")).makeMapManagement(log, context),
    pkg:  (await import("./PackageManagement")).makePackageManagement(log, context, dir),
    outputs: (await import("./OutputManagement")).makeOutputManagement(log, context),
    plot: (await import("./PlotManagement")).makePlotManagement(log, context),
    snippets: (await import("./SnippetManagement")).makeSnippetManagement(log, context),

  }

  Object.assign(context,completeContext)

  return context as typeof completeContext
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
