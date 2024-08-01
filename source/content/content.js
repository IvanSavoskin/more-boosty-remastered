import * as domHelpers from './domHelpers.js'
import optionsStorage from '../global/options-storage.js'

const root = document.querySelector('div#root')
const body = document.querySelector('body')
let options = null

/**
 * Process audio players in root
 */
const processAudioPlayers = () => {
  const audioPlayers = root.querySelectorAll('div[class*=AudioBlock_root_]:not([data-complete=true])')

  for (const player of audioPlayers) {
    // Skip nodes from app/messages
    if (player.classList.value.includes(['Messages_audioPlayer_'])) continue

    domHelpers.injectAudioPlayerChanges(player, options)
    player.dataset.complete = true
  }
}

/**
 * Process video players in root
 */
const processVideoPlayers = () => {
  const playerShadowRootContainers = root.querySelectorAll('vk-video-player .shadow-root-container:not([data-complete=true])')

  for (const playerShadowRootContainer of playerShadowRootContainers) {
    domHelpers.injectVkPlayerChanges(playerShadowRootContainer, options)
    playerShadowRootContainer.dataset.complete = true
  }
}

/**
 * Inject extension icon to the top left menu
 * @returns {boolean}
 */
const injectExtensionIcon = () => {
  const topMenuLeft = body.querySelector('div[class*=TopMenu_left_]')
  if (!topMenuLeft) {
    console.warn('No topMenu found??? skipping for now')
    return false
  }

  domHelpers.injectIconInTopMenu(topMenuLeft)

  if (location.hash && location.hash.includes('mb_update')) {
    location.href = '#'

    const changelogButton = body.querySelector('a#MB_changelog')
    changelogButton.click()
  }

  return true
}

/**
 * Inject theater mode
 */
const processTheaterMode = (isActive = null) => {
  if (!options.theater_mode) return

  if (isActive) {
    domHelpers.injectStreamPageChanges(isActive)
    return
  }

  isActive = false
  if (window.location.href.includes('/video_stream')) {
    isActive = true
  }

  domHelpers.injectStreamPageChanges(isActive)
}

/**
 * Inject full layout
 */
const injectFullLayout = () => {
  if (options.full_layout) domHelpers.injectFullLayout()
}

/**
 * Main function
 * @async
 */
const main = async () => {
  options = await optionsStorage.getAll()
  if (!options) {
    console.warn('no options???')
    return
  }

  // 1. Permanent changes
  const isExtensionIconInjected = injectExtensionIcon()
  injectFullLayout()
  processAudioPlayers()
  processVideoPlayers()
  processTheaterMode()

  // 2. Dynamic changes
  const observer = new MutationObserver((mutations, _observer) => {
    try {
      processAudioPlayers()
      processVideoPlayers()

      // Checks for streamer page
      for (const mutation of mutations) {
        if (!isExtensionIconInjected && mutation.target.id === 'root') {
          console.debug('deffered injectExtensionIcon()')
          injectExtensionIcon()
        }

        for (const node of mutation.addedNodes) {
          if (node.classList?.value.includes('StreamPage_block_')) {
            processTheaterMode(true)
          }
        }

        for (const node of mutation.removedNodes) {
          if (node.classList?.value.includes('StreamPage_block_')) {
            processTheaterMode(false)
          }
        }
      }
    } catch (error) {
      console.log('uncaught mutation error', error)
    }
  })

  observer.observe(root, {
    childList: true,
    subtree: true
  })
}

console.log('💈 Content script loaded for', chrome.runtime.getManifest().name)
main()
