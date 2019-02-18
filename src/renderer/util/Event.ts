
export function stopEvent(event:Event):void {
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
}
