import { Router } from 'express';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { NotebookLmOperationsController } from './operations.controller';
import { listJobsQuerySchema, purgeDlqBodySchema, retryJobBodySchema, updateDlqNoteBodySchema } from './operations.validation';

const router = Router();
const controller = new NotebookLmOperationsController();

router.use(authMiddleware, requireRole('admin'));

router.get('/jobs', validate(listJobsQuerySchema, 'query'), controller.listJobs.bind(controller));
router.get('/jobs/:id', controller.getJobDetail.bind(controller));
router.post('/jobs/:id/retry', validate(retryJobBodySchema), controller.retryJob.bind(controller));
router.get('/dlq', controller.listDeadLetterJobs.bind(controller));
router.get('/dlq/:id', controller.getDeadLetterJob.bind(controller));
router.patch('/dlq/:id', validate(updateDlqNoteBodySchema), controller.updateDeadLetterJob.bind(controller));
router.delete('/dlq', validate(purgeDlqBodySchema), controller.purgeDeadLetterJobs.bind(controller));

export const notebookLmOperationsRoutes = router;