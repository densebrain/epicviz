import {isString} from "typeguard"


//TypeLogger.setLogThreshold(TypeLogger.LogLevel.INFO)


//const LogQueueMaxRecords = 1000

export enum LogLevel {
  debug = 1,
  info,
  warn,
  error
}

export type LogEventListener = (level: LogLevel, tag: string, ...args: any[]) => boolean

export interface ILogger {
  verbose(...args: any[]): void

  debug(...args: any[]): void

  info(...args: any[]): void

  warn(...args: any[]): void

  error(...args: any[]): void

  wtf(...args: any[]): void

  on(listener: LogEventListener): void
  off(listener: LogEventListener): void
}

const LogLevelNames = Object.keys(LogLevel).filter(isString)
let Threshold = LogLevel.info

/**
 * Get a logger
 *
 * @param name
 * @returns {string}
 */
export function getLogger(name: string): ILogger {
  name = name.split('/').pop()!
  const listeners = Array<(level: LogLevel, tag: string, ...args: any[]) => void>()

  const newLogger = [...LogLevelNames, 'log'].reduce((logger: ILogger, level) => {
    logger[level as any] = (...args: any[]) => {
      const
        msgLevel = (LogLevel as any)[level as any] as LogLevel || LogLevel.info,
        sendToConsole = listeners.every(listener => !listener(level as any,name,...args)),
        console = (global as any).originalConsole || global.console

      if (!sendToConsole || console === logger || msgLevel < Threshold)
        return


      //baseLogger[level](name,...args)
      if (console[level as any]) {
        console[level as any](name, ...args)
      } else {
        console.log(name, ...args)
      }
    }
    return logger
  }, {
    isDebugEnabled
  } as any) as ILogger

  Object.assign(newLogger, {
    on: listener => listeners.push(listener),
    off: listener => {
      const index = listeners.findIndex(other => other === listener)
      if (index > -1)
        listeners.splice(index,1)
    }
  })

  return newLogger
}

export function setThreshold(threshold: LogLevel): void {
  Threshold = threshold
}

export function enableDebug(): void {
  setThreshold(LogLevel.debug)
}

export function isDebugEnabled(): boolean {
  return LogLevel.debug >= Threshold
}

export default getLogger
