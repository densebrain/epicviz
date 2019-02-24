//import * as L from "leaflet"
import {ILogger} from "common/log/Logger"

import * as vm from "vm"

// eslint-disable-next-line
export function makeSnippetManagement(log:ILogger,context) {

  return {
    /**
     * Run a snippet
     *
     * @param name
     * @param args
     */
    run: (name:string,...args:any[]):void => {
      const snippet = getWorkspace().savedSnippets.find(snippet => snippet.name.toLowerCase() === name.toLowerCase())
      if (!snippet) throw Error(`Unable to find snippet named ${name}`)
      const fn = vm.runInThisContext(`;(${snippet.code})`)
      return fn(...args)
    }
  }
}


// const DummyType = (false as true) && makeMapManagement(null,null)
//
// export type MapManagementType = typeof DummyType
