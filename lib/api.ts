import { Country, ExchangeRate, OCRData } from '@/types';

export const API_ENDPOINTS = {
  countries: 'https://restcountries.com/v3.1/all?fields=name,currencies,cca2',
  exchangeRate: (base: string) => `https://api.exchangerate-api.com/v4/latest/${base}`,
};

type RawCountry = {
  name: {
    common: string;
  };
  cca2: string;
  currencies: Record<string, {
    name: string;
    symbol: string;
  }>;
};

export async function fetchCountriesWithCurrencies(): Promise<Country[]> {
  try {
    const response = await fetch(API_ENDPOINTS.countries);
    if (!response.ok) throw new Error('Failed to fetch countries');
    
    const data: RawCountry[] = await response.json();
    
    return data.map((country) => ({
      name: country.name.common,
      code: country.cca2,
      currencies: Object.entries(country.currencies || {}).map(([code, curr]) => ({
        code,
        name: curr.name,
        symbol: curr.symbol || code,
      })),
    })).filter((c: Country) => c.currencies.length > 0);
  } catch (error) {
    console.error('Error fetching countries:', error);
    return [];
  }
}

type RawExchangeRate = {
  base: string;
  rates: Record<string, number>;
  time_last_update_unix: number;
};

export async function fetchExchangeRates(baseCurrency: string): Promise<ExchangeRate | null> {
  try {
    const response = await fetch(API_ENDPOINTS.exchangeRate(baseCurrency));
    if (!response.ok) throw new Error('Failed to fetch exchange rates');
    
    const data: RawExchangeRate = await response.json();
    
    return {
      base: data.base,
      rates: data.rates,
      timestamp: data.time_last_update_unix * 1000,
    };
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return null;
  }
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount;
  
  const fromRate = rates[fromCurrency];
  const toRate = rates[toCurrency];

  if (!fromRate || !toRate) {
    throw new Error(`Unable to find exchange rate for ${fromCurrency} or ${toCurrency}`);
  }
  
  const amountInBase = amount / fromRate;
  const convertedAmount = amountInBase * toRate;
  
  return Math.round(convertedAmount * 100) / 100;
}

export function formatCurrency(amount: number, currencyCode: string, locale: string = 'en-US'): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  } catch (e) {
    // Fallback for invalid currency codes or other errors
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

/**
 * Simulates a backend OCR processing pipeline for receipts.
 * In a production app, this would send the file to an API (e.g., AWS Textract or OpenAI Vision).
 */
export async function simulateReceiptOCR(file: File): Promise<OCRData> {
  // Simulate a 2.5 second network & processing delay
  await new Promise((resolve) => setTimeout(resolve, 2500));

  return {
    merchantName: 'Acme Dining & Co.',
    amount: 84.50,
    date: new Date().toISOString().split('T')[0], // Returns YYYY-MM-DD
    category: 'meals',
    items: ['Steak Frites', 'Sparkling Water', 'Cheesecake'],
    confidence: 0.94,
  };
}