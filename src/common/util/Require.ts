import getLogger from "common/log/Logger"
import * as Fs from "fs"

export const realRequire = __non_webpack_require__

const
  log = getLogger(__filename),
  Path = realRequire("path"),
  Module = realRequire("module"),
  Process = realRequire("process")

export function makeRequireFromPath(...paths:string[]):NodeRequire {
  const newRequire = (id:string):any => {
    try {
      for (const path of paths) {
        const localPath = Path.resolve(path,id)
        if (Fs.existsSync(localPath)) {
          return realRequire(localPath)
        }
      }
    } catch (err) {
      return (realRequire as any)(id)
    }
  }

  Object.assign(newRequire,{
    ...realRequire
  })

  return newRequire as any
}

export const workerRequire = makeRequireFromPath(
    Path.resolve(Process.cwd(), "node_modules")
  )
