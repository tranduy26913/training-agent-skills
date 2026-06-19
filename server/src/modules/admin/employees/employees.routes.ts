import { Router } from 'express';
import { EmployeesController } from './employees.controller';
import { authMiddleware, requireRole } from '@middleware/auth.middleware';
import { validate } from '@middleware/validate.middleware';
import { createEmployeeSchema, updateEmployeeSchema, listEmployeesSchema } from './employees.validation';

const router = Router();
const controller = new EmployeesController();

// 全ルートに認証 + 管琁E��E��限を適用 / Apply auth + admin guard to all routes
router.use(authMiddleware, requireRole('admin'));

router.get('/', validate(listEmployeesSchema, 'query'), controller.getEmployees.bind(controller));
router.post('/', validate(createEmployeeSchema), controller.createEmployee.bind(controller));
router.get('/:id', controller.getEmployee.bind(controller));
router.put('/:id', validate(updateEmployeeSchema), controller.updateEmployee.bind(controller));
router.delete('/:id', controller.deleteEmployee.bind(controller));

export const employeesRoutes = router;
