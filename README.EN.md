# ![logo](public/icons/icon24.png)ore Boosty Remastered

> **More Boosty Remastered** is a browser extention which improves interface and functions of crowdfunding platform [Boosty](https://boosty.to)

[README на Русском](./README.md)

# Features

* Widescreen page layout
* Force video quality *(for Boosty player)*
* Picture-in-picture *(for Boosty player)*
* Download video *(for Boosty player)*
* Save where you left off video/audio *(for Boosty players)*
* Theater mode for streams
* Dark theme (in beta)

> Screenshots - *see Installation page*

# Installation

**Click [here][1], then click "Add to Chrome"**

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/fkgamejmaiikhojcmjoaaegdimdalnom?color=red&label=Latest+version&logo=google-chrome&logoColor=red&style=for-the-badge)][1]

> * Developed and tested for **Google Chrome**
> * Can be installed on any Chromium browser - Opera (GX), Vivaldi, etc.
> * In Microsoft Edge, click "Allow extensions from other stores" fisrt (is asked)

### Firefox version when?

There are currently no plans to support Firefox.

1. Firefox does not support some crucial functions *(PiP API and background service workers)*.
2. Partial support will require an extensive tooling changes.
3. There is no demand for the Firefox version.

## Honorable mentions

* [CJMAXiK](https://cjmaxik.com/)

---

# For developers

[![Latest release](https://img.shields.io/github/v/release/IvanSavoskin/more-boosty-remaster?label=Latest+release&logo=github&style=for-the-badge)][2]

## Notes for official releases

* Extension is built and published via [Github Actions](./.github/workflows/release.yml)

## Local installation

### Prerequisites
1. Download [latest release][2] or the whole repository
2. Install Node.js (required version in [package.json](./package.json))
3. Compatible `npm` must be installed
4. In the terminal, run the `npm install` command from the project folder

### Linters
To monitor the quality of the code, the project provides for the connection of linters.

#### ESLint
Rules for ESLint are specified in the `/.eslintrc` file.

Code checking using ESLint starts with the command `npm run eslint`.

#### Stylelint
Rules for Stylelint are specified in the `more-boosty-remastered/.stylelintrc.json` file.

Styles checking using Stylelint starts with the command `npm run stylelint`.

### Development build
Start the dev build with the command `npm run dev`.

After build, a folder `/dist` will be created with the built extension,
which can be used to add to the browser.

Each code change initiates a rebuild of the extension automatically.

During build, a source map is also added to enable the use of Chrome Dev Tools

### Production build
Start the prod build with the command `npm run prod`.

Before building, code checking is automatically run using ESLint and StyleLint.

Built project is stored in the `/dist` folder.

### Load extension to Chrome

Load `dist` directory on Chrome extension page ([instruction](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked))

### Please note

* [Background service worker](src/background/index.ts) hot-reloads as usual
  * Might require a page reload for content script

* [Content script](src/content/index.ts) requires a page reload
* [Options page](public/html/options.html) requires a page or extension reload
* Assets (changelog icons) require an extension reload

[1]: https://chrome.google.com/webstore/detail/more-boosty-remastered/fkgamejmaiikhojcmjoaaegdimdalnom
[2]: https://github.com/IvanSavoskin/more-boosty-remaster/releases
