import { useQuery } from '@tanstack/react-query';
import { erpCommonApi } from '../erp-common-api';

export const useStokGroup = (grupKodu?: string) => {
  return useQuery({
    queryKey: ['stokGroup', grupKodu || 'all'],
    queryFn: () => erpCommonApi.getStokGroup(grupKodu),
    staleTime: 5 * 60 * 1000,
  });
};
