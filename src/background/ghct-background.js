import * as firebase from 'firebase/app'
import 'firebase/database'
import * as Parse from 'parse'

firebase.initializeApp({
  apiKey: 'AIzaSyBb_2bG5cUaW25MfCdaDP7l5HF8UbF2QR0',
  authDomain: 'ghct-79a7b.firebaseapp.com',
  databaseURL: 'https://ghct-79a7b.firebaseio.com',
  projectId: 'ghct-79a7b',
  storageBucket: 'ghct-79a7b.appspot.com',
  messagingSenderId: '45909398186'
})

Parse.initialize('ghct')
Parse.serverURL = 'https://ghct.herokuapp.com/1'
const parseQuery = new Parse.Query(Parse.Object.extend('CommentTracker'))
const queryParse = (id, callback) => parseQuery.containedIn('commentId', [id]).first().then(callback)

const browser = chrome || browser // eslint-disable-line no-use-before-define

browser.runtime.onConnect.addListener(port => {
  const path = 'testing_zone/' + port.name
  const ref = firebase.database().ref(path)

  const valueListener = ref.on('value', snapshot => {
    const id = snapshot.key
    const value = snapshot.child('resolved').val()

    if (value === null) {
      queryParse(id, pValue => {
        if (pValue !== undefined) {
          if (pValue.attributes.resolved === false || pValue.attributes.resolved === true) {
            console.log('p:', pValue, pValue.attributes.resolved)
            ref.set(pValue.attributes.resolved)
            port.postMessage({id, resolved: pValue.attributes.resolved})
          }
        }
      })
    }

    port.postMessage({id, resolved: !!value})
  })

  port.onMessage.addListener(m => {
    ref.set(m)
  })

  port.onDisconnect.addListener(() => {
    ref.off('value', valueListener)
  })
})
