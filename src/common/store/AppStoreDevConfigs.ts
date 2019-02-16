/**
 * Add dev tools support for viewing Redux Store state in Chrome dev tools
 * @param enhancers
 */
declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__:any
  }
}
export default function addDevMiddleware(enhancers):void {
  if (typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__) {
    enhancers.push(window.__REDUX_DEVTOOLS_EXTENSION__())
  }
}
