import {workerRequire} from "common/util/Require"
import {spawn} from "child_process"
import {readAllOutput, waitForExit} from "common/util/Exec"


export async function npmInstall(dir:string, name:string):Promise<void> {
  const
    npmPath = workerRequire.resolve("npm/bin/npm-cli.js"),
    proc = spawn(process.argv[0],`${npmPath} install ${name}`.split(" "),{
      cwd: dir
    })
  
  await readAllOutput(proc,(type,line) => {
    if (type === "stdout")
      console.info(line)
    else
      console.error(line)
  })
  
  await waitForExit(proc)
}

