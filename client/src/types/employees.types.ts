// 従業員型定義 / Employees module type definitions
import type { PaginationParams, SortParams } from './api.types';

// 部署 ENUM / Department enum values
export type EmployeeDepartment =
  | 'engineering'
  | 'hr'
  | 'finance'
  | 'marketing'
  | 'operations';

// 役職 ENUM / Position enum values
export type EmployeePosition =
  | 'engineer'
  | 'senior_engineer'
  | 'team_lead'
  | 'manager'
  | 'director'
  | 'analyst'
  | 'specialist'
  | 'intern';

// 従業員ステータス / Employee status
export type EmployeeStatus = 'active' | 'inactive';

// 従業員データ型 / Employee data type
export interface Employee {
  id: number;
  employee_code: string;
  full_name: string;
  email: string;
  phone: string | null;
  department: EmployeeDepartment;
  position: EmployeePosition;
  hire_date: string;
  salary: number;
  status: EmployeeStatus;
  created_at: string;
  updated_at: string;
}

// 従業員作成入力 / Create employee DTO
export interface CreateEmployeeDto {
  employee_code: string;
  full_name: string;
  email: string;
  phone?: string;
  department: EmployeeDepartment;
  position: EmployeePosition;
  hire_date: string;
  salary: number;
  status?: EmployeeStatus;
}

// 従業員更新入力 / Update employee DTO (all fields optional)
export type UpdateEmployeeDto = Partial<CreateEmployeeDto>;

// 従業員フィルター / Employee list filter parameters
export interface EmployeeFilters extends PaginationParams, SortParams {
  search?: string;
  department?: EmployeeDepartment | string;
  status?: EmployeeStatus | string;
}
