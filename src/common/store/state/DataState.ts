import {State} from "typedux"
import {DataType, IDataSet, IDataSyncStatus, makeDataSet} from "common/Types"
import {INotification} from "common/models/Notification"

//export type DataOwner = {[type in DataType]:type extends "notifications" ? IDataSet<INotification> : never }

const DefaultIssueEventData = {
  timeline: [],
  comments: [],
  events: []
}


export class DataState implements State<string> {
	static Key = "DataState"

	static fromJS(o:any = {}):DataState {
		return new DataState(o)
	}

	type = DataState.Key

	notifications: IDataSet<INotification> = makeDataSet()

	constructor(o:any = {}) {
		Object.assign(this,o)
	}

	toJS():Object {
		return {
			...this,
			//repos: makeDataSet(),

		}
	}


}
