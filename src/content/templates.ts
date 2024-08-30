import safeHTML from "html-template-tag";

// Changelog JSON
import changelog from "@coreUtils/changelog";
import { PlayerUrl } from "@models/video/types";

// Chrome aliases
const t = (name: string) => chrome.i18n.getMessage(name);
const { name, version } = chrome.runtime.getManifest();

// Checking browser language
let uiLang = chrome.i18n.getUILanguage();
if (uiLang !== "ru" && uiLang !== "en") {
    uiLang = "en";
}

export const changelogButton = () => `
  <div class="TopMenu_messageContainer_bwglz mb-changelog-button append-animate">
      <a class="TopMenu_messagesContainer_hzgjz" href="#" id="mb-changelog" title="${t("content_about")}">
          <span class="Icon_block_Hvwi5 TopMenu_iconMessages_zy_w6">
              <img src="${chrome.runtime.getURL("/static/assets/icon.png")}" class="mb-icon" alt="icon"/>
          </span>
          <span class="TopMenu_messageCaption_s_h7T" style="text-transform: initial;">
              v${version}
          </span>
      </a>
  </div>
`;

export const changelogModal = () => `
  <div class="ScrollBox_scrollContainer_g0g0j Popup_wrapper_ZeN1U FadeIn_fade_ecikC FadeIn_entered_uFjQ8 mb-changelog-modal fade-animate" id="mb-changelog_modal" style="z-index: 99999999;">
      <div class="PopupContent_block_P9UTg Popup_block_EdudK">
          <span class="Icon_block_Hvwi5 PopupContent_close_s4F2c" id="mb-changelog_close">
              <svg style="width: 20px; height: 20px;" fill="#000000" height="800px" width="800px" viewBox="0 0 1792 1792">
                <path d="M1082.2,896.6l410.2-410c51.5-51.5,51.5-134.6,0-186.1s-134.6-51.5-186.1,0l-410.2,410L486,300.4c-51.5-51.5-134.6-51.5-186.1,0s-51.5,134.6,0,186.1l410.2,410l-410.2,410c-51.5,51.5-51.5,134.6,0,186.1c51.6,51.5,135,51.5,186.1,0l410.2-410l410.2,410c51.5,51.5,134.6,51.5,186.1,0c51.1-51.5,51.1-134.6-0.5-186.2L1082.2,896.6z"/>
              </svg>
          </span>

          <div class="PopupContent_title_IHD2G">
              <p>
                  <strong>
                      ${name}, v${version}
                  </strong>
              </p>
              
              <p>
                  <small>
                      Remastered by <a href="https://github.com/IvanSavoskin" rel="noreferref noopener nofollow" target="_blank">IvanSavoskin</a>
                  </small>
              </p>

              <p>
                  <small>
                      Created by <a href="https://cjmaxik.ru?ref=more_boosty" rel="noreferref noopener nofollow" target="_blank">CJMAXiK</a>
                  </small>
              </p>
          </div>

          <div class="PopupContent_content_A2EA3">
              <div>
                  <h2>🎉 ${t("changelog_latest_version")}</h2>
                  ${generateChangelogText("latest", uiLang as "ru" | "en")}
              </div>

              <div>
                  <h3>📒 ${t("changelog_previous_version")}</h3>
                  <i>${generateChangelogText("previous", uiLang as "ru" | "en")}</i>
              </div>
          </div>

          <div class="ChangePhone_buttons_vP_uE Buttons_root_X0BDd">
              <a href="#" id="mb-options-button" class="BaseButton_button_yO8r5 OutlinedButton_button_gVLJD">
                  ${t("options_title")}
              </a>
          </div>
      </div>
  </div>
`;

