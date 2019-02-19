//import * as L from "leaflet"
import {ILogger} from "common/log/Logger"

const L = require("leaflet")

// eslint-disable-next-line
export function makeMapManagement(log:ILogger,context) {

  return {
    createMap(options = {} as any) {
      _.defaults(options,{
        center: [51.505, -0.09],
        zoom: 17
      })

      const outputView = document.getElementById("output-view") as HTMLIFrameElement
      const container = outputView.contentDocument.body.querySelector("#content") as HTMLDivElement
      return L.map(container).setView(options.center, options.zoom)

    },
    addOSMLayer(map:any) {
      const osmUrl='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      const osmAttrib='Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors';
      const osm = new L.TileLayer(osmUrl, {minZoom: 8, maxZoom: 12, attribution: osmAttrib});

      // start the map in South-East England
      map.setView(new L.LatLng(51.3, 0.7),9);
      map.addLayer(osm);

      return map
    }
  }
}
//
// const DummyType = (false as true) && makeMapManagement(null,null)
//
// export type MapManagementType = typeof DummyType
