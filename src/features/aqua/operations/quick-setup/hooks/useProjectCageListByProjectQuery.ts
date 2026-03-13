import { useQuery } from '@tanstack/react-query';
import { aquaQuickApi } from '../api/aqua-quick-api';

export function useProjectCageListByProjectQuery(projectId: number | null) {
  return useQuery({
    queryKey: ['aqua', 'quick-setup', 'project-cages', projectId] as const,
    queryFn: () => aquaQuickApi.getProjectCages(projectId!),
    enabled: projectId != null && projectId > 0,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}