export const videoDownloadModal = (links: PlayerUrl[]) => `
<div class="ScrollBox_scrollContainer_g0g0j Popup_wrapper_ZeN1U FadeIn_fade_ecikC FadeIn_entered_uFjQ8 fade-animate" id="mb-video-download" style="z-index: 99999999;">
  <div class="PopupContent_block_P9UTg Popup_block_EdudK">
      <span class="Icon_block_Hvwi5 PopupContent_close_s4F2c" id="mb-video-download-close">
        <svg style="width: 20px; height: 20px;" fill="#000000" height="800px" width="800px" viewBox="0 0 1792 1792">
            <path d="M1082.2,896.6l410.2-410c51.5-51.5,51.5-134.6,0-186.1s-134.6-51.5-186.1,0l-410.2,410L486,300.4c-51.5-51.5-134.6-51.5-186.1,0s-51.5,134.6,0,186.1l410.2,410l-410.2,410c-51.5,51.5-51.5,134.6,0,186.1c51.6,51.5,135,51.5,186.1,0l410.2-410l410.2,410c51.5,51.5,134.6,51.5,186.1,0c51.1-51.5,51.1-134.6-0.5-186.2L1082.2,896.6z"/>
        </svg>
      </span>

      <div class="PopupContent_title_IHD2G">
          <p>
              <strong>
                  ${t("download_video_modal_title")}:
              </strong>
          </p>
      </div>

      <div class="PopupContent_content_A2EA3 mb-video-links" style="display: grid !important;">
          ${generateVideoDownloadLinks(links)}
      </div>
  </div>
</div>
`;

export const controls = () => '<div class="mb-controls" style="display: flex; column-gap: 8px; padding: 8px 0 8px 8px;" />';

export const pipButton = () => `
  <div class="mb-pip" style="cursor: pointer">
      <div role="button" tabindex="0" title="${t("content_pip")}">
          <svg width="24px" height="24px" xmlns="http://www.w3.org/2000/svg">
              <g fill="#fff" fill-rule="evenodd">
                <path class="_enter" d="M18 11 10 11 10 17 18 17 18 11 18 11ZM22 19 22 4.98C22 3.88 21.1 3 20 3L2 3C.9 3 0 3.88 0 4.98L0 19C0 20.1.9 21 2 21L20 21C21.1 21 22 20.1 22 19L22 19ZM20 19.02 2 19.02 2 4.97 20 4.97 20 19.02 20 19.02Z">
              </g>
          </svg>
      </div>
  </div>
`;

export const videoDownloadButton = () => `
  <div class="mb-download" style="cursor: pointer">
      <div role="button" tabindex="0" title="${t("content_download")}">
          <svg width="24px" height="24px" xmlns="http://www.w3.org/2000/svg">
              <g fill="#fff" fill-rule="evenodd">
                <path class="_enter" d="M6 21H18A1 1 0 0018 19H6A1 1 0 006 21M19 10H15V3H9V10H5C7.3333 12.3333 9.6667 14.6667 12 17L19 10Z" />
              </g>
          </svg>
      </div>
  </div>
`;

export const videoSpeedController = (initialPlaybackRate: number) => `
  <div class="mb-speed-control" style="display: flex; align-items: center">
    <div class="mb-speed-decrease" style="background-color: initial !important; cursor: pointer !important; padding: 0;">
      <div role="button" tabindex="0" title="${t("player_speed_decrease")}">
        <svg width="24px" height="24px" xmlns="http://www.w3.org/2000/svg">
          <g fill="#fff" fill-rule="evenodd">
            <path class="_enter" d="M20 12a1 1 0 01-1 1H5a1 1 0 110-2h14a1 1 0 011 1z" />
          </g>
        </svg>
      </div>
    </div>

    <div class="mb-current-playback-rate" style="cursor: pointer !important;">
      <div role="button" tabindex="0" title="${t("player_speed_reset")}" style="width: 40px; text-align: center;">
          <span>
            x${initialPlaybackRate}
          </span>
      </div>
    </div>

    <div class="mb-speed-increase" style="background-color: initial !important; cursor: pointer !important; padding: 0;">
      <div role="button" tabindex="0" title="${t("player_speed_increase")}">
        <svg width="24px" height="24px" xmlns="http://www.w3.org/2000/svg">
          <g fill="#fff" fill-rule="evenodd">
            <path class="_enter" d="M20 12a1 1 0 01-1 1h-6v6A1 1 0 0112 20a1 1 0 01-1-1v-6h-6a1 1 0 110-2h6v-6A1 1 0 0112 4a1 1 0 011 1v6h6a1 1 0 011 1z" />
          </g>
        </svg>
      </div>
    </div>
  </div>
`;

