import { useQuery } from '@tanstack/react-query';
import { aquaQuickDailyApi } from '../api/aqua-quick-api';

const STALE_TIME_MS = 5 * 60 * 1000;

export function useWeatherTypeListBySeverityQuery() {
  return useQuery({
    queryKey: ['aqua', 'quick-daily-entry', 'weather-types'] as const,
    queryFn: () => aquaQuickDailyApi.getWeatherTypes(),
    enabled: true,
    staleTime: STALE_TIME_MS,
  });
}
