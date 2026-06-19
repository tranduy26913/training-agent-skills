import { ServiceError } from '@models/common.model';
import type { EmployeeRow, EmployeeFilters, CreateEmployeeDto, UpdateEmployeeDto } from '@models/employees.model';
import type { PaginatedResult } from '@models/common.model';

// COBOLエラーコーチE/ COBOL CGI error code type
type CobolErrorCode = 'NOT_FOUND' | 'DUPLICATE_CODE' | 'DUPLICATE_EMAIL' | 'VALIDATION_ERROR' | 'DB_ERROR';

// COBOLレスポンス垁E/ COBOL CGI response type
interface CobolResponse {
  status: 'OK' | 'CREATED' | 'ERROR';
  code?: CobolErrorCode;
  data?: unknown;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  message?: string;
}

// COBOLゲートウェイ / Gateway for calling COBOL CGI services via HTTP
export class CobolGateway {
  private readonly baseUrl: string;

  constructor() {
    // COBOLサービスのベ�EスURL / Base URL for COBOL CGI server
    this.baseUrl = process.env.COBOL_CGI_URL ?? 'http://localhost:8081/cgi-bin';
  }

  // COBOLエラーコードをHTTPスチE�EタスにマッチE/ Map COBOL error code to HTTP status
  private mapCobolError(code: CobolErrorCode): ServiceError {
    const errorMap: Record<CobolErrorCode, { status: number; message: string }> = {
      NOT_FOUND:        { status: 404, message: 'Employee not found' },
      DUPLICATE_CODE:   { status: 409, message: 'Employee code already exists' },
      DUPLICATE_EMAIL:  { status: 409, message: 'Email already exists' },
      VALIDATION_ERROR: { status: 400, message: 'Validation error' },
      DB_ERROR:         { status: 502, message: 'Database error' },
    };
    const mapped = errorMap[code] ?? { status: 502, message: 'COBOL service error' };
    return new ServiceError(mapped.message, mapped.status);
  }

  // COBOLレスポンスを解极E/ Parse and validate COBOL JSON response
  private async parseResponse(res: Response): Promise<CobolResponse> {
    const body = await res.json() as CobolResponse;
    if (body.status === 'ERROR' && body.code) {
      throw this.mapCobolError(body.code);
    }
    return body;
  }

  // フィルターをクエリストリングに変換 / Convert filter object to query string
  private toQueryString(params: Record<string, unknown>): string {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    return qs ? `?${qs}` : '';
  }

  // 従業員一覧取征E/ Get paginated list of employees
  async getEmployees(filters: EmployeeFilters): Promise<PaginatedResult<EmployeeRow>> {
    const qs = this.toQueryString(filters as Record<string, unknown>);
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/emp-list.exe${qs}`);
    } catch {
      throw new ServiceError('COBOL service unavailable', 502);
    }
    const body = await this.parseResponse(response);
    return {
      data: (body.data as EmployeeRow[]) ?? [],
      pagination: body.pagination ?? { page: 1, limit: 10, total: 0, pages: 0 },
    };
  }

  // 従業員詳細取征E/ Get single employee by ID
  async getEmployee(id: number): Promise<EmployeeRow> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/emp-detail.exe?id=${id}`);
    } catch {
      throw new ServiceError('COBOL service unavailable', 502);
    }
    const body = await this.parseResponse(response);
    return body.data as EmployeeRow;
  }

  // 従業員作�E / Create a new employee
  async createEmployee(data: CreateEmployeeDto): Promise<EmployeeRow> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/emp-create.exe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {
      throw new ServiceError('COBOL service unavailable', 502);
    }
    const body = await this.parseResponse(response);
    return body.data as EmployeeRow;
  }

  // 従業員更新 / Update an existing employee
  async updateEmployee(id: number, data: UpdateEmployeeDto): Promise<EmployeeRow> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/emp-update.exe?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {
      throw new ServiceError('COBOL service unavailable', 502);
    }
    const body = await this.parseResponse(response);
    return body.data as EmployeeRow;
  }

  // 従業員削除 / Delete an employee by ID
  async deleteEmployee(id: number): Promise<void> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/emp-delete.exe?id=${id}`, {
        method: 'DELETE',
      });
    } catch {
      throw new ServiceError('COBOL service unavailable', 502);
    }
    await this.parseResponse(response);
  }
}
