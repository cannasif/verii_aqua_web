import { useQuery } from '@tanstack/react-query';
import { erpCommonApi } from '../erp-common-api';
import type { CariDto } from '../erp-types';

export const useErpCustomers = (cariKodu?: string | null) => {
  return useQuery<CariDto[]>({
    queryKey: ['erpCustomers', cariKodu || 'all'],
    queryFn: () => erpCommonApi.getCaris(cariKodu),
    staleTime: 5 * 60 * 1000,
  });
};
