import { Changelog } from "@models/changelog/types";

const changelog: Changelog = {
    "1.0.0": {
        title: {
            en: "Update 1.0.0",
            ru: "Обновление 1.0.0"
        },
        message: {
            ru: [
                "Поддержка новой версии сайта.",
                "Полностью переписано расширение с использованием более надежных и современных технологий.",
                "Увеличена надежность приложения и улучшена обработка ошибок"
            ],
            en: [
                "New website version support.",
                "The extension has been completely rewritten using more reliable and modern technologies.",
                "Increased application reliability and improved error handling"
            ]
        },
        link: "https://github.com/IvanSavoskin/more-boosty-remaster/releases/tag/v1.0.0"
    },
    "1.0.2": {
        title: {
            en: "Update 1.0.2",
            ru: "Обновление 1.0.2"
        },
        message: {
            ru: ["Исправлена проблема обновления настроек", "Доработаны нотификации о новых версиях"],
            en: ["Fixed the problem with updating settings", "Improved notifications about new versions"]
        },
        link: "https://github.com/IvanSavoskin/more-boosty-remaster/releases/tag/v1.0.2"
    },
    "1.1.0": {
        title: {
            en: "Update 1.1.0",
            ru: "Обновление 1.1.0"
        },
        message: {
            ru: [
                "Добавлен переключатель тем с возможностью включить темную тему (в бета).",
                "Добавлена возможность включить синхронизацию настроек расширения.",
                "Добавлен маркер последнего timestamp для аудио.",
                "Timestamp для видео и аудио сохраняется теперь также при паузе.",
                "Прочие улучшения и исправления."
            ],
            en: [
                "Added theme switcher with the ability to enable dark theme (in beta).",
                "Added the ability to enable extension settings synchronization.",
                "Added last timestamp marker for audio.",
                "Timestamp for video and audio is now saved even when paused.",
                "Other improvements and fixes."
            ]
        },
        link: "https://github.com/IvanSavoskin/more-boosty-remaster/releases/tag/v1.1.0"
    },
    "1.2.0": {
        title: {
            en: "Update 1.2.0",
            ru: "Обновление 1.2.0"
        },
        message: {
            ru: [
                "Добавлена возможность открывать контекстное меню для изображений из постов.",
                "Улучшена темная тема.",
                "Прочие улучшения и исправления."
            ],
            en: [
                "Added the ability to open the context menu for images from posts.",
                "Improved the dark theme.",
                "Other improvements and fixes."
            ]
        },
        link: "https://github.com/IvanSavoskin/more-boosty-remaster/releases/tag/v1.2.0"
    },
    "1.2.1": {
        title: {
            en: "Update 1.2.1",
            ru: "Обновление 1.2.1"
        },
        message: {
            ru: [
                "Исправлено скачивание аудио.",
                "Удалено управление скоростью воспроизведения (Boosty сделали встроенную систему).",
                "Улучшена темная тема.",
                "Прочие улучшения и исправления."
            ],
            en: [
                "Fix download action for audio.",
                "Remove playback rate controls (Boosty made it built-in).",
                "Improve dark theme",
                "Other improvements and fixes."
            ]
        },
        link: "https://github.com/IvanSavoskin/more-boosty-remaster/releases/tag/v1.2.1"
    }
};

export default changelog;
