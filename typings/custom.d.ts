///<reference path="sugar-extended.d.ts"/>

declare module "*.png" {
	const content: any;
	export default content;
}
declare module "*.jpg" {
	const content: any;
	export default content;
}
declare module "*.svg" {
	const content: any;
	export default content;
}
declare module "*.gif" {
	const content: any;
	export default content;
}

declare module "worker-loader!*" {
	class WebpackWorker extends Worker {
		constructor();
	}
	
	export default WebpackWorker;
}
