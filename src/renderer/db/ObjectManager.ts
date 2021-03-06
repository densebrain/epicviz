import Dexie from "dexie"
import {getValue, isDefined} from "typeguard"
import db from "./ObjectDatabase"
import getLogger from "../../common/log/Logger"
import {AppState} from "common/store/state/AppState"
import * as _ from 'lodash'
import {EnumEventEmitter} from "type-enum-events"
import Deferred from "common/Deferred"
import {nextTick} from "typedux"
import Scheduler, {ITimerRegistration} from "common/Scheduler"

const log = getLogger(__filename)

export enum ObjectEvent {
  Created = 1,
  Updated = 2,
  Deleted = 3,
  Loaded = 4,
  Synced = 5
}

export interface IObjectChange<T,PK> {
  type:ObjectEvent
  key:PK
  table:string
  obj:T
  oldObj:T
  mods:Partial<T>
}

// noinspection JSUnusedGlobalSymbols
export default abstract class ObjectManager<T, PK> extends EnumEventEmitter<ObjectEvent> {

  private static initialized = false

  private static managers = Array<ObjectManager<any,any>>()

  private static active = false

  private static updateManagerStatus() {
    this.managers.forEach(manager =>
      this.active ? manager.pause() : manager.resume()
    )
  }

  static init() {
    if (this.initialized) return
    this.initialized = true

    getStore().observe([AppState.Key],(appState:AppState) => {

    })
  }
  /**
   * Get the class name
   */
  get className() {
    return getValue(() => this.constructor.name, 'UNKNOWN')
  }

  private scheduledTimerReg:ITimerRegistration | null = null


  private syncDeferred:Deferred<boolean> | null = null
  private syncsPending = Array<[PK[],Deferred<boolean>]>()


  /**
   * Constructor takes the dexie table it's wrapping
   *
   * @param table
   * @param scheduledIntervalMillis
   */
  protected constructor(public table:Dexie.Table<T, PK>, public scheduledIntervalMillis:number = 60000) {
    super(ObjectEvent)
    ObjectManager.init()


    // ;(db as any).on('changes', (changes:Array<IObjectChange<T,PK>>) => {
    //   const
    //     tableChanges = changes.filter(change => change.table === this.table.name),
    //     changesByType = Object.entries(_.groupBy(tableChanges,'type'))
    //     .map(([type,changeGroup]) => changeGroup.reduce((changeGroupMap,change) => {
    //       changeGroupMap.data.push(change.obj || change.oldObj)
    //       return changeGroupMap
    //     },{type,data:Array<T>()} as any)) as Array<{type:ObjectEvent,data:Array<T|Array<T>>}>
    //
    //   changesByType.forEach(({type,data}) => {
    //     this.emit(type,_.flatten(data))
    //   })
    // })

    this.schedule()
  }



  private schedule() {
    if (this.scheduledTimerReg) {
      Scheduler.clear(this.scheduledTimerReg)
      this.scheduledTimerReg = null
    }

    if (this.scheduledIntervalMillis === -1)
      return

    this.scheduledTimerReg = Scheduler.createInterval(
      ():void => {
        if (this.syncDeferred) return
        this.sync()
      },
      this.scheduledIntervalMillis,
      ():void => {this.scheduledTimerReg = null}
    )
  }

  /**
   * Start the object manager
   */
  async start() {
    log.info(`Starting: ${this.className}`)

  }

  pause():void {

  }

  resume():void {

  }


  abstract async clear()

  /**
   * Get the primary key - must be implemented
   *
   * @param o
   */
  abstract getPrimaryKey(o:T):PK

  /**
   * Called when an object is removed
   *
   * @param {PK} key
   */
  abstract onRemove(key:PK)

  /**
   * Called when an object is changed
   *
   * @param {T} o
   */
  abstract onChange(o:T)

  /**
   * Delete an object
   *
   * @param key
   */
  async delete(key:PK):Promise<void> {
    await this.table.delete(key)
  }

  /**
   * Get a single local object
   *
   * @param key
   */
  async get(key:PK):Promise<T> {
    return await this.table.get(key)
  }

  /**
   * Save/Update
   *
   * @param o
   * @return {Promise<T>}
   */
  async save(o:T):Promise<T> {
    return await db.transaction("rw", this.table, async () => {
      const pk = await this.table.put(o)
      o = await this.table.get(pk)
      return o
    })
  }

  /**
   * Get all from DB
   */
  async all():Promise<T[]> {
    return await this.table.toArray()
  }

  protected abstract doSync(...keys:PK[]):Promise<boolean>
  /**
   * Sync with remote objects
   */
  async sync(...keys:PK[]):Promise<boolean> {
    try {
      if (this.syncDeferred) {
        const deferred = new Deferred<boolean>()
        this.syncsPending.push([keys, deferred])
        return deferred.promise
      } else {
        this.syncDeferred = new Deferred<boolean>(this.doSync(...keys))

        return await this.syncDeferred.promise.then(async (result) => {
          const syncsPending = this.syncsPending
          this.syncsPending = []
          this.syncDeferred = null

          if (syncsPending.length) {
            nextTick(() => {
              this.sync(...keys)
                .then(result => {
                  syncsPending.forEach(([keys, deferred]) => deferred.resolve(result))
                })
                .catch(err => log.error("Unable to sync", keys, err))
            })
          }
          return result
        })
      }
    } finally {
      await navigator.storage.persist()
    }
  }


}
