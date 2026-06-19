import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { EmployeesController } from './employees.controller';
import { ServiceError } from '@models/common.model';
import type { CobolGateway } from './employees.service';

// CobolGateway のモチE��オブジェクトを作�E / Create a plain mock object for CobolGateway
function createMockGateway() {
  return {
    getEmployees: vi.fn(),
    getEmployee: vi.fn(),
    createEmployee: vi.fn(),
    updateEmployee: vi.fn(),
    deleteEmployee: vi.fn(),
  };
}

type MockGateway = ReturnType<typeof createMockGateway>;

// モチE��ゲートウェイを注入して Express アプリを構篁E/ Build app with injected mock gateway
function buildApp(gateway: MockGateway) {
  const app = express();
  app.use(express.json());
  const controller = new EmployeesController(gateway as unknown as CobolGateway);
  const router = express.Router();
  router.get('/', controller.getEmployees.bind(controller));
  router.post('/', controller.createEmployee.bind(controller));
  router.get('/:id', controller.getEmployee.bind(controller));
  router.put('/:id', controller.updateEmployee.bind(controller));
  router.delete('/:id', controller.deleteEmployee.bind(controller));
  app.use('/api/v1/admin/employees', router);
  return app;
}

describe('EmployeesController', () => {
  let gateway: MockGateway;

  beforeEach(() => {
    gateway = createMockGateway();
  });

  // =====================
  // GET /api/v1/admin/employees
  // =====================
  describe('GET /api/v1/admin/employees', () => {
    it('returns 200 with paginated data on success', async () => {
      // 成功時に 200 とペ�Eジネ�EションチE�Eタを返す
      const paginatedResult = {
        data: [{ id: 1, employee_code: 'EMP001', full_name: 'Nguyen Van A' }],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
      };
      gateway.getEmployees.mockResolvedValueOnce(paginatedResult);

      const res = await request(buildApp(gateway)).get('/api/v1/admin/employees');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination.total).toBe(1);
    });

    it('returns 502 when COBOL service is unavailable', async () => {
      // COBOL サービスダウン時に 502 を返す
      gateway.getEmployees.mockRejectedValueOnce(
        new ServiceError('COBOL service unavailable', 502),
      );

      const res = await request(buildApp(gateway)).get('/api/v1/admin/employees');

      expect(res.status).toBe(502);
    });
  });

  // =====================
  // POST /api/v1/admin/employees
  // =====================
  describe('POST /api/v1/admin/employees', () => {
    it('returns 201 with created employee', async () => {
      // 作�E成功時に 201 と従業員チE�Eタを返す
      const created = { id: 5, employee_code: 'EMP005', full_name: 'Test Employee' };
      gateway.createEmployee.mockResolvedValueOnce(created);

      const res = await request(buildApp(gateway))
        .post('/api/v1/admin/employees')
        .send({ employee_code: 'EMP005', full_name: 'Test Employee' });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe(5);
    });

    it('returns 409 when email already exists', async () => {
      // メールアドレスが重褁E��てぁE��場合に 409 を返す
      gateway.createEmployee.mockRejectedValueOnce(
        new ServiceError('Email already exists', 409),
      );

      const res = await request(buildApp(gateway))
        .post('/api/v1/admin/employees')
        .send({ employee_code: 'EMP005' });

      expect(res.status).toBe(409);
    });
  });

  // =====================
  // GET /api/v1/admin/employees/:id
  // =====================
  describe('GET /api/v1/admin/employees/:id', () => {
    it('returns 200 with employee data', async () => {
      // 成功時に 200 と従業員チE�Eタを返す
      const employee = { id: 1, employee_code: 'EMP001', full_name: 'Nguyen Van A' };
      gateway.getEmployee.mockResolvedValueOnce(employee);

      const res = await request(buildApp(gateway)).get('/api/v1/admin/employees/1');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(1);
    });

    it('returns 404 when employee not found', async () => {
      // 従業員が見つからなぁE��合に 404 を返す
      gateway.getEmployee.mockRejectedValueOnce(
        new ServiceError('Employee not found', 404),
      );

      const res = await request(buildApp(gateway)).get('/api/v1/admin/employees/999');

      expect(res.status).toBe(404);
    });
  });

  // =====================
  // PUT /api/v1/admin/employees/:id
  // =====================
  describe('PUT /api/v1/admin/employees/:id', () => {
    it('returns 200 with updated employee', async () => {
      // 更新成功時に 200 と更新後データを返す
      const updated = { id: 1, full_name: 'Updated Name' };
      gateway.updateEmployee.mockResolvedValueOnce(updated);

      const res = await request(buildApp(gateway))
        .put('/api/v1/admin/employees/1')
        .send({ full_name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.full_name).toBe('Updated Name');
    });
  });

  // =====================
  // DELETE /api/v1/admin/employees/:id
  // =====================
  describe('DELETE /api/v1/admin/employees/:id', () => {
    it('returns 200 on successful delete', async () => {
      // 削除成功時に 200 を返す
      gateway.deleteEmployee.mockResolvedValueOnce(undefined);

      const res = await request(buildApp(gateway)).delete('/api/v1/admin/employees/1');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Employee deleted successfully');
    });

    it('returns 404 when employee not found on delete', async () => {
      // 削除対象の従業員が見つからなぁE��合に 404 を返す
      gateway.deleteEmployee.mockRejectedValueOnce(
        new ServiceError('Employee not found', 404),
      );

      const res = await request(buildApp(gateway)).delete('/api/v1/admin/employees/999');

      expect(res.status).toBe(404);
    });
  });
});
