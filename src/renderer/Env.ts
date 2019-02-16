/* eslint-disable typescript/no-namespace */

import {getValue} from "typeguard"
import {EventEmitter} from "events"

EventEmitter.defaultMaxListeners = Number.MAX_VALUE

Object.assign(global,{
	isDev: process.env.NODE_ENV !== 'production',
  nodeRequire: process.mainModule.require//typeof __non_webpack_require__ === 'undefined' ? (modName => null) : getValue(() => __non_webpack_require__,null)
})

declare global {
	const isDev:boolean
	const nodeRequire:NodeRequire
}

export {}
