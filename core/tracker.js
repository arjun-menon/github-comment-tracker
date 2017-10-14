
const findAllThreads = () => {
  const threads = [];
  const d = $('#discussion_bucket');

  d.find('.js-line-comments .js-comments-holder').each(function () {
    const childComments = $(this).children('.js-comment');
    if (childComments.length > 0) {
      const firstCommentChild = childComments.first()[0];
      threads.push({
        id: firstCommentChild.id,
        comments: childComments,
        lastCommentId: childComments.last()[0].id,
      });
    }
  });

  d.find('.timeline-comment-wrapper .timeline-comment.js-comment').each(function () {
    if (this.id && this.id.match(/^issuecomment/)) {
      threads.push({
        id: this.id,
        comments: $(this),
        lastCommentId: this.id,
      });
    }
  });

  return threads;
};

const setListeners = () => {
  const allThreads = findAllThreads();
  allThreads.forEach(info => {
    if (!info.listening) {
      commentRef(info.id).on('value', snapshot => {
        const val = snapshot.val();
        if (val) {
          info.resolved = val.resolved && val.lastCommentSeen === info.lastCommentId;
          info.lastCommentSeen = val.lastCommentSeen;
        }
        updateThread(info);
        expandUnresolvedThread(info);
        updateMergeButton(allThreads.some(info => !info.resolved));
      });
      info.listening = true;
    }
  });
};

const main = () => {
  initFirebase();
  setListeners();

  // waitForKeyElements will trigger for *each* changed/added element.
  // Debounce both to only call checkThreads once, and to call with a slight
  // delay for better compatiblity with the WideGithub extension:
  // https://chrome.google.com/webstore/detail/wide-github/kaalofacklcidaampbokdplbklpeldpj
  const debouncedCheckThreads = _.debounce(setListeners, 100);
  waitForKeyElements('.comment', debouncedCheckThreads);
};

const expandUnresolvedThread =  (info) => {
  if (!info.resolved) {
    const id = info.id;
    const elem = $('#' + id).first();
    const container = elem.parents('.outdated-comment');
    if (container.length > 0) {
      container.removeClass('closed').addClass('open');
    }
  }
};

const updateMergeButton = (unresolved) => {
  $('.comment-track-status').remove();
  if (unresolved)
    findMergeButton().insertAdjacentHTML('beforebegin',
      `<div class="branch-action-item comment-track-status">
          <div class="branch-action-item-icon completeness-indicator completeness-indicator-problem">
            <svg aria-hidden="true" class="octicon octicon-alert" height="16" role="img" version="1.1" viewBox="0 0 16 16" width="16"><path d="M15.72 12.5l-6.85-11.98C8.69 0.21 8.36 0.02 8 0.02s-0.69 0.19-0.87 0.5l-6.85 11.98c-0.18 0.31-0.18 0.69 0 1C0.47 13.81 0.8 14 1.15 14h13.7c0.36 0 0.69-0.19 0.86-0.5S15.89 12.81 15.72 12.5zM9 12H7V10h2V12zM9 9H7V5h2V9z"></path></svg>
          </div>
          <h4 class="status-heading">This branch has unresolved comments</h4>
            <span class="status-meta">
              See above for red unresolved comments
            </span>
        </div>`
    );
};

const findMergeButton = () => {
  const mergeabilityDetailsDivs = document.querySelectorAll('.mergeability-details');
  if (mergeabilityDetailsDivs.length > 0) {
    const mergeMessageDivs = mergeabilityDetailsDivs[0].querySelectorAll('.merge-message');
    if (mergeMessageDivs.length > 0)
      return mergeMessageDivs[0];
  }
  return null;
};

const updateInfo = (info, resolved, lastCommentSeen) => {
  commentRef(info.id).set({resolved, lastCommentSeen});
  info.resolved = resolved;
  updateThread(info);
};

const makeButton = (elem, info) => {
  const e = $(elem);
  e.find('.comment-track-action').remove();

  let actionSelector = '.review-comment-contents';
  if (e.find(actionSelector).length === 0) {
    actionSelector = '.timeline-comment-actions';
  }

  if (info.resolved) {
    e.find(actionSelector).prepend('<span class="octicon comment-track-action comment-track-unresolve"></span>');
    e.find('.comment-track-unresolve').on('click', function (event) {
      event.preventDefault();
      updateInfo(info, false, null);
    });
  } else {
    e.find(actionSelector).prepend('<span class="octicon comment-track-action comment-track-resolve"></span>');
    e.find('.comment-track-resolve').on('click', function (event) {
      event.preventDefault();
      updateInfo(info, true, info.lastCommentId);
    });
  }
};

const updateThread = (info) => {
  const id = info.id;
  const elem = $('#' + id).first();

  if (!id.match(/^issuecomment/)) {
    const threadComments = $(elem).parents('.js-comments-holder').children('.js-comment');
    threadComments.each(function () {
      makeButton(this, info);
    });
  } else {
    makeButton(elem, info);
  }
};

const commentRef = function(commentId) {
  return firebase.database().ref('testing_zone/' + commentId);
};

const initFirebase = () => {
  firebase.initializeApp({
    apiKey: "AIzaSyBb_2bG5cUaW25MfCdaDP7l5HF8UbF2QR0",
    authDomain: "ghct-79a7b.firebaseapp.com",
    databaseURL: "https://ghct-79a7b.firebaseio.com",
    projectId: "ghct-79a7b",
    storageBucket: "ghct-79a7b.appspot.com",
    messagingSenderId: "45909398186"
  });
};

main();
