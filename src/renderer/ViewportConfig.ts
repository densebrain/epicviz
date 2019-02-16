
import * as $ from 'jquery'

const appEl = $("#app")

$("body, #app").css({
  width: "100vw",
  maxWidth: "100vw",
  height: "100vh",
  maxHeight: "100vh",
  overflow: "hidden",
  border: 0,
  margin: 0,
  padding: 0
})



$('body').append($(`
    <div class="diagnostics"></div>
    <div class="logging"></div>
    <div class="completion"></div>
    <div class="error"></div>
`))

export {}
