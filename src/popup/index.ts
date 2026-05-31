import "./styles/popup.scss";

import sendMessage from "@coreUtils/messagesUtils";
import { CurrencyRate, CurrencyRatesInfo } from "@models/currency/types";
import { BackgroundMessageType, MessageTarget } from "@models/messages/enums";
import { CurrencyRatesInfoPopupMessage, RequestCurrencyRatesBackgroundMessage } from "@models/messages/types";

const LOADING_STATE_SELECTOR = "#loading-state";
const SUCCESS_STATE_SELECTOR = "#success-state";
const ERROR_STATE_SELECTOR = "#error-state";
const RATES_LIST_SELECTOR = "#rates-list";
const UPDATED_AT_SELECTOR = "#updated-at";
const REFRESH_BUTTON_SELECTOR = "#refresh-button";
const RETRY_BUTTON_SELECTOR = "#retry-button";
const HIDDEN_CLASS = "hidden";

/**
 * Localize popup text content.
 */
function localizePopup() {
    for (const element of document.querySelectorAll<HTMLElement>("[data-locale]")) {
        const text = element.dataset.locale ? chrome.i18n.getMessage(element.dataset.locale) : undefined;
        if (!text) {
            continue;
        }
        element.textContent = text;
    }
}

/**
 * Show one popup state and hide the others.
 *
 * @param {("loading"|"success"|"error")} state State to show.
 */
function showState(state: "loading" | "success" | "error") {
    document.querySelector(LOADING_STATE_SELECTOR)?.classList.toggle(HIDDEN_CLASS, state !== "loading");
    document.querySelector(SUCCESS_STATE_SELECTOR)?.classList.toggle(HIDDEN_CLASS, state !== "success");
    document.querySelector(ERROR_STATE_SELECTOR)?.classList.toggle(HIDDEN_CLASS, state !== "error");
}

/**
 * Format rate value with four decimal places.
 *
 * @param {number} rubles Amount of rubles per one foreign currency unit.
 * @returns {string} Formatted rate value.
 */
function formatCurrencyRate(rubles: number): string {
    return rubles.toFixed(4);
}

/**
 * Format currency rates update time.
 *
 * @param {number} updatedAt Currency rates update timestamp.
 * @returns {string} Localized update time.
 */
function formatUpdatedAt(updatedAt: number): string {
    return new Intl.DateTimeFormat(undefined, {
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        month: "2-digit",
        year: "numeric"
    }).format(new Date(updatedAt));
}

/**
 * Render one currency rate row.
 *
 * @param {CurrencyRate} currencyRate Currency rate data.
 * @returns {HTMLLIElement} Currency rate list item.
 */
function renderCurrencyRate(currencyRate: CurrencyRate): HTMLLIElement {
    const currencyRateElement = document.createElement("li");
    currencyRateElement.className = "rate-item";

    const currencyElement = document.createElement("span");
    currencyElement.className = "rate-currency";
    currencyElement.textContent = `1 ${currencyRate.currency}`;

    const rublesElement = document.createElement("span");
    rublesElement.className = "rate-rubles";
    rublesElement.textContent =
        chrome.i18n.getMessage("popup_rate_value", formatCurrencyRate(currencyRate.rubles)) ||
        `${formatCurrencyRate(currencyRate.rubles)} RUB`;

    currencyRateElement.append(currencyElement, rublesElement);

    return currencyRateElement;
}

/**
 * Render currency rates info.
 *
 * @param {CurrencyRatesInfo} currencyRatesInfo Currency rates info.
 */
function renderCurrencyRates(currencyRatesInfo: CurrencyRatesInfo) {
    const ratesList = document.querySelector<HTMLUListElement>(RATES_LIST_SELECTOR);
    const updatedAtElement = document.querySelector<HTMLElement>(UPDATED_AT_SELECTOR);

    if (!ratesList || !updatedAtElement) {
        showState("error");
        return;
    }

    ratesList.replaceChildren(...currencyRatesInfo.rates.map((currencyRate) => renderCurrencyRate(currencyRate)));
    updatedAtElement.textContent =
        chrome.i18n.getMessage("popup_updated_at", formatUpdatedAt(currencyRatesInfo.updatedAt)) ||
        `Updated at ${formatUpdatedAt(currencyRatesInfo.updatedAt)}`;
}

/**
 * Request currency rates from background service worker.
 *
 * @param {boolean} [forceRefresh=false] Whether to skip cache and request fresh rates.
 */
async function requestCurrencyRates(forceRefresh: boolean = false) {
    showState("loading");

    const message = await sendMessage<RequestCurrencyRatesBackgroundMessage, CurrencyRatesInfoPopupMessage>({
        type: BackgroundMessageType.REQUEST_CURRENCY_RATES,
        target: [MessageTarget.BACKGROUND],
        data: { forceRefresh }
    });

    const currencyRatesInfo = message?.data.currencyRatesInfo;
    if (!currencyRatesInfo || currencyRatesInfo.rates.length === 0) {
        showState("error");
        return;
    }

    renderCurrencyRates(currencyRatesInfo);
    showState("success");
}

/**
 * Configure refresh and retry buttons.
 */
function configureButtons() {
    const refreshButton = document.querySelector<HTMLButtonElement>(REFRESH_BUTTON_SELECTOR);
    const retryButton = document.querySelector<HTMLButtonElement>(RETRY_BUTTON_SELECTOR);

    if (refreshButton) {
        refreshButton.addEventListener("click", () => requestCurrencyRates(true));
    }

    if (retryButton) {
        retryButton.addEventListener("click", () => requestCurrencyRates(true));
    }
}

/**
 * Init popup.
 */
function init() {
    localizePopup();
    configureButtons();
    requestCurrencyRates();
}

init();
