import {convertEnumValuesToString} from "common/ObjectUtil"

export enum CommonElement {
  App,
  Settings,
  Repl,
  Dialog,
  NotificationsList
}

export const CommonElementIds = convertEnumValuesToString(CommonElement)

export default CommonElementIds
