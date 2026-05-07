import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { NotebookLmController } from './notebooklm.controller';
import {
  addMemberSchema,
  createWorkspaceSchema,
  listWorkspacesQuerySchema,
  updateMemberRoleSchema,
  updateWorkspaceSchema,
  uploadDocumentSchema,
} from './notebooklm.validation';

const router = Router();
const controller = new NotebookLmController();

router.use(authMiddleware);

router.get('/workspaces', validate(listWorkspacesQuerySchema, 'query'), controller.listWorkspaces.bind(controller));
router.post('/workspaces', validate(createWorkspaceSchema), controller.createWorkspace.bind(controller));
router.get('/workspaces/:id', controller.getWorkspace.bind(controller));
router.put('/workspaces/:id', validate(updateWorkspaceSchema), controller.updateWorkspace.bind(controller));
router.delete('/workspaces/:id', controller.deleteWorkspace.bind(controller));

router.get('/workspaces/:id/members', controller.listMembers.bind(controller));
router.post('/workspaces/:id/members', validate(addMemberSchema), controller.addMember.bind(controller));
router.put('/workspaces/:id/members/:userId', validate(updateMemberRoleSchema), controller.updateMemberRole.bind(controller));
router.delete('/workspaces/:id/members/:userId', controller.removeMember.bind(controller));

router.get('/workspaces/:id/documents', controller.listDocuments.bind(controller));
router.post('/workspaces/:id/documents', validate(uploadDocumentSchema), controller.uploadDocument.bind(controller));
router.delete('/workspaces/:id/documents/:docId', controller.deleteDocument.bind(controller));

router.get('/jobs/:jobId', controller.getJobStatus.bind(controller));

export const notebookLmRoutes = router;
