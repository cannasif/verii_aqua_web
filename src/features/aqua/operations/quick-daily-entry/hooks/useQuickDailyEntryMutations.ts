import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aquaQuickDailyApi } from '../api/aqua-quick-api';
import type {
  CreateFeedingPayload,
  CreateFeedingLinePayload,
  CreateMortalityPayload,
  CreateMortalityLinePayload,
  CreateDailyWeatherPayload,
  CreateNetOperationPayload,
  CreateNetOperationLinePayload,
} from '../types/quick-daily-entry-types';

const FEEDINGS_KEY = ['aqua', 'feedings'];
const MORTALITIES_KEY = ['aqua', 'mortalities'];
const DAILY_WEATHER_KEY = ['aqua', 'dailyWeathers'];
const NET_OPERATIONS_KEY = ['aqua', 'netOperations'];

export function useCreateFeedingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFeedingPayload) => aquaQuickDailyApi.createFeeding(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: FEEDINGS_KEY });
    },
  });
}

export function useCreateFeedingLineMutation() {
  return useMutation({
    mutationFn: (payload: CreateFeedingLinePayload) =>
      aquaQuickDailyApi.createFeedingLine(payload),
  });
}

export function useCreateMortalityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMortalityPayload) => aquaQuickDailyApi.createMortality(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MORTALITIES_KEY });
    },
  });
}

export function useCreateMortalityLineMutation() {
  return useMutation({
    mutationFn: (payload: CreateMortalityLinePayload) =>
      aquaQuickDailyApi.createMortalityLine(payload),
  });
}

export function useCreateDailyWeatherMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDailyWeatherPayload) =>
      aquaQuickDailyApi.createDailyWeather(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DAILY_WEATHER_KEY });
    },
  });
}

export function useCreateNetOperationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateNetOperationPayload) =>
      aquaQuickDailyApi.createNetOperation(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NET_OPERATIONS_KEY });
    },
  });
}

export function useCreateNetOperationLineMutation() {
  return useMutation({
    mutationFn: (payload: CreateNetOperationLinePayload) =>
      aquaQuickDailyApi.createNetOperationLine(payload),
  });
}
