import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '../api/auth-api';
import { useAuthStore } from '@/stores/auth-store';
import { getUserFromToken } from '@/utils/jwt';
import type { LoginRequest, Branch } from '../types/auth';
import { ACCESS_CONTROL_QUERY_KEYS } from '@/features/access-control/utils/query-keys';

export const useLogin = (branches?: Branch[]) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  const resolveErrorMessage = (rawMessage?: string) => {
    if (!rawMessage) return t('auth.login.loginError');
    if (rawMessage === 'Error.User.InvalidCredentials') {
      return t('auth.login.wrongPassword');
    }
    const translated = t(rawMessage);
    return translated !== rawMessage ? translated : rawMessage;
  };

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: async (response, variables) => {
      if (response.success && response.data) {
        const user = getUserFromToken(response.data.token);

        if (user) {
          const selectedBranch = branches?.find((b) => b.id === variables.branchId) || null;
          const token = response.data.token;
          const rememberMe = variables.rememberMe;

          if (rememberMe) {
            localStorage.setItem('access_token', token);
            sessionStorage.removeItem('access_token');
          } else {
            sessionStorage.setItem('access_token', token);
            localStorage.removeItem('access_token');
          }
          setAuth(user, token, selectedBranch, rememberMe);
          await queryClient.invalidateQueries({ queryKey: ACCESS_CONTROL_QUERY_KEYS.ME_PERMISSIONS_BASE });
          await queryClient.refetchQueries({
            queryKey: ACCESS_CONTROL_QUERY_KEYS.ME_PERMISSIONS(user.id),
            type: 'active',
          });

          setTimeout(() => {
            navigate('/', { replace: true });
          }, 0);
        } else {
          toast.error(t('auth.login.loginError'));
        }
      } else {
        const errorMessage = resolveErrorMessage(response.message || response.exceptionMessage);
        toast.error(errorMessage);
      }
    },
    onError: (error: Error) => {
      const errorMessage = resolveErrorMessage(error.message);
      toast.error(errorMessage);
    },
  });
};