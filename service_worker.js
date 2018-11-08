// adapted from http://craig-russell.co.uk/2016/01/29/service-worker-messaging.html#.WaQ7jXUjH0o
console.info("Service Worker Startup")

const MASTER = 1
const SLAVE  = 0

const cacheVersion = 'v4'
const preCacheFiles = [
]

self.addEventListener('install', event => {
  console.info('installing service worker')
  event.waitUntil(
    caches.open(cacheVersion).then(function(cache) {
      console.info("pre-caching cache-list: ")
      console.info(preCacheFiles)
      return cache.addAll(preCacheFiles)
    }).then(function() {
      console.info('service worker installed')
      return self.skipWaiting()
    })
  )
})

self.addEventListener('activate', function(event){
  console.info('activated!')
  event.waitUntil(clients.claim())
})

self.addEventListener('message', function(event){
  console.info("Service Worker Received Message:");
  console.info(event.data)
  switch(event.data.action){
    case 'CLAIM_MASTER_TAB':
    case 'REJECT_MASTER_TAB':
      send_message_to_all_clients({action: 'SET_TAB_STATUS', status: SLAVE}, {excludeClientIds: [event.source.id]})
      break
    case 'NUMBER_UPDATE':
      send_message_to_all_clients({action: 'UPDATE_NUMBER'}, {excludeClientIds: [event.source.id]})
      break
    default:
      send_message_to_all_clients(event.data, {excludeClientIds: [event.source.id]})
      break
  }
});

function send_message_to_all_clients(msg, options){
  let defaultOptions = {
    excludeClientIds: []
  }
  options = Object.assign({}, defaultOptions, options)
  clients.matchAll().then(clients => {
    clients.forEach(client => {
      if(options["excludeClientIds"].indexOf(client.id) < 0){
        send_message_to_client(client, msg)
      }
    })
  })
}

function send_message_to_client(client, msg){
  return new Promise(function(resolve, reject){
    var msg_chan = new MessageChannel();
    client.postMessage(msg, [msg_chan.port2])
  })
}


self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET'){
    console.info("only get requests supported")
    return
  }
  if(event.request.url.match("slides")){
    console.info("using default behavior for " + event.request.url)
    return
  }
  event.respondWith(
    caches.match(event.request).then(function(resp) {
      if(resp){
        console.info("cached response for: " + event.request.url)
        return resp
      }
      else{
        console.info("not cached for: " + event.request.url)
        return resp || fetch(event.request).then(function(response) {
          let r2 = response.clone()
          caches.open(cacheVersion).then(function(cache) {
            cache.put(event.request, r2)
          })
          return response
        })
      }
    }).catch(function(error) {
      console.info(error)
    })
  )}
)