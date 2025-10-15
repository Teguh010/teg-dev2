import React, { useState, useEffect } from 'react';
import SearchableSelect from '@/components/ui/searchable-select';
import { convertCurrency } from '../utils/currencyService';
import { currencyFlagOptions } from '../data/currencyFlagOptions';

interface CurrencyConverterProps {
  originalAmount: number;
  originalCurrency: string;
  defaultConverterCurrency: string;
  onConvertedAmountChange: (amount: number, currency: string) => void;
}

const CurrencyConverter: React.FC<CurrencyConverterProps> = ({
  originalAmount,
  originalCurrency,
  defaultConverterCurrency,
  onConvertedAmountChange,
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState(defaultConverterCurrency || originalCurrency);
  const [, setConvertedAmount] = useState(originalAmount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert currency when selection changes
  useEffect(() => {
    const performConversion = async () => {
      if (selectedCurrency === originalCurrency) {
        setConvertedAmount(originalAmount);
        onConvertedAmountChange(originalAmount, originalCurrency);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const converted = await convertCurrency(originalAmount, originalCurrency, selectedCurrency);
        setConvertedAmount(converted);
        onConvertedAmountChange(converted, selectedCurrency);
      } catch (err) {
        console.error('Conversion error:', err);
        setError('Failed to convert currency');
        setConvertedAmount(originalAmount);
        onConvertedAmountChange(originalAmount, originalCurrency);
      } finally {
        setIsLoading(false);
      }
    };

    performConversion();
  }, [originalAmount, originalCurrency, selectedCurrency, onConvertedAmountChange]);

  // Update when default converter currency changes
  useEffect(() => {
    setSelectedCurrency(defaultConverterCurrency || originalCurrency);
  }, [defaultConverterCurrency, originalCurrency]);

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <span className="text-md text-gray-600">Convert to :</span>
        <div className="flex-1">
          <SearchableSelect
            value={selectedCurrency}
            onChange={setSelectedCurrency}
            options={currencyFlagOptions}
            placeholder="Choose Currency"
            label=""
            disabled={isLoading}
          />
        </div>
      </div>
      
      {isLoading && (
        <div className="text-xs text-blue-600 mt-1">
          Converting...
        </div>
      )}
      
      {error && (
        <div className="text-xs text-red-600 mt-1">
          {error}
        </div>
      )}
    </div>
  );
};

export default CurrencyConverter;
