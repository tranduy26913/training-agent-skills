import { z } from 'zod';

// 従業員部署列挙 / Department enum values
const departmentEnum = z.enum(['engineering', 'hr', 'finance', 'marketing', 'operations'], {
  message: 'Invalid department',
});

// 従業員役職列挙 / Position enum values
const positionEnum = z.enum(
  ['engineer', 'senior_engineer', 'team_lead', 'manager', 'director', 'analyst', 'specialist', 'intern'],
  { message: 'Invalid position' },
);

// 従業員スチE�Eタス列挙 / Status enum values
const statusEnum = z.enum(['active', 'inactive'], { message: 'Status must be active or inactive' });

// 過去もしく�E今日の日付バリチE�Eション / Validate hire_date is not in the future
const pastOrPresentDate = z
  .string()
  .date('Invalid date format (YYYY-MM-DD)')
  .refine((val) => new Date(val) <= new Date(), { message: 'Hire date cannot be in the future' });

// 従業員作�EスキーチE/ Schema for creating an employee
export const createEmployeeSchema = z.object({
  employee_code: z
    .string()
    .min(1, 'Employee code is required')
    .max(20, 'Employee code must be at most 20 characters')
    .regex(/^[A-Za-z0-9_]+$/, 'Employee code can only contain letters, numbers, and underscores'),
  full_name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be at most 100 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(20, 'Phone must be at most 20 characters').optional(),
  department: departmentEnum,
  position: positionEnum,
  salary: z.number().positive('Salary must be a positive number'),
  hire_date: pastOrPresentDate,
  status: statusEnum,
});

// 従業員更新スキーチE/ Schema for updating an employee (employee_code is read-only)
export const updateEmployeeSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be at most 100 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(20, 'Phone must be at most 20 characters').optional(),
  department: departmentEnum,
  position: positionEnum,
  salary: z.number().positive('Salary must be a positive number'),
  hire_date: pastOrPresentDate,
  status: statusEnum,
});

// 従業員一覧クエリスキーチE/ Schema for list query parameters
export const listEmployeesSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
  department: departmentEnum.optional(),
  status: statusEnum.optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type ListEmployeesQuery = z.infer<typeof listEmployeesSchema>;
