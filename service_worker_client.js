// adapted from http://craig-russell.co.uk/2016/01/29/service-worker-messaging.html#.WaQ7jXUjH0o

const MASTER = 1
const SLAVE  = 0
let   tabStatus = SLAVE

function renderStatus(status){
  if(status === MASTER){
    $(".circle").addClass('master')
  }
  else{
    $(".circle").removeClass('master')
  }
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service_worker.js')
  .then(function(registration) {
    console.log('Registration successful, scope is:', registration.scope)
  }).catch(function(err) {
    console.log('Service worker registration failed, error:', err)
  })

  function send_action_to_sw(action){
    navigator.serviceWorker.controller.postMessage(action)
  }
  window.send_action_to_sw = send_action_to_sw

  navigator.serviceWorker.addEventListener('message', event => {
    console.log("Message received from service worker")
    switch(event.data.action){
      case 'SET_TAB_STATUS':
        console.info("setting tab status")
        tabStatus = event.data.status
        renderStatus(tabStatus)
        break
      case 'UPDATE_NUMBER':
        var n = window.localStorage.getItem('n')
        $("#random-number").text(n)
        break
      default:
        console.info("Unknown Action")
        break
    }
  })
}
else{
  console.info("Sorry, this browser does not support service workers")
}

$(document).ready(()=>{
  var n
  if(n = window.localStorage.getItem('n')){
    $("#random-number").text(n)
  }
  $(".circle").click(function(event) {
    if (event.shiftKey) {
      send_action_to_sw({action: 'REJECT_MASTER_TAB'})
      tabStatus = SLAVE
    }
    else {
      send_action_to_sw({action: 'CLAIM_MASTER_TAB'})
      tabStatus = MASTER
    }
    renderStatus(tabStatus)
  })
  $(".generate-number").click(function(event) {
      if(tabStatus === MASTER){
        n = Math.random()
        $("#random-number").text(n)
        window.localStorage.setItem('n', n)
        send_action_to_sw({action: 'NUMBER_UPDATE'})
      }
      else{
        console.info("Slave cannot set number")
      }
  })
})


