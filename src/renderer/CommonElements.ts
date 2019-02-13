import {convertEnumValuesToString} from "common/ObjectUtil"

export enum CommonElement {
  App,
  Settings,
  Dialog,
  NotificationsList
}

export const CommonElementIds = convertEnumValuesToString(CommonElement)

export default CommonElementIds
