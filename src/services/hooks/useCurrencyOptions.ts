import { useMemo } from 'react';
import { useExchangeRate } from './useExchangeRate';

export interface CurrencyOption {
  value: number;
  label: string;
  symbol: string;
  dovizTipi: number;
  kurDegeri: number | null;
  code: string;
  dovizIsmi: string | null;
}

export const useCurrencyOptions = (tarih?: Date, fiyatTipi: number = 1) => {
  const { data: exchangeRates, isLoading, error } = useExchangeRate(tarih, fiyatTipi);

  const currencyOptions = useMemo((): CurrencyOption[] => {
    if (!exchangeRates || exchangeRates.length === 0) {
      return [];
    }

    return exchangeRates
      .map((rate) => {
        return {
          value: rate.dovizTipi,
          label: rate.dovizIsmi || `Döviz ${rate.dovizTipi}`,
          symbol: rate.dovizIsmi || `DOVIZ_${rate.dovizTipi}`,
          dovizTipi: rate.dovizTipi,
          kurDegeri: rate.kurDegeri,
          code: rate.dovizIsmi || `DOVIZ_${rate.dovizTipi}`,
          dovizIsmi: rate.dovizIsmi,
        };
      })
      .sort((a, b) => {
        if (a.dovizTipi === 1) return -1;
        if (b.dovizTipi === 1) return 1;
        return a.dovizTipi - b.dovizTipi;
      });
  }, [exchangeRates]);

  return {
    currencyOptions,
    isLoading,
    error,
  };
};
