import {makeMapManagement} from "common/client/MapManagement"
import {makePackageManagement} from "common/client/PackageManagement"
import {ILogger} from "common/log/Logger"
import {makeOutputManagement} from "common/client/OutputManagement"


// eslint-disable-next-line
export function makeReplContext(log:ILogger,dir:string) {
  const context = {}
  
  Object.assign(context,{
    maps: makeMapManagement(log,context),
    pkg: makePackageManagement(log,context,dir),
    outputs: makeOutputManagement(log,context)
  })
  
  return context
}
