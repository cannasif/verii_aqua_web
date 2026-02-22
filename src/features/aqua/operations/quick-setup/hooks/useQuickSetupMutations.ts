import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aquaQuickApi } from '../api/aqua-quick-api';
import type {
  CreateProjectPayload,
  CreateGoodsReceiptPayload,
  CreateGoodsReceiptLinePayload,
  CreateGoodsReceiptFishDistributionPayload,
  CreateFishBatchPayload,
} from '../types/quick-setup-types';

const PROJECT_QUERY_KEY = ['aqua', 'quick-setup', 'projects'];
const GOODS_RECEIPT_QUERY_KEY = ['aqua', 'goodsReceipts'];

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProjectPayload) => aquaQuickApi.createProject(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEY });
    },
  });
}

export function useCreateGoodsReceiptMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGoodsReceiptPayload) =>
      aquaQuickApi.createGoodsReceipt(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_QUERY_KEY });
    },
  });
}

export function useCreateGoodsReceiptLineMutation() {
  return useMutation({
    mutationFn: (payload: CreateGoodsReceiptLinePayload) =>
      aquaQuickApi.createGoodsReceiptLine(payload),
  });
}

export function useCreateGoodsReceiptFishDistributionMutation() {
  return useMutation({
    mutationFn: (payload: CreateGoodsReceiptFishDistributionPayload) =>
      aquaQuickApi.createGoodsReceiptFishDistribution(payload),
  });
}

export function useCreateFishBatchMutation() {
  return useMutation({
    mutationFn: (payload: CreateFishBatchPayload) => aquaQuickApi.createFishBatch(payload),
  });
}

export function usePostGoodsReceiptMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => aquaQuickApi.postGoodsReceipt(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_QUERY_KEY });
    },
  });
}

export function useQuickSetupMutations(): {
  createProject: ReturnType<typeof useCreateProjectMutation>;
  createGoodsReceipt: ReturnType<typeof useCreateGoodsReceiptMutation>;
  createGoodsReceiptLine: ReturnType<typeof useCreateGoodsReceiptLineMutation>;
  createFishBatch: ReturnType<typeof useCreateFishBatchMutation>;
  createFishDistribution: ReturnType<typeof useCreateGoodsReceiptFishDistributionMutation>;
  postGoodsReceipt: ReturnType<typeof usePostGoodsReceiptMutation>;
} {
  const createProject = useCreateProjectMutation();
  const createGoodsReceipt = useCreateGoodsReceiptMutation();
  const createGoodsReceiptLine = useCreateGoodsReceiptLineMutation();
  const createFishBatch = useCreateFishBatchMutation();
  const createFishDistribution = useCreateGoodsReceiptFishDistributionMutation();
  const postGoodsReceipt = usePostGoodsReceiptMutation();
  return {
    createProject,
    createGoodsReceipt,
    createGoodsReceiptLine,
    createFishBatch,
    createFishDistribution,
    postGoodsReceipt,
  };
}
