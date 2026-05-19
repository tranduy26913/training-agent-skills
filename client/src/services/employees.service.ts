// 従業員APIサービス / Employees API service extending base client
import { BaseApiClient } from './base-api.service';
import type { Employee, CreateEmployeeDto, UpdateEmployeeDto, EmployeeFilters } from '@/types/employees.types';

// 従業員APIクライアント / Employees API client with domain-specific methods
class EmployeesApiClient extends BaseApiClient<Employee, CreateEmployeeDto, UpdateEmployeeDto> {
  constructor() {
    super('/employees');
  }

  // フィルター付き従業員一覧取得 / Get employees with filters
  async getEmployees(filters?: EmployeeFilters) {
    return this.getList(filters as Record<string, unknown>);
  }
}

// シングルトンインスタンス / Singleton instance
export const employeesApiService = new EmployeesApiClient();
