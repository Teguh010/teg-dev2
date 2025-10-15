// Currency conversion service using ExchangeRate-API
interface ExchangeRateResponse {
  base: string;
  date: string;
  rates: { [currency: string]: number };
}

interface ConversionCache {
  [key: string]: {
    rates: { [currency: string]: number };
    timestamp: number;
  };
}

// Cache for conversion rates (1 hour expiry)
const conversionCache: ConversionCache = {};
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  // If same currency, return original amount
  if (fromCurrency === toCurrency) {
    return amount;
  }

  try {
    // Check cache first
    const cacheKey = fromCurrency;
    const cached = conversionCache[cacheKey];
    const now = Date.now();

    let rates: { [currency: string]: number };

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      // Use cached rates
      rates = cached.rates;
    } else {
      // Fetch fresh rates
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ExchangeRateResponse = await response.json();
      rates = data.rates;

      // Cache the rates
      conversionCache[cacheKey] = {
        rates,
        timestamp: now
      };
    }

    // Get conversion rate
    const rate = rates[toCurrency];
    if (!rate) {
      throw new Error(`Currency ${toCurrency} not found in rates`);
    }

    // Convert amount
    const convertedAmount = amount * rate;
    return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places

  } catch (error) {
    console.error('Currency conversion error:', error);
    // Return original amount as fallback
    return amount;
  }
};

// Get available currencies from cache or API
export const getAvailableCurrencies = async (baseCurrency: string): Promise<string[]> => {
  try {
    const cacheKey = baseCurrency;
    const cached = conversionCache[cacheKey];
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      return Object.keys(cached.rates);
    }

    // Fetch fresh rates to get available currencies
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ExchangeRateResponse = await response.json();
    
    // Cache the rates
    conversionCache[cacheKey] = {
      rates: data.rates,
      timestamp: now
    };

    return Object.keys(data.rates);
  } catch (error) {
    console.error('Error getting available currencies:', error);
    // Return common currencies as fallback
    return ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'BRL'];
  }
};
