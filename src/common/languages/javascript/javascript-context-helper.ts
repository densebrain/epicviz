import * as CodeMirror from "codemirror"
// noinspection ES6UnusedImports
import * as ShowHint from 'codemirror/codemirror-showhint'
import getLogger from "common/log/Logger"

const log = getLogger(__filename)

export function getContextCompletions(editor:CodeMirror.Editor, context:any):string[] {
  const lastToken = editor.getTokenAt((editor as any).getCursor())
  const lastPart = lastToken.string
  // found = [],
  //   function maybeAdd(str:string):void {
  //   if (str.indexOf(query) == 0) found.push(str)
  // }
  // function gatherCompletions(obj:any):void {
  //   if (isString(obj)) stringProps.forEach(maybeAdd)
  //   else if (obj instanceof Array) arrayProps.forEach(maybeAdd)
  //   else if (obj instanceof Function) funcProps.forEach(maybeAdd)
  //   for (const name in obj) {
  //     // noinspection JSUnfilteredForInLoop
  //     maybeAdd(name)
  //   }
  // }


  let parts = [lastPart]
  const cursor = (editor as any).getCursor()
  let nextToken = lastToken
  while(nextToken !== null && nextToken.start > 0) {
    nextToken = editor.getTokenAt(new CodeMirror.Pos(cursor.line,nextToken.start))
    if (nextToken) {
      parts.unshift(nextToken.string)
    }
  }

  parts = parts.filter(part => part !== ".")
  if (lastPart === ".")
    parts.push("")

  //log.info("All parts", parts)
  const result = parts.reduce((obj,part,index) => {
    const isLast = index === parts.length - 1
    if (!obj) {
      return []
    } else if (isLast) {
      return Object.keys(obj)
        .filter((name:string) => part === "" || name.startsWith(part))
        .map(name => {
          // const detail = "" + (name as any)
          // Object.defineProperty(detail,"prop",{ value: [...parts.slice(0,parts.length - 1),detail].join(".") })
          return {name,prop: [...parts.slice(0,parts.length - 1),name].join(".")}
        })
    } else {
      return obj[part]
    }
  },context as any)

  log.info("result",result)

  return result
  //
  // if (context) {
  //   // If this is a property, see if it belongs to some object we can
  //   // find in the current environment.
  //
  //
  // }
  // else {
  //   // If not, just look in the window object and any local scope
  //   // (reading into JS mode internals to get at the local variables)
  //   for (let v = token.state.localVars; v; v = v.next)
  //     maybeAdd(v.name)
  //
  //   gatherCompletions(window)
  //   //forEach(keywords, maybeAdd)
  // }
  //return found as any
}
