import * as firebase from 'firebase/app'
import 'firebase/database'

firebase.initializeApp({
  apiKey: 'AIzaSyBb_2bG5cUaW25MfCdaDP7l5HF8UbF2QR0',
  authDomain: 'ghct-79a7b.firebaseapp.com',
  databaseURL: 'https://ghct-79a7b.firebaseio.com',
  projectId: 'ghct-79a7b',
  storageBucket: 'ghct-79a7b.appspot.com',
  messagingSenderId: '45909398186'
})

const browser = chrome || browser // eslint-disable-line no-use-before-define

browser.runtime.onConnect.addListener(port => {
  const path = 'testing_zone/' + port.name
  const ref = firebase.database().ref(path)

  const valueListener = snapshot => {
    const id = snapshot.key
    const resolved = !!snapshot.child('resolved').val()
    port.postMessage({id, resolved})
  }
  ref.on('value', valueListener)

  port.onMessage.addListener(m => {
    ref.set(m)
  })

  port.onDisconnect.addListener(() => {
    ref.off('value', valueListener)
  })
})
