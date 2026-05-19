// 従業員状態管理 / Employees Pinia store
import { defineStore } from 'pinia';
import { ref, computed, shallowRef } from 'vue';
import { employeesApiService } from '@/services/employees.service';
import type { Employee, EmployeeFilters, CreateEmployeeDto, UpdateEmployeeDto } from '@/types/employees.types';
import type { PaginationInfo } from '@/types/api.types';

export const useEmployeesStore = defineStore('employees', () => {
  // 状態 / State
  const employees = ref<Employee[]>([]);
  const currentEmployee = ref<Employee | null>(null);
  const pagination = ref<PaginationInfo>({ page: 1, limit: 20, total: 0, pages: 0 });
  const filters = ref<EmployeeFilters>({});
  const loading = shallowRef(false);
  const loadingEmployee = shallowRef(false);
  const error = shallowRef<string | null>(null);

  // ゲッター / Getters
  const totalEmployees = computed(() => pagination.value.total);
  const hasEmployees = computed(() => employees.value.length > 0);
  const isLastPage = computed(() => pagination.value.page >= pagination.value.pages);

  // 従業員一覧取得 / Fetch paginated employees
  async function fetchEmployees(newFilters?: EmployeeFilters): Promise<void> {
    if (newFilters) {
      filters.value = { ...filters.value, ...newFilters };
    }
    loading.value = true;
    error.value = null;
    try {
      const result = await employeesApiService.getEmployees(filters.value);
      employees.value = result.data;
      pagination.value = result.pagination;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch employees';
    } finally {
      loading.value = false;
    }
  }

  // 単一従業員取得 / Fetch single employee
  async function fetchEmployee(id: number): Promise<void> {
    loadingEmployee.value = true;
    error.value = null;
    try {
      currentEmployee.value = await employeesApiService.getById(id);
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch employee';
    } finally {
      loadingEmployee.value = false;
    }
  }

  // 従業員作成 / Create employee
  async function createEmployee(data: CreateEmployeeDto): Promise<void> {
    await employeesApiService.create(data);
  }

  // 従業員更新 / Update employee
  async function updateEmployee(id: number, data: UpdateEmployeeDto): Promise<void> {
    await employeesApiService.update(id, data);
  }

  // 従業員削除 / Delete employee
  async function deleteEmployee(id: number): Promise<void> {
    await employeesApiService.delete(id);
    await fetchEmployees();
  }

  // フィルターリセット / Reset filters and reload
  function resetFilters(): void {
    filters.value = {};
    fetchEmployees();
  }

  // 現在の従業員をクリア / Clear current employee
  function clearCurrentEmployee(): void {
    currentEmployee.value = null;
  }

  return {
    // 状態 / State
    employees,
    currentEmployee,
    pagination,
    filters,
    loading,
    loadingEmployee,
    error,
    // ゲッター / Getters
    totalEmployees,
    hasEmployees,
    isLastPage,
    // アクション / Actions
    fetchEmployees,
    fetchEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    resetFilters,
    clearCurrentEmployee,
  };
});
