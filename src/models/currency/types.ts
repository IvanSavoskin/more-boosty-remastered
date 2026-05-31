export interface BoostyTargetResponse {
    bloggerCurrency?: string;
    bloggerId?: number;
    bloggerUrl?: string;
    createdAt?: number;
    currencyCurrentSums?: Record<string, number>;
    currencyTargetSums?: Record<string, number>;
    currentSum?: number;
    description?: string;
    finishTime?: number | null;
    id?: number;
    priority?: number;
    targetSum?: number;
    type?: string;
}

export interface CurrencyRate {
    currency: string;
    rubles: number;
}

export interface CurrencyRatesInfo {
    rates: CurrencyRate[];
    updatedAt: number;
}

export interface CurrencyRatesResponseData {
    [key: string]: string | number | boolean | object | null;

    currencyRatesInfo: CurrencyRatesInfo | null;
    error: string | null;
}
