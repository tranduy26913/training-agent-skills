import { Response } from 'express';
import { CobolGateway } from './employees.service';
import { sendSuccess, handleError } from '@utils/response.util';
import type { AuthenticatedRequest } from '@types-express';

// 従業員コントローラー / Employees controller - delegates all business logic to COBOL
export class EmployeesController {
  private gateway: CobolGateway;

  constructor(gateway?: CobolGateway) {
    // COBOLゲートウェイの依存性注入 / Allow injecting gateway for testing
    this.gateway = gateway ?? new CobolGateway();
  }

  // 従業員一覧取征E/ Get paginated list of employees
  async getEmployees(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filters = {
        search: req.query.search as string | undefined,
        department: req.query.department as string | undefined,
        status: req.query.status as string | undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      };
      console.log('Received filters:', filters);
      const result = await this.gateway.getEmployees(filters as any);
      console.log('Received result:', result);
      sendSuccess(res, result);
    } catch (error) {
      handleError(res, error);
    }
  }

  // 従業員詳細取征E/ Get single employee by ID
  async getEmployee(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const employee = await this.gateway.getEmployee(id);
      sendSuccess(res, employee);
    } catch (error) {
      handleError(res, error);
    }
  }

  // 従業員作�E / Create a new employee
  async createEmployee(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const employee = await this.gateway.createEmployee(req.body);
      sendSuccess(res, employee, 201);
    } catch (error) {
      handleError(res, error);
    }
  }

  // 従業員更新 / Update an existing employee
  async updateEmployee(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const employee = await this.gateway.updateEmployee(id, req.body);
      sendSuccess(res, employee);
    } catch (error) {
      handleError(res, error);
    }
  }

  // 従業員削除 / Delete an employee
  async deleteEmployee(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      await this.gateway.deleteEmployee(id);
      sendSuccess(res, { message: 'Employee deleted successfully' });
    } catch (error) {
      handleError(res, error);
    }
  }
}
