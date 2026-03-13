import { useQuery } from '@tanstack/react-query';
import { aquaQuickDailyApi } from '../api/aqua-quick-api';

export function useTransferTargetProjectCagesQuery(projectId: number | null) {
  return useQuery({
    queryKey: ['aqua', 'quick-daily-entry', 'transfer-target-project-cages', projectId] as const,
    queryFn: () => aquaQuickDailyApi.getTransferTargetProjectCages(projectId!),
    enabled: projectId != null && projectId > 0,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}
