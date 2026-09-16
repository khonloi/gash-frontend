import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService, LoginPayload, RegisterPayload } from '@/services/authService';
import { userService } from '@/services/userService';
import { useAuthStore } from '@/store/useAuthStore';

export const authKeys = {
  me: ['auth', 'me'] as const,
};

export function useLoginMutation() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: (data) => {
      setAuth(data.user, data.tokens);
      queryClient.setQueryData(authKeys.me, data.user);
    },
  });
}

export function useRegisterMutation() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
    onSuccess: (data) => {
      setAuth(data.user, data.tokens);
      queryClient.setQueryData(authKeys.me, data.user);
    },
  });
}

export function useLogoutMutation() {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        await authService.logout(refreshToken || undefined);
      } catch (err) {
        // Even if server logout errors, clear client state
        console.warn('Backend logout failed:', err);
      }
    },
    onSettled: () => {
      clearAuth();
      queryClient.removeQueries({ queryKey: authKeys.me });
    },
  });
}

export function useMeQuery() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const updateUser = useAuthStore((state) => state.updateUser);

  return useQuery({
    queryKey: authKeys.me,
    queryFn: async () => {
      const user = await userService.getMe();
      updateUser(user);
      return user;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
