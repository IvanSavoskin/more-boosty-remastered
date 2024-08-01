import * as templates from './templates.js'
import * as helpers from '../global/helpers.js'

// Content cache for videos
const contentCache = new Map()

// Previous playback rate for the speed controller
let previuosPlaybackRate = 1.0

/**
 * Inject VK player changes
 * @see {@link domHelpers.injectVkPlayerChanges} for event conditions
 * @param {Event} event
 * @param {OptionsSync.UserOptions} options Extension options
 */
export const prepareVideoPlayer = async (event, options) => {
  const playerRootNode = event.currentTarget.getRootNode()
  console.debug('player', playerRootNode)

  const playerWrapper = playerRootNode.querySelector('div.player-wrapper')
  console.debug('playerWrapper', playerWrapper)

  // Get content metadata
  const contentMetadata = getContentMetadata(playerWrapper)
  console.debug('contentMetadata', contentMetadata)
  if (contentMetadata.type === 'unknown') {
    console.warn('We don`t know this type of content.', playerWrapper)
  } else {
    // Get video ID from preview URL
    const videoId = getVideoId(playerWrapper)
    console.debug('videoId', videoId)

    // Get content components
    const contentComponents = await getContentComponents(contentMetadata)
    contentComponents?.forEach(component => {
      contentCache.set(component.videoId, component.videoUrls)
    })
    console.debug('contentComponents', contentComponents)
    console.debug('contentCache', contentCache)
  }

  // Get the last recorded playback rate
  const playbackRate = await getPlaybackRate()

  // Inject controls
  injectVideoControls(playerWrapper, contentMetadata.type !== 'unknown', playbackRate)

  // Force video quality
  if (options.force_video_quality) forceVideoQuality(playerWrapper, options.video_quality)

  // Save/retrieve timestamp
  if (options.save_last_timestamp) lastVideoTimestamp(playerWrapper)
}

/**
 * Inject audio player changes
 * @see {@link domHelpers.injectAudioPlayerChanges} for event conditions
 * @param {Event} event
 * @param {OptionsSync.UserOptions} options Extension options
 */
export const prepareAudioPlayer = async (element, options) => {
  // Get the last recorded playback rate
  const playbackRate = await getPlaybackRate()

  // Inject controls
  injectAudioControls(element, playbackRate)

  // Save/retrieve timestamp
  if (options.save_last_timestamp) lastAudioTimestamp(element, options)
}

/**
 * PRIVATE FUNCTIONS
 */

/**
 * Inject audio controls
 * @param {Element} playerWrapper
 * @param {Number} playbackRate
 */
const injectAudioControls = (playerWrapper, playbackRate) => {
  const audio = playerWrapper.querySelector('audio')
  const audioUrl = audio.src
  const playerTitle = playerWrapper.querySelector('div[class*=AudioPlayer_title]')

  if (audioUrl) {
    const audioControls = templates.audioControls(audioUrl, playbackRate)
    // Add speed control and download buttons to player title
    playerTitle.insertAdjacentHTML('afterend', audioControls)

    // Initialize playback speed controller
    playbackSpeedController(playerWrapper, audio, playbackRate)

    const link = playerWrapper.querySelector('button.MB_download')
    link.addEventListener('click', (event) => {
      event.preventDefault()
      generateDownloadLink(event)
    })
  }
}

/**
 * Inject VK player controls
 * @param {Element} playerWrapper
 * @param {boolean} canBeDownloaded
 * @param {Number} playbackRate
 */
const injectVideoControls = (playerWrapper, canBeDownloaded, playbackRate) => {
  const controls = playerWrapper.querySelector('div.controls div.controls-right')

  controls.lastElementChild.insertAdjacentHTML('beforeBegin', templates.controls())

  const additionalControls = controls.querySelector('div.MB_controls')

  // Add PiP button (for supported browsers)
  if (document.pictureInPictureEnabled) {
    additionalControls.insertAdjacentHTML('beforeend', templates.pipButton())
    playerWrapper.querySelector('div.MB_pip').addEventListener('click', preparePip)
  }

  // Add Download button
  if (canBeDownloaded) {
    additionalControls.insertAdjacentHTML('beforeend', templates.videoDownloadButton())
    playerWrapper.querySelector('div.MB_download').addEventListener('click', () => prepareVideoDownload(playerWrapper))
  }

  // Add and initialize speed controller
  additionalControls.insertAdjacentHTML('beforeend', templates.videoSpeedController(playbackRate))
  const player = playerWrapper.querySelector('video')
  playbackSpeedController(playerWrapper, player, playbackRate)
}

/**
 * Prepare and open video download modal
 * @param {Element} playerWrapper
 */
const prepareVideoDownload = async (playerWrapper) => {
  const videoId = getVideoId(playerWrapper)
  console.debug('videoId', videoId)

  const videoUrls = contentCache.get(videoId)
  console.debug('videoUrls', videoUrls)

  injectVideoDownloadModal(videoUrls)
}

/**
 * Prepare video download modal
 * @param {Object[]} links
 */
const injectVideoDownloadModal = (links) => {
  // Exit from fullscreen mode
  if (document.fullscreenElement) {
    document
      .exitFullscreen()
      .then(() => console.debug('Document Exited from Full screen mode'))
      .catch((err) => console.error(err))
  }

  // Close in dialogs
  const closeButton = document.querySelector('button[class*=MediaSwiper_closeButton_]')
  if (closeButton) closeButton.click()

  document.querySelector('div[class^=App_app_]').insertAdjacentHTML('beforeEnd', templates.videoDownloadModal(links))

  const videoDownloadModal = document.querySelector('div#MB_video_download')
  const videoDownloadClose = document.querySelector('span#MB_video_download_close')

  videoDownloadClose.addEventListener('click', (event) => {
    event.preventDefault()
    videoDownloadModal.remove()
  })

  const videoDownloadLinks = videoDownloadModal.querySelectorAll('button.MB_video_download_link')
  for (const link of videoDownloadLinks) {
    link.addEventListener('click', (event) => {
      event.preventDefault()
      videoDownloadModal.remove()
      generateDownloadLink(event)
    })
  }
}

/**
 * Generate URL download
 * @param {Event} event
 */
const generateDownloadLink = (event) => {
  const element = event.currentTarget
  const url = element.dataset.url
  // const title = element.dataset.title // invalidates the context, do not use!

  if (!url) return

  const link = document.createElement('a')
  link.style.display = 'none'
  link.href = url
  link.target = '_blank'
  // link.download = title // invalidates the context, do not use!

  document.body.appendChild(link)
  link.click()

  setTimeout(() => {
    link.parentNode.removeChild(link)
  }, 1000)
}

/**
 * Save/retrieve the last timestamp for the video
 * @param {Element} playerWrapper
 */
const lastVideoTimestamp = (playerWrapper) => {
  const content = playerWrapper.querySelector('video')

  playContentEvent(content, playerWrapper)
}

/**
 * Save/retrieve the last timestamp for the audio
 * @param {Node} playerWrapper
 * @param {OptionsSync.UserOptions} options
 */
const lastAudioTimestamp = (playerWrapper) => {
  const content = playerWrapper.querySelector('audio')

  playContentEvent(content, playerWrapper)
}

/**
 * Inject play event for timestamps
 * @param {Element} content
 */
const playContentEvent = (content, playerWrapper) => {
  content.addEventListener('timeupdate', () => contentIsLoaded(content, playerWrapper), { once: true })
}

/**
 * Save the current audio/video timestamp
 * @param {Element} element Audio/video element
 * @param {Element} playerWrapper Audio/video wrapper
 */
const contentIsLoaded = async (content, playerWrapper) => {
  const contentID = getContentID(content)

  if (!contentID) {
    console.warn('Cannot find a content ID for', content)
  }

  console.debug('content duration:', content.duration)
  if (content.duration <= 180) return

  const savedTimestamp = await retrieveTimestamp(contentID)
  if (savedTimestamp) {
    content.currentTime = savedTimestamp
    if (content.tagName === 'VIDEO') injectSavedTimestampIndicator(playerWrapper, content.duration, savedTimestamp)
  }

  let timeToSave = true
  let previouslySavedTimestamp = 0
  content.addEventListener('timeupdate', async () => {
    if (!timeToSave) return
    console.debug('time update', content.currentTime)

    let currentTimestamp = content.currentTime
    if (
      // First one minute of the content
      currentTimestamp <= 60 ||
      // Last one minute of the content
      content.duration - currentTimestamp <= 60
    ) {
      // Ignore this video
      currentTimestamp = 0
    };

    // Disable the function call
    timeToSave = false

    console.debug(timeToSave, currentTimestamp, savedTimestamp, previouslySavedTimestamp)
    if (
      // Prevents useless caching right after starts playing
      currentTimestamp !== savedTimestamp &&
      // Prevents useless caching when timestamp has not changed (pause, ignored)
      currentTimestamp !== previouslySavedTimestamp
    ) {
      saveTimestamp(contentID, currentTimestamp)
      previouslySavedTimestamp = currentTimestamp
    }

    // Throttle 'timeupdate' event call to once in 10 seconds
    /* eslint-disable no-return-assign */
    setTimeout(() => timeToSave = true, 10000)
  })
}

