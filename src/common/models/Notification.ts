import {IconKey, IconType, IIcon, makeMUIIcon, makeOcticonIcon} from "common/models/Icon"

export enum NotificationType {
  Internal = "Internal"
}

export interface INotificationInternal {

}

export type NotificationPayload<Type extends NotificationType> = INotificationInternal

export interface INotification<Type extends NotificationType = any> {
  id:string
  type:Type
  reason: NotificationReason
  icon: IIcon<any>
  repo_full_name:string | null
  repo_id:number | null
  read:boolean
  updated_at:number
  payload:NotificationPayload<Type>
}

export const NotificationIndexes = {
  v1: "id,read,title,body,repo_full_name,updated_at"
}


export enum NotificationReason {
  info = "info",
  error = "error"
}



export const NotificationReasonIcons: {[Reason in NotificationReason]:IIcon<any>} = {
  info: makeMUIIcon("Info"),
  error: makeMUIIcon("Error")
}
