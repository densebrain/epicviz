import {ILogger} from "common/log/Logger"
import {workerRequire} from "common/util/Require"
import {isString} from "typeguard"
import * as Fs from "fs"
import {spawn} from "child_process"
import {readAllOutput, waitForExit} from "common/util/Exec"
import * as Path from "path"



export function makePackageManagement(log:ILogger,context, dir: string): any {

  async function npm(cmdArgs:string[] | string):Promise<void> {
    const
      npmPath = workerRequire.resolve("npm/bin/npm-cli.js"),
      //lodashPath = workerRequire.resolve("lodash"),
      //npmPath = workerRequire.resolve("yarn/lib/cli.js"),
      args = isString(cmdArgs) ? cmdArgs.split(" ") : cmdArgs,
      nodeCmd = process.argv[0]

    log.info("NPM execute with args", ...args)
    try {
      const tmpFile = `/tmp/epicviz-npm-${Date.now()}`
      Fs.writeFileSync(tmpFile,`
      console.log("CWD",process.cwd())
      require("${npmPath}")`)
      log.info("Created script", tmpFile)

      // @ts-ignore
      //Fs.chmodSync(tmpFile,parseInt('777',8))

      const
        proc = spawn(process.argv[0], [tmpFile,...args], {
          cwd: dir,
          env: {
            //PATH: `${process.env.PATH}`,
            ELECTRON_RUN_AS_NODE: "true"
          }
        })

      await readAllOutput(proc, (type, line) => {
        if (type === "stdout")
          log.info(line)
        else
          log.warn(line)
      })

      await waitForExit(proc)
    } catch (err) {
      log.error("Unable to install pkg", err)
      throw err
    }
  }

  const install = async (name: string): Promise<void> => {
    if (!Fs.existsSync(Path.resolve(dir,"package.json"))) {
      await npm("init -y")
    }

    await npm(`install ${name}`)
  }

  return {
    install
  }
}

// const DummyType = (false as true) && makePackageManagement(null,null,null)
//
// export type PackageManagementType = typeof DummyType
