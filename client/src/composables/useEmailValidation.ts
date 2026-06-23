// Email duplicate check composable with debounce.
import { ref, watch, type Ref } from 'vue';
import { watchDebounced } from '@vueuse/core';
import { usersApiService } from '@services/users.service';

export interface UseEmailValidationReturn {
  isChecking: Ref<boolean>;
  emailError: Ref<string>;
  reset: () => void;
}

/**
 * Composable for debounced server-side email duplicate check.
 * @param email - reactive email ref to watch
 * @param excludeId - optional user ID to exclude (for edit mode)
 * @param debounceMs - debounce delay in milliseconds (default: 500)
 */
export function useEmailValidation(
  email: Ref<string>,
  excludeId?: Ref<number | undefined> | number,
  debounceMs = 500,
): UseEmailValidationReturn {
  const isChecking = ref(false);
  const emailError = ref('');

  const reset = (): void => {
    isChecking.value = false;
    emailError.value = '';
  };

  const getExcludeId = (): number | undefined => {
    if (typeof excludeId === 'number') return excludeId;
    return excludeId?.value;
  };

  watchDebounced(
    email,
    async (newEmail) => {
      // Skip if email is empty or invalid format.
      if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        emailError.value = '';
        return;
      }

      isChecking.value = true;
      emailError.value = '';

      try {
        const result = await usersApiService.checkEmail(newEmail, getExcludeId());
        if (result.exists) {
          emailError.value = 'emailAlreadyExists';
        }
      } catch {
        // Silently ignore server errors.
        emailError.value = '';
      } finally {
        isChecking.value = false;
      }
    },
    { debounce: debounceMs, immediate: false },
  );

  // Reset error when email changes before the debounce fires.
  watch(email, () => {
    emailError.value = '';
  });

  return { isChecking, emailError, reset };
}