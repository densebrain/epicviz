import {Color} from "csstype"

export type MapCoordinateRowType = {
  latitude: number,
  longitude: number
}

export interface IMapPathConfig {
  color?: Color | null
}
