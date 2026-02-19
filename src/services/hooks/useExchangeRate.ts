import { useQuery } from '@tanstack/react-query';
import { erpCommonApi } from '../erp-common-api';

export const useExchangeRate = (tarih?: Date, fiyatTipi: number = 1) => {
  return useQuery({
    queryKey: ['exchangeRate', tarih?.toISOString().split('T')[0] || 'today', fiyatTipi],
    queryFn: () => erpCommonApi.getExchangeRate(tarih, fiyatTipi),
    staleTime: 5 * 60 * 1000,
  });
};