/**
 * Generate a last timestamp indicator for a video
 * @param {Node} player
 * @param {Number} duration
 * @param {Number} timestamp
 */
const injectSavedTimestampIndicator = (player, duration, timestamp) => {
  const position = timestamp * 100 / duration
  const template = templates.timestampIndicator(position)
  const bars = player.querySelector('div.bars')

  bars.insertAdjacentHTML('beforeEnd', template)
}

/**
 * Send a message to background script to retrieve timestamp
 * @param {String} id
 * @returns {Number}
 */
const retrieveTimestamp = async (id) => {
  return await chrome.runtime.sendMessage({
    action: 'retrieveTimestamp',
    id
  })
}

/**
 * Send a message to background script to save timestamp
 * @param {String} id
 * @param {Number} timestamp
 */
const saveTimestamp = (id, timestamp) => {
  chrome.runtime.sendMessage({
    action: 'saveTimestamp',
    id,
    timestamp
  })
}

/**
 * Send a message to background script to get playback rate
 * @returns {Number}
 */
const getPlaybackRate = async () => {
  return await chrome.runtime.sendMessage({
    action: 'getPlaybackRate'
  })
}

/**
 * Send a message to background script to save playback rate
 * @param {Number} playback rate
 */
const savePlaybackRate = (playbackRate) => {
  chrome.runtime.sendMessage({
    action: 'savePlaybackRate',
    playbackRate
  })
}

/**
 * Retrieves an ID for the audio/video element
 * @param {Element} element
 * @returns
 */
const getContentID = (element) => {
  if (element.tagName === 'VIDEO') {
    const playerWrapper = element.closest('div.player-wrapper')

    return getVideoId(playerWrapper)
  }

  if (element.tagName === 'AUDIO') {
    const contentURL = new URL(element.getAttribute('src'))

    return contentURL.pathname.replace('/audio/', '')
  }

  return null
}

/**
 * Operate Picture-in-picture
 * @private
 * @see {@link prepareVideoPlayer} for event conditions
 * @param {Event} event
 */
const preparePip = (event) => {
  const playerWrapper = event.currentTarget.parentElement.parentElement.parentElement
  const video = playerWrapper.querySelector('video')

  if (document.pictureInPictureElement) {
    document.exitPictureInPicture()
  } else if (document.pictureInPictureEnabled) {
    video.requestPictureInPicture()
  }
}

/**
 * Force video quality
 * @see {@link prepareVideoPlayer}
 * @param {Element} player
 * @param {String} videoQuality
 */
const forceVideoQuality = (player, videoQuality) => {
  const itemQuality = player.querySelectorAll('li.item-quality')
  for (const quality of itemQuality) {
    if (quality.dataset.value === videoQuality) {
      quality.click()
      break
    }

    itemQuality[0].click()
  }
}

/**
 * Playback speed controller
 * @param {Element} playerWrapper
 * @param {Element} player
 * @param {Number} playbackRate
 */
const playbackSpeedController = (playerWrapper, player, playbackRate) => {
  const decreaseButton = playerWrapper.querySelector('.MB_speed_decrease')
  const increaseButton = playerWrapper.querySelector('.MB_speed_increase')
  const playbackRateElement = playerWrapper.querySelector('.MB_current_playback_rate')

  player.playbackRate = playbackRate

  decreaseButton.addEventListener('click', (event) => {
    event.preventDefault()

    player.playbackRate = (player.playbackRate - 0.25 > 0.25) ? player.playbackRate - 0.25 : 0.25
    changePlaybackRate(player.playbackRate)
  })

  increaseButton.addEventListener('click', (event) => {
    event.preventDefault()

    player.playbackRate = (player.playbackRate + 0.25 < 4.0) ? player.playbackRate + 0.25 : 4.0
    changePlaybackRate(player.playbackRate)
  })

  playbackRateElement.addEventListener('click', (event) => {
    event.preventDefault()

    if (player.playbackRate !== 1.0) {
      previuosPlaybackRate = player.playbackRate
      changePlaybackRate(1.0)
    } else {
      changePlaybackRate(previuosPlaybackRate)
    }
  })
}