export const audioControls = (url: string, initialPlaybackRate: number) => `
  <div class="mb-audio-control-wrapper" style="display: flex; justify-content: center; margin-left: auto; column-gap: 8px;">
    <div class="mb-speed-control" style="display: flex; align-items: center;">
      <div class="mb-speed-decrease" style="cursor: pointer !important;">
        <div role="button" tabindex="0" title="${t("player_speed_decrease")}">
          <svg width="24px" height="24px" xmlns="http://www.w3.org/2000/svg">
            <g fill="#000" fill-rule="evenodd">
              <path class="_enter" d="M20 12a1 1 0 01-1 1H5a1 1 0 110-2h14a1 1 0 011 1z" />
            </g>
            </svg>
        </div>
      </div>
    
      <div class="mb-current-playback-rate" style="cursor: pointer !important;">
      <div role="button" tabindex="0" title="${t("player_speed_reset")}" style="width: 40px; text-align: center;">
          <span>
            x${initialPlaybackRate}
          </span>
      </div>
    </div>
    
      <div class="mb-speed-increase" style="cursor: pointer !important;">
        <div role="button" tabindex="0" title="${t("player_speed_increase")}">
          <svg width="24px" height="24px" xmlns="http://www.w3.org/2000/svg">
            <g fill="#000" fill-rule="evenodd">
              <path class="_enter" d="M20 12a1 1 0 01-1 1h-6v6A1 1 0 0112 20a1 1 0 01-1-1v-6h-6a1 1 0 110-2h6v-6A1 1 0 0112 4a1 1 0 011 1v6h6a1 1 0 011 1z" />
            </g>
          </svg>
        </div>
      </div>
    </div>
    
    <div class="mb-download" style="cursor: pointer" data-url="${url}">
      <div role="button" tabindex="0" title="${t("content_download")}">
        <svg width="24px" height="24px" xmlns="http://www.w3.org/2000/svg">
          <g fill="#000" fill-rule="evenodd">
            <path class="_enter" d="M6 21H18A1 1 0 0018 19H6A1 1 0 006 21M19 10H15V3H9V10H5C7.3333 12.3333 9.6667 14.6667 12 17L19 10Z" />
          </g>
        </svg>
      </div>
    </div>
  </div>
`;

export const timestampIndicator = (position: number) => `
  <span class="mb-last-timestamp" style="
      display: block;
      position: absolute;
      z-index: 99999;
      height: 100%;
      width: 3px;
      background-color: rgb(174,54,12);
      left: ${position}%;
  "></span>
`;

const noChangelog = "<ul><li>🤷</li></ul>";

/**
 * Generates a changelog text from `changelog.ts`
 *
 * @see {@link prepareChangelogModal}
 * @param {("latest"|"previous")} type Changelog type
 * @param {("ru"|"en")} lang Changelog language
 * @returns {string} Changelog text
 */
function generateChangelogText(type: "latest" | "previous", lang: "ru" | "en"): string {
    const index = type === "latest" ? -1 : -2;
    const changelogEntries = Object.entries(changelog);
    const changelogEntry = changelogEntries.at(index);

    if (changelogEntry === undefined) {
        return noChangelog;
    }

    const changelogMessages = changelogEntry[1].message[lang];

    if (changelogMessages === undefined) {
        return noChangelog;
    }

    let text = "<ul>";
    for (const change of changelogMessages) {
        text += safeHTML`<li>${change}</li>`;
    }
    text += "</ul> ";

    return text;
}

/**
 * Generates a video download buttons for the modal
 *
 * @param {PlayerUrl[]} playerUrls Player URLs info
 * @returns {string} Video download buttons in HTML
 */
function generateVideoDownloadLinks(playerUrls: PlayerUrl[]): string {
    let text = "";
    for (const playerUrl of playerUrls) {
        text += safeHTML`<button data-url="${playerUrl.url}" class="mb-video-download-link BaseButton_button_yO8r5 OutlinedButton_button_gVLJD">
      ${t(`video_quality_${playerUrl.type}`)}
    </button>`;
    }

    return text;
}
