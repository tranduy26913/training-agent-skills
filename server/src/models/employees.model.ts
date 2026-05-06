// 従業員モデル定義 / Employees module models and types
import type { RowDataPacket } from 'mysql2/promise';
import type { PaginationParams } from './common.model';

// 従業員部署 / Employee department enum
export type EmployeeDepartment = 'engineering' | 'hr' | 'finance' | 'marketing' | 'operations';

// 従業員役職 / Employee position enum
export type EmployeePosition =
  | 'engineer'
  | 'senior_engineer'
  | 'team_lead'
  | 'manager'
  | 'director'
  | 'analyst'
  | 'specialist'
  | 'intern';

// 従業員ステータス / Employee status enum
export type EmployeeStatus = 'active' | 'inactive';

// 従業員データ行 / Employee database row
export interface EmployeeRow extends RowDataPacket {
  id: number;
  employee_code: string;
  full_name: string;
  email: string;
  phone: string | null;
  department: EmployeeDepartment;
  position: EmployeePosition;
  salary: number;
  hire_date: string;
  status: EmployeeStatus;
  created_at: Date;
  updated_at: Date;
}

// 従業員フィルター / Employee list filter parameters
export interface EmployeeFilters extends PaginationParams {
  search?: string;
  department?: EmployeeDepartment;
  status?: EmployeeStatus;
}

// 従業員作成DTO / Create employee input DTO
export interface CreateEmployeeDto {
  employee_code: string;
  full_name: string;
  email: string;
  phone?: string;
  department: EmployeeDepartment;
  position: EmployeePosition;
  salary: number;
  hire_date: string;
  status: EmployeeStatus;
}

// 従業員更新DTO / Update employee input DTO
export interface UpdateEmployeeDto {
  full_name: string;
  email: string;
  phone?: string;
  department: EmployeeDepartment;
  position: EmployeePosition;
  salary: number;
  hire_date: string;
  status: EmployeeStatus;
}