/**
 * Change playback rate
 * @param {Number} playbackRate
 */
const changePlaybackRate = async (playbackRate) => {
  const playersList = []
  const displaysList = []

  // Audio
  const audioPlayers = document.querySelectorAll('audio')
  audioPlayers.forEach((audio) => {
    if (audio) playersList.push(audio)
  })

  const audioDisplays = document.querySelectorAll('.MB_current_playback_rate span')
  audioDisplays.forEach((display) => {
    if (display) displaysList.push(display)
  })

  // Video
  const videoPlayers = document.querySelectorAll('vk-video-player')
  for (const player of videoPlayers) {
    const video = player.shadowRoot.querySelector('video')
    if (video) playersList.push(video)

    const display = player.shadowRoot.querySelector('.MB_current_playback_rate span')
    if (display) displaysList.push(display)
  }

  // Change the playback speed
  playersList.forEach((player) => {
    player.playbackRate = playbackRate
  })

  // Change the display
  displaysList.forEach((element) => {
    element.textContent = `x${playbackRate}`
  })

  savePlaybackRate(playbackRate)
}

/**
 * Return content components
 * @param {Object} metadata
 * @returns {Object[]}
 */
const getContentComponents = async (metadata) => {
  return await chrome.runtime.sendMessage({
    action: 'retrieveContentData',
    metadata,
    accessToken: getAccessToken()
  })
}

/**
 * Gets an access token from local storage
 * @returns {String}
 */
const getAccessToken = () => {
  const auth = window.localStorage.getItem('auth')
  return JSON.parse(auth).accessToken
}

/**
 * Returns the content metadata (post/dialog/etc)
 * @param {Element} playerWrapper
 * @returns {Object}
 */
const getContentMetadata = (playerWrapper) => {
  const playerRoot = playerWrapper.getRootNode().host
  const currentPageUrl = new URL(window.location.href)
  const pathName = currentPageUrl.pathname

  // Single post page
  if (pathName.includes('/posts/')) {
    return generatePostMetadata(pathName)
  }

  // Message page with dialog selected
  if (pathName.includes('/app/messages') && currentPageUrl.searchParams.has('dialogId')) {
    return {
      type: 'dialog',
      id: currentPageUrl.searchParams.get('dialogId')
    }
  }

  // Post on main blog page
  const postContent = playerRoot.closest('div[class*=Post_root_]')
  if (postContent) {
    const postLink = postContent.querySelector('a[class*=CreatedAt_headerLink_]').href
    return generatePostMetadata(postLink)
  }

  // Post in Media tab
  const mediaContent = playerRoot.closest('div[class*=MediaViewer_root_]')
  if (mediaContent) {
    const mediaLink = mediaContent.querySelector('a[class*=GoToPostButton_link_]').href
    return generatePostMetadata(mediaLink)
  }

  // Other cases (may be author bio or various blocks)
  return {
    type: 'unknown'
  }
}

/**
 * Generate generic post metadata from URL/pathname
 * @param {String} url
 * @returns
 */
const generatePostMetadata = (url) => {
  return {
    type: 'post',
    id: url.split('/').reverse()[0],
    blogName: url.split('/').reverse()[2]
  }
}

/**
 * Returns the video ID (from dataset or from preview)
 * @param {Element} playerWrapper
 * @returns {String} video ID
 */
const getVideoId = (playerWrapper) => {
  if ('videoId' in playerWrapper.dataset) {
    console.debug('videoId from dataset', playerWrapper.dataset.videoId)
    return playerWrapper.dataset.videoId
  }

  const previewContainer = playerWrapper.querySelector('div.container[style*=background-image]')
  console.debug('videoPreviewContainer', previewContainer)

  const previewAttr = previewContainer.style.backgroundImage
  console.debug('videoPreviewAttr', previewAttr)

  const regex = /url\("(.*)"\)/gm
  const previewUrl = regex.exec(previewAttr)[1]

  const videoId = helpers.parseVideoId(previewUrl)
  playerWrapper.dataset.videoId = videoId
  console.debug('videoId from preview', videoId)

  return videoId
}
