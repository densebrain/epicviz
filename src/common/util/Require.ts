export const realRequire = __non_webpack_require__

const
  Path = realRequire("path"),
  Module = realRequire("module"),
  Process = realRequire("process")

export const workerRequire = Module.createRequireFromPath(
    Path.resolve(Process.cwd(), "node_modules")
  )
