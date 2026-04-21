import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref, nextTick } from 'vue';
import { useEmailValidation } from '@/composables/useEmailValidation';

// APIサービスモック / Mock the users API service
vi.mock('@/services/users.service', () => ({
  usersApiService: {
    checkEmail: vi.fn(),
  },
}));

import { usersApiService } from '@/services/users.service';

describe('useEmailValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with empty error and not checking', () => {
    // 初期状態: エラーなし、チェック中でない
    const email = ref('');
    const { isChecking, emailError } = useEmailValidation(email);

    expect(isChecking.value).toBe(false);
    expect(emailError.value).toBe('');
  });

  it('does not call API when email is empty', async () => {
    // 空メールの場合はAPIを呼び出さない
    const email = ref('');
    useEmailValidation(email, undefined, 100);

    email.value = '';
    vi.advanceTimersByTime(200);
    await nextTick();

    expect(usersApiService.checkEmail).not.toHaveBeenCalled();
  });

  it('does not call API when email format is invalid', async () => {
    // 無効なメール形式の場合はAPIを呼び出さない
    const email = ref('not-an-email');
    useEmailValidation(email, undefined, 100);

    vi.advanceTimersByTime(200);
    await nextTick();

    expect(usersApiService.checkEmail).not.toHaveBeenCalled();
  });

  it('sets emailAlreadyExists error when email is taken', async () => {
    // メールが使用済みの場合は emailAlreadyExists エラーをセットする
    vi.mocked(usersApiService.checkEmail).mockResolvedValue({ exists: true });

    const email = ref('');
    const { emailError } = useEmailValidation(email, undefined, 100);

    // Change email to trigger the watcher
    email.value = 'used@test.com';
    await nextTick();

    // Advance past the 100ms debounce
    vi.advanceTimersByTime(150);
    await nextTick();
    // Flush the resolved promise from the API mock
    await Promise.resolve();
    await nextTick();

    expect(emailError.value).toBe('emailAlreadyExists');
  });

  it('clears error when email is available', async () => {
    // メールが使用可能の場合はエラーをクリアする
    vi.mocked(usersApiService.checkEmail).mockResolvedValue({ exists: false });

    const email = ref('');
    const { emailError } = useEmailValidation(email, undefined, 100);

    email.value = 'free@test.com';
    await nextTick();

    vi.advanceTimersByTime(150);
    await nextTick();
    await Promise.resolve();
    await nextTick();

    expect(emailError.value).toBe('');
  });

  it('calls API with excludeId when provided', async () => {
    // excludeIdが指定された場合、APIにexcludeIdを渡す
    vi.mocked(usersApiService.checkEmail).mockResolvedValue({ exists: false });

    const email = ref('');
    const excludeId = ref<number | undefined>(3);
    useEmailValidation(email, excludeId, 100);

    // Change email to trigger the watcher
    email.value = 'test@test.com';
    await nextTick();

    vi.advanceTimersByTime(150);
    await nextTick();
    await Promise.resolve();
    await nextTick();

    expect(usersApiService.checkEmail).toHaveBeenCalledWith('test@test.com', 3);
  });

  it('resets emailError immediately when email changes', async () => {
    // メールが変わった場合、すぐにエラーをリセットする
    vi.mocked(usersApiService.checkEmail).mockResolvedValue({ exists: true });
    const email = ref('');
    const { emailError } = useEmailValidation(email, undefined, 100);

    // First trigger: get an error
    email.value = 'used@test.com';
    await nextTick();
    vi.advanceTimersByTime(150);
    await nextTick();
    await Promise.resolve();
    await nextTick();

    // Now change email - error should reset immediately
    email.value = 'new@test.com';
    await nextTick();

    expect(emailError.value).toBe('');
  });
});
