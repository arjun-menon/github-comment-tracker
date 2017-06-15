// ==UserScript==
// This script works on the PR page.
// @match https://github.com/*
// ==/UserScript==

const app = firebase.initializeApp({
  apiKey: "AIzaSyBb_2bG5cUaW25MfCdaDP7l5HF8UbF2QR0",
  authDomain: "ghct-79a7b.firebaseapp.com",
  databaseURL: "https://ghct-79a7b.firebaseio.com",
  projectId: "ghct-79a7b",
  storageBucket: "ghct-79a7b.appspot.com",
  messagingSenderId: "45909398186"
});
const database = firebase.database();

const findAllThreads = function () {
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

let allThreads;
let initalCanBeMerged = false;

const checkThreads = function () {
  const newThreads = findAllThreads();
  if (_.isEqual(_.pluck(newThreads, 'id'), _.pluck(allThreads, 'id'))) {
    if (_.isEqual(_.pluck(newThreads, 'lastCommentId'), _.pluck(allThreads, 'lastCommentId'))) {
      return;
    }
  }
  resetManipulations();
};

const resetManipulations = function () {
  allThreads = findAllThreads();

  Promise.all(allThreads.map(info => firebase.database().ref('testing_zone/' + info.id).once('value'))).then(snapshots => {
    allThreads.forEach((info, i) => {
      const result = snapshots[i].val();
      if (result) {
        info.resolved = result.resolved && result.lastCommentSeen === info.lastCommentId;
        info.lastCommentSeen = result.lastCommentSeen;
      }
      updateThread(info, {suppressMergeUpdate: true});
    });
    expandUnresolvedThreads();
    updateMergeButton();
  });
};

const main = function () {
  resetManipulations();

  // waitForKeyElements will trigger for *each* changed/added element.
  // Debounce both to only call checkThreads once, and to call with a slight
  // delay for better compatiblity with the WideGithub extension:
  // https://chrome.google.com/webstore/detail/wide-github/kaalofacklcidaampbokdplbklpeldpj
  const debouncedCheckThreads = _.debounce(checkThreads, 100);
  waitForKeyElements('.comment', debouncedCheckThreads);

  const pollInterval = 60000;
  setInterval(resetManipulations, pollInterval);
};

const expandUnresolvedThreads =  function () {
  _.each(allThreads, function (info) {
    if (!info.resolved) {
      const id = info.id;
      const elem = $('#' + id).first();
      const container = elem.parents('.outdated-comment');
      if (container.length > 0) {
        container.removeClass('closed').addClass('open');
      }
    }
  });
};

const allThreadsResolved = function () {
  return _.all(allThreads, function (info) {
    return info.resolved;
  });
};

const updateMergeButton = function () {
  if (!initalCanBeMerged) {
    initalCanBeMerged = $('.js-merge-branch-action').hasClass('btn-primary');
  }
  $('.comment-track-status').remove();

  if (initalCanBeMerged) {
    if (allThreadsResolved()) {
      // Make button green
      $('.js-merge-branch-action').addClass('btn-primary');
      $('.branch-action').addClass('branch-action-state-clean').removeClass('branch-action-state-dirty');
      $('.status-heading').text('This pull request can be automatically merged.');
      $('.status-meta').text('Merging can be performed automatically.');
      $('.branch-action-item-icon').removeClass('completeness-indicator-problem').addClass('completeness-indicator-success').html('<svg aria-hidden="true" class="octicon octicon-alert" height="16" role="img" version="1.1" viewBox="0 0 12 16" width="12"><path d="M12 5L4 13 0 9l1.5-1.5 2.5 2.5 6.5-6.5 1.5 1.5z"></path></svg>');
    } else {
      // Make button grey
      $('.js-merge-branch-action').removeClass('btn-primary');
      $('.branch-action').removeClass('branch-action-state-clean').addClass('branch-action-state-dirty');
      $('.status-heading').text('Merge with caution!');
      $('.status-meta').text('You have unresolved comments!');
      $('.branch-action-item-icon').removeClass('completeness-indicator-success').addClass('completeness-indicator-problem').html('<svg aria-hidden="true" class="octicon octicon-alert" height="16" role="img" version="1.1" viewBox="0 0 16 16" width="16"><path d="M15.72 12.5l-6.85-11.98C8.69 0.21 8.36 0.02 8 0.02s-0.69 0.19-0.87 0.5l-6.85 11.98c-0.18 0.31-0.18 0.69 0 1C0.47 13.81 0.8 14 1.15 14h13.7c0.36 0 0.69-0.19 0.86-0.5S15.89 12.81 15.72 12.5zM9 12H7V10h2V12zM9 9H7V5h2V9z"></path></svg>');
    }
  } else {
    if (!allThreadsResolved()) {
      $('.merge-message').before(
        '<div class="branch-action-item comment-track-status">' +
        '    <div class="branch-action-item-icon completeness-indicator completeness-indicator-problem">' +
        '      <svg aria-hidden="true" class="octicon octicon-alert" height="16" role="img" version="1.1" viewBox="0 0 16 16" width="16"><path d="M15.72 12.5l-6.85-11.98C8.69 0.21 8.36 0.02 8 0.02s-0.69 0.19-0.87 0.5l-6.85 11.98c-0.18 0.31-0.18 0.69 0 1C0.47 13.81 0.8 14 1.15 14h13.7c0.36 0 0.69-0.19 0.86-0.5S15.89 12.81 15.72 12.5zM9 12H7V10h2V12zM9 9H7V5h2V9z"></path></svg>' +
        '    </div>' +
        '    <h4 class="status-heading">This branch has unresolved comments</h4>' +
        '      <span class="status-meta">' +
        '        See above for red unresolved comments' +
        '      </span>' +
        '  </div>'
      );
    }
  }
};

const makeButton = function (elem, threadInfo) {
  const e = $(elem);
  e.find('.comment-track-action').remove();

  let actionSelector = '.review-comment-contents';
  if (e.find(actionSelector).length === 0) {
    actionSelector = '.timeline-comment-actions';
  }

  if (threadInfo.resolved) {
    e.find(actionSelector).prepend('<span class="octicon comment-track-action comment-track-unresolve"></span>');

    e.find('.comment-track-unresolve').on('click', function (event) {
      event.preventDefault();

      firebase.database().ref('testing_zone/' + threadInfo.id).set({resolved: false, lastCommentSeen: null});
      threadInfo.resolved = false;

      updateThread(threadInfo);
    });
  } else {
    e.find(actionSelector).prepend('<span class="octicon comment-track-action comment-track-resolve"></span>');

    e.find('.comment-track-resolve').on('click', function (event) {
      event.preventDefault();

      firebase.database().ref('testing_zone/' + threadInfo.id).set({resolved: true, lastCommentSeen: threadInfo.lastCommentId});
      threadInfo.resolved = true;

      updateThread(threadInfo);
    });
  }
};

const updateThread = function (info, options) {
  options = options || {};
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

  if (!options.suppressMergeUpdate) {
    updateMergeButton();
  }
};

main();
