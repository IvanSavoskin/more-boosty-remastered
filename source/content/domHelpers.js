import * as templates from './templates.js'
import * as playerChanges from './playerChanges.js'

/** @see {@link scrollEvent} */
let topMenu

/** @see {@link injectStreamPageChanges} */
let body

/**
 * Prepares to inject VK player changes using one-time event listener
 * @param {Element} element `.shadow-root-container` node
 * @param {OptionsSync.UserOptions} options Extension options
 */
export const injectVkPlayerChanges = (element, options) => {
  const playerWrapper = element.shadowRoot.querySelector('div.player-wrapper div.container')

  playerWrapper.addEventListener(
    'click',
    (event) => {
      playerChanges.prepareVideoPlayer(event, options)
    },
    { once: true }
  );
}

/**
 * Prepares to inject audio player changes using one-time event listeners
 * @param {Element} element player node
 * @param {OptionsSync.UserOptions} options Extension options
 * @returns
 */
export const injectAudioPlayerChanges = (element, options) => {
  playerChanges.prepareAudioPlayer(element, options)
}

/**
 * Inject extension icon in top menu on the left
 * @param {Element} element top menu left element
 */
export const injectIconInTopMenu = (element) => {
  element.lastElementChild.insertAdjacentHTML('afterEnd', templates.changelogButton())

  const changelogButton = element.querySelector('a#MB_changelog')
  changelogButton.addEventListener('click', (event) => {
    event.preventDefault()
    prepareChangelogModal()
  })
}

/**
 * Prepare changelog modal
 */
const prepareChangelogModal = () => {
  document.querySelector('div[class^=App_app_]').insertAdjacentHTML('beforeEnd', templates.changelogModal())

  const changelogModal = document.querySelector('div#MB_changelog_modal')
  const changelogClose = document.querySelector('span#MB_changelog_close')

  changelogClose.addEventListener('click', (event) => {
    event.preventDefault()
    changelogModal.remove()
  })

  const optionsButton = changelogModal.querySelector('a#MB_optionsButton')
  optionsButton.addEventListener('click', openOptionsPage)
}

/**
 * Inject classes for widescreen layout
 */
export const injectFullLayout = () => {
  document.querySelector('body').classList.add('MB_active')
}

/**
 * Inject stream page stuff
 * @param {Element} element
 */
export const injectStreamPageChanges = (isActive) => {
  if (!body) body = document.querySelector('body')

  if (isActive) {
    body.classList.add('MB_stream')
    window.addEventListener('scroll', scrollEvent)
  } else {
    body.classList.remove('MB_stream')
    window.removeEventListener('scroll', scrollEvent)
  }
}

/**
 * Scroll event for stream page
 */
const scrollEvent = () => {
  if (!topMenu) topMenu = document.querySelector('div#topMenu')

  const scroll = window.scrollY
  if (scroll >= 1) {
    topMenu.classList.add('MB_scrolled')
  } else {
    topMenu.classList.remove('MB_scrolled')
  }
}

/**
 * Open options page for the extension
 * @param {Event} event
 */
const openOptionsPage = (event) => {
  event.preventDefault()
  chrome.runtime.sendMessage({ action: 'openOptionsPage' })
}
