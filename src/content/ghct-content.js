import $ from 'jquery'
import Rx from 'rxjs/Rx'
import './ghct-content.css'

const browser = chrome || browser
const ports = {}
const listenOn = (id, callback) => {
  if (!ports.hasOwnProperty(id))
    ports[id] = browser.runtime.connect({name: id})
  ports[id].onMessage.addListener(m => { callback(m) })
}
const setVal = (id, val) => {
  if (ports.hasOwnProperty(id))
    ports[id].postMessage(val)
}
const disconnect = id => {
  if (ports.hasOwnProperty(id)) {
    ports[id].disconnect()
    delete ports[id]
  }
}

const updateComment = ({id, resolved}) => {
  updateThread(id, resolved)
  if (!resolved) expandUnresolvedThread(id)
  const unresolvedCommentCount = document.getElementById('discussion_bucket')
    .getElementsByClassName('comment-track-resolve').length
  updateMergeButton(unresolvedCommentCount > 0)
}

const setListeners = () => {
  const discussionBucket = document.getElementById('discussion_bucket')
  if (!discussionBucket) return

  const discussionThreads = discussionBucket.querySelectorAll('.js-line-comments > .js-comments-holder')
  const issueComments = discussionBucket.querySelectorAll('.timeline-comment-wrapper > .timeline-comment.js-comment')

  discussionThreads.forEach((el) => {
    const comments = el.getElementsByClassName('js-comment')
    if (comments.length > 0 && el.tracked !== comments.length) {
      const firstCommentId = comments[0].id
      if (el.tracked > 0)
        disconnect(firstCommentId)
      listenOn(firstCommentId, updateComment)
      el.tracked = comments.length
    }
  })

  issueComments.forEach((el) => {
    if (el.id && el.id.match(/^issuecomment/) && !el.tracked) {
      listenOn(el.id, updateComment)
      el.tracked = true
    }
  })
}

const main = () => {
  setListeners()

  Rx.Observable.create((observer) => {
    observer.next()
    new MutationObserver(() => observer.next()).observe(document.body,
      {childList: true, attributes: false, characterData: false, subtree: true})
  }).debounceTime(500).subscribe(setListeners)
}

const expandUnresolvedThread = id => {
  const elem = $('#' + id).first()
  const container = elem.parents('.outdated-comment')
  if (container.length > 0) {
    container.removeClass('closed').addClass('open')
  }
}

const updateMergeButton = (unresolved) => {
  $('.comment-track-status').remove()
  const mergeButton = findMergeButton()
  if (unresolved && mergeButton) {
    mergeButton.insertAdjacentHTML('beforebegin',
      `<div class="branch-action-item comment-track-status">
          <div class="branch-action-item-icon completeness-indicator completeness-indicator-problem">
            <svg aria-hidden="true" class="octicon octicon-alert" height="16" role="img" version="1.1" viewBox="0 0 16 16" width="16"><path d="M15.72 12.5l-6.85-11.98C8.69 0.21 8.36 0.02 8 0.02s-0.69 0.19-0.87 0.5l-6.85 11.98c-0.18 0.31-0.18 0.69 0 1C0.47 13.81 0.8 14 1.15 14h13.7c0.36 0 0.69-0.19 0.86-0.5S15.89 12.81 15.72 12.5zM9 12H7V10h2V12zM9 9H7V5h2V9z"></path></svg>
          </div>
          <h4 class="status-heading">This branch has unresolved comments</h4>
            <span class="status-meta">
              See above for red unresolved comments
            </span>
        </div>`
    )
  }
}

const findMergeButton = () => {
  const mergeabilityDetailsDivs = document.getElementsByClassName('mergeability-details')
  if (mergeabilityDetailsDivs.length > 0) {
    const mergeMessageDivs = mergeabilityDetailsDivs[0].getElementsByClassName('merge-message')
    if (mergeMessageDivs.length > 0) { return mergeMessageDivs[0] }
  }
  return null
}

const makeButton = (elem, id, resolved) => {
  const e = $(elem)
  e.find('.comment-track-action').remove()

  let actionSelector = '.review-comment-contents'
  if (e.find(actionSelector).length === 0) {
    actionSelector = '.timeline-comment-actions'
  }

  if (resolved) {
    e.find(actionSelector).prepend('<span class="octicon comment-track-action comment-track-unresolve"></span>')
    e.find('.comment-track-unresolve').on('click', function (event) {
      event.preventDefault()
      setVal(id, {resolved: false})
    })
  } else {
    e.find(actionSelector).prepend('<span class="octicon comment-track-action comment-track-resolve"></span>')
    e.find('.comment-track-resolve').on('click', function (event) {
      event.preventDefault()
      setVal(id, {resolved: true})
    })
  }
}

const updateThread = (id, resolved) => {
  const elem = $('#' + id).first()

  if (!id.match(/^issuecomment/)) {
    const threadComments = $(elem).parents('.js-comments-holder').children('.js-comment')
    threadComments.each(function () {
      makeButton(this, id, resolved)
    })
  } else {
    makeButton(elem, id, resolved)
  }
}

main()
