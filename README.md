# ![logo](public/icons/icon24.png)ore Boosty Remastered

> **More Boosty Remastered** - это браузерное расширение, улучшающее интерфейс и функции краудфандинговой платформы [Boosty](https://boosty.to) (Бусти)

[README in English](./README.EN)

# Возможности

* Широкоформатный режим страниц
* Принудительное изменение качества видео на желаемое *(для плеера Boosty)*
* Картинка-в-картинке *(для плеера Boosty)*
* Скачивание видео *(для плеера Boosty)*
* Сохранение момента, на котором закончил видео/аудио *(для плееров Boosty)*
* Режим кинотеатра для стримов
* Темная тема (в бета)

> Скриншоты - *на странице установки*

# Установка

**Перейди [по этой ссылке][1] и нажми "Добавить в Chrome"**

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/fkgamejmaiikhojcmjoaaegdimdalnom?color=red&label=%D0%B0%D0%BA%D1%82%D1%83%D0%B0%D0%BB%D1%8C%D0%BD%D0%B0%D1%8F%20%D0%B2%D0%B5%D1%80%D1%81%D0%B8%D1%8F&logo=google-chrome&logoColor=red&style=for-the-badge)][1]

> * Разрабатывалось и тестировалось для **Google Chrome**
> * Устанавливается в любой браузер на базе Chromium - Яндекс Браузер, Opera (GX), Vivaldi и т.д.
> * В Microsoft Edge сначала нажми "Разрешить расширения из других магазинов" (если спросит)

### Когда версия для Firefox?

На данный момент **версия для Firefox не планируется**.

1. Firefox не поддерживает некоторые важные функции расширения *(PiP API и background service workers)*.
2. Для частичной поддержки потребуется сильно изменить рабочий процесс.
3. Нет спроса на версию для Firefox.

## Благодарности

* [CJMAXiK](https://cjmaxik.com/)

---

# Для разработчиков

[![Свежий релиз](https://img.shields.io/github/v/release/IvanSavoskin/more-boosty-remaster?label=%D1%81%D0%B2%D0%B5%D0%B6%D0%B8%D0%B9%20%D1%80%D0%B5%D0%BB%D0%B8%D0%B7&logo=github&style=for-the-badge)][2]

## Особенности официальной сборки

* Расширение собирается и публикуется через [Github Actions](./.github/workflows/release.yml)

## Сборка расширения вручную
1. Скачай [свежий релиз][2] либо весь репозиторий
2. Установите Node.js (требуемая версия в [package.json](./package.json))
3. Должен быть установлен совместимый `npm`
4. В терминале выполните команду `npm install` из папки проекта

### Линтеры
Для контроля качества кода предусмотрено подключение линтеров.

#### ESLint
Правила для ESLint указаны в файле `/.eslintrc`.

Проверка кода с использованием ESLint запускается командой `npm run eslint`.

#### Stylelint
Правила для Stylelint указаны в файле `/.stylelintrc.json`.

Проверка стилей с помощью Stylelint запускается командой

### Сборка для разработки
Запустите dev сборку с помощью команды `npm run dev`.

После сборки будет создана папка `/dist` со сборкой расширения,
которую можно использовать для добавления в браузер.

Каждое изменение кода автоматически инициирует пересборку расширения.

Во время сборки также добавляется source map, позволяющие использовать Chrome Dev Tools

### Промышленная сборка
Запустите prod сборку с помощью команды `npm run prod`.

Перед сборкой автоматически запускается проверка кода с помощью ESLint и StyleLint.

Собранный проект сохраняется в папке `/dist`.

### Загрузить расширение в Chrome

Загрузить каталог `dist` на странице расширения Chrome ([инструкция](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked))

### Обрати внимание

* [Background page (service worker)](src/background/index.ts) перезагружается как положено
  * Может потребоваться обновление страницы для корректной работы content script

* [Content script](src/content/index.ts) требует ручного обновления страницы
* [Страница параметров](public/html/options.html) требует ручного обновления страницы или расширения
* Ассеты (changelog, иконки) требуют ручного обновления расширения

[1]: https://chrome.google.com/webstore/detail/more-boosty-remastered/fkgamejmaiikhojcmjoaaegdimdalnom
[2]: https://github.com/IvanSavoskin/more-boosty-remaster/releases
