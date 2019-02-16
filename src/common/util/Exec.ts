import {ChildProcess} from "child_process"
import * as Stream from "stream"
import {chomp, chunksToLinesAsync} from "@rauschma/stringio"
import * as child_process from "child_process"

export async function readAllOutput(proc:child_process.ChildProcess, listener:(type:"stdout" | "stderr", line:string) => void):Promise<void> {
  await Promise.all([proc.stdout, proc.stderr].map(async(stream,index) => {
    for await (const line of chunksToLinesAsync(stream)) { // (C)
      listener(index === 0 ? "stdout" : "stderr",line)
    }
  }))
}

export function waitForExit(childProcess:ChildProcess):Promise<void> {
  return new Promise((resolve, reject) => {
    childProcess.once('exit', (code:number, signal:string) => {
      if (code === 0) {
        resolve(undefined);
      } else {
        reject(new Error('Exit with error code: ' + code));
      }
    })
    childProcess.once('error', (err:Error) => {
      reject(err);
    })
  })
}
