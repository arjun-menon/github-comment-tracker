
const app = firebase.initializeApp({
  apiKey: "AIzaSyBb_2bG5cUaW25MfCdaDP7l5HF8UbF2QR0",
  authDomain: "ghct-79a7b.firebaseapp.com",
  databaseURL: "https://ghct-79a7b.firebaseio.com",
  projectId: "ghct-79a7b",
  storageBucket: "ghct-79a7b.appspot.com",
  messagingSenderId: "45909398186"
});
const database = firebase.database();

const commentRef = function(commentId) {
  return database.ref('testing_zone/' + commentId);
};

const globals = {
  allThreads: [],
  canBeMerged: false
};

globals.canBeMerged = $('.js-merge-branch-action').hasClass('btn-primary');
