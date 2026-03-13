import { useQuery } from '@tanstack/react-query';
import { aquaQuickDailyApi } from '../api/aqua-quick-api';

export function useProjectCageListByProjectQuery(projectId: number | null) {
  return useQuery({
    queryKey: ['aqua', 'quick-daily-entry', 'project-cages', projectId] as const,
    queryFn: () => aquaQuickDailyApi.getProjectCages(projectId!),
    enabled: projectId != null && projectId > 0,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}
