import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CobolGateway } from './employees.service';
import { ServiceError } from '../../models/common.model';

// グローバルfetchのモック / Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// モックレスポンス作成ヘルパー / Helper to create mock fetch responses
function mockResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

describe('CobolGateway', () => {
  let gateway: CobolGateway;

  beforeEach(() => {
    gateway = new CobolGateway();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =====================
  // getEmployees
  // =====================
  describe('getEmployees', () => {
    it('returns paginated result on success', async () => {
      // 成功時のページネーション結果を返す
      const cobolResponse = {
        status: 'OK',
        data: [
          { id: 1, employee_code: 'EMP001', full_name: 'Nguyen Van A' },
        ],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
      };
      mockFetch.mockReturnValueOnce(mockResponse(cobolResponse));

      const result = await gateway.getEmployees({});

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('emp-list.cgi'),
      );
    });

    it('passes filter params as query string', async () => {
      // フィルターパラメータをクエリストリングとして渡す
      mockFetch.mockReturnValueOnce(
        mockResponse({ status: 'OK', data: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }),
      );

      await gateway.getEmployees({ department: 'engineering', status: 'active', page: 2, limit: 25 });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('department=engineering');
      expect(calledUrl).toContain('status=active');
      expect(calledUrl).toContain('page=2');
      expect(calledUrl).toContain('limit=25');
    });
  });

  // =====================
  // getEmployee
  // =====================
  describe('getEmployee', () => {
    it('returns employee on success', async () => {
      // 成功時に従業員を返す
      const cobolResponse = {
        status: 'OK',
        data: { id: 1, employee_code: 'EMP001', full_name: 'Nguyen Van A' },
      };
      mockFetch.mockReturnValueOnce(mockResponse(cobolResponse));

      const result = await gateway.getEmployee(1);

      expect(result.id).toBe(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('emp-detail.cgi?id=1'),
      );
    });

    it('throws ServiceError 404 when COBOL returns NOT_FOUND', async () => {
      // COBOL が NOT_FOUND を返した場合に ServiceError 404 をスロー
      mockFetch.mockReturnValue(
        mockResponse({ status: 'ERROR', code: 'NOT_FOUND' }),
      );

      const err = await gateway.getEmployee(999).catch((e) => e);
      expect(err).toBeInstanceOf(ServiceError);
      expect(err.code).toBe(404);
    });
  });

  // =====================
  // createEmployee
  // =====================
  describe('createEmployee', () => {
    it('returns created employee on success', async () => {
      // 作成成功時に従業員を返す
      const newEmployee = { id: 10, employee_code: 'EMP010', full_name: 'Tran Thi B' };
      mockFetch.mockReturnValueOnce(
        mockResponse({ status: 'CREATED', data: newEmployee }),
      );

      const result = await gateway.createEmployee({
        employee_code: 'EMP010',
        full_name: 'Tran Thi B',
        email: 'b@test.com',
        department: 'hr',
        position: 'specialist',
        salary: 12000000,
        hire_date: '2025-01-01',
        status: 'active',
      });

      expect(result.id).toBe(10);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('emp-create.cgi'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('throws ServiceError 409 on DUPLICATE_EMAIL', async () => {
      // DUPLICATE_EMAIL の場合に ServiceError 409 をスロー
      mockFetch.mockReturnValueOnce(
        mockResponse({ status: 'ERROR', code: 'DUPLICATE_EMAIL' }),
      );

      await expect(
        gateway.createEmployee({} as any),
      ).rejects.toMatchObject({ code: 409 });
    });

    it('throws ServiceError 409 on DUPLICATE_CODE', async () => {
      // DUPLICATE_CODE の場合に ServiceError 409 をスロー
      mockFetch.mockReturnValueOnce(
        mockResponse({ status: 'ERROR', code: 'DUPLICATE_CODE' }),
      );

      await expect(
        gateway.createEmployee({} as any),
      ).rejects.toMatchObject({ code: 409 });
    });
  });

  // =====================
  // updateEmployee
  // =====================
  describe('updateEmployee', () => {
    it('returns updated employee on success', async () => {
      // 更新成功時に従業員を返す
      const updated = { id: 1, full_name: 'Updated Name' };
      mockFetch.mockReturnValueOnce(
        mockResponse({ status: 'OK', data: updated }),
      );

      const result = await gateway.updateEmployee(1, { full_name: 'Updated Name' } as any);

      expect(result.full_name).toBe('Updated Name');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('emp-update.cgi?id=1'),
        expect.objectContaining({ method: 'PUT' }),
      );
    });

    it('throws ServiceError 404 when NOT_FOUND', async () => {
      // NOT_FOUND の場合に ServiceError 404 をスロー
      mockFetch.mockReturnValueOnce(
        mockResponse({ status: 'ERROR', code: 'NOT_FOUND' }),
      );

      await expect(gateway.updateEmployee(999, {} as any)).rejects.toMatchObject({ code: 404 });
    });
  });

  // =====================
  // deleteEmployee
  // =====================
  describe('deleteEmployee', () => {
    it('resolves without error on success', async () => {
      // 成功時にエラーなく解決する
      mockFetch.mockReturnValueOnce(
        mockResponse({ status: 'OK', message: 'Employee deleted successfully' }),
      );

      await expect(gateway.deleteEmployee(1)).resolves.toBeUndefined();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('emp-delete.cgi?id=1'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('throws ServiceError 404 when NOT_FOUND', async () => {
      // NOT_FOUND の場合に ServiceError 404 をスロー
      mockFetch.mockReturnValueOnce(
        mockResponse({ status: 'ERROR', code: 'NOT_FOUND' }),
      );

      await expect(gateway.deleteEmployee(999)).rejects.toMatchObject({ code: 404 });
    });
  });

  // =====================
  // Network / COBOL service down
  // =====================
  describe('error handling', () => {
    it('throws ServiceError 502 when fetch throws (COBOL service down)', async () => {
      // COBOLサービスダウン時に ServiceError 502 をスロー
      mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      await expect(gateway.getEmployees({})).rejects.toMatchObject({ code: 502 });
    });

    it('throws ServiceError 400 on VALIDATION_ERROR from COBOL', async () => {
      // COBOLからのVALIDATION_ERRORで ServiceError 400 をスロー
      mockFetch.mockReturnValueOnce(
        mockResponse({ status: 'ERROR', code: 'VALIDATION_ERROR' }),
      );

      await expect(gateway.getEmployees({})).rejects.toMatchObject({ code: 400 });
    });

    it('throws ServiceError 502 on DB_ERROR from COBOL', async () => {
      // COBOLからのDB_ERRORで ServiceError 502 をスロー
      mockFetch.mockReturnValueOnce(
        mockResponse({ status: 'ERROR', code: 'DB_ERROR' }),
      );

      await expect(gateway.getEmployees({})).rejects.toMatchObject({ code: 502 });
    });
  });
});
