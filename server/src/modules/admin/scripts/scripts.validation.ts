import { z } from 'zod';

const contentSchema = z
  .string()
  .max(100000, 'Content phai la JSON hop le va khong qua 100000 ky tu')
  .nullable()
  .optional();

const statusSchema = z.enum(['draft', 'generated']).optional();

export const createScriptSchema = z.object({
  title: z.string().min(2, 'Ten kich ban phai tu 2-200 ky tu').max(200, 'Ten kich ban phai tu 2-200 ky tu'),
  idea: z.string().min(10, 'Y tuong phai tu 10-5000 ky tu').max(5000, 'Y tuong phai tu 10-5000 ky tu'),
  characterCount: z.number().int().min(1, 'So nhan vat phai tu 1-20').max(20, 'So nhan vat phai tu 1-20'),
  minScenes: z.number().int().min(1, 'So scenes toi thieu phai tu 1-50').max(50, 'So scenes toi thieu phai tu 1-50'),
  vibe: z.array(z.string().min(1)).min(1, 'Vibe phai co it nhat 1 tag'),
  content: contentSchema,
  status: statusSchema,
  projectId: z.number().int().positive('Project ID phai la so duong'),
});

export const updateScriptSchema = z.object({
  title: z.string().min(2, 'Ten kich ban phai tu 2-200 ky tu').max(200, 'Ten kich ban phai tu 2-200 ky tu').optional(),
  idea: z.string().min(10, 'Y tuong phai tu 10-5000 ky tu').max(5000, 'Y tuong phai tu 10-5000 ky tu').optional(),
  characterCount: z.number().int().min(1, 'So nhan vat phai tu 1-20').max(20, 'So nhan vat phai tu 1-20').optional(),
  minScenes: z.number().int().min(1, 'So scenes toi thieu phai tu 1-50').max(50, 'So scenes toi thieu phai tu 1-50').optional(),
  vibe: z.array(z.string().min(1)).min(1, 'Vibe phai co it nhat 1 tag').optional(),
  content: contentSchema,
  status: statusSchema,
});

export const generateScriptSchema = z.object({
  title: z.string().min(2, 'Ten kich ban phai tu 2-200 ky tu').max(200, 'Ten kich ban phai tu 2-200 ky tu'),
  idea: z.string().min(10, 'Y tuong phai tu 10-5000 ky tu').max(5000, 'Y tuong phai tu 10-5000 ky tu'),
  characterCount: z.number().int().min(1, 'So nhan vat phai tu 1-20').max(20, 'So nhan vat phai tu 1-20'),
  minScenes: z.number().int().min(1, 'So scenes toi thieu phai tu 1-50').max(50, 'So scenes toi thieu phai tu 1-50'),
  vibe: z.array(z.string().min(1)).min(1, 'Vibe phai co it nhat 1 tag'),
  aiModel: z.string().min(1, 'AI Model la bat buoc').max(100, 'AI Model khong qua 100 ky tu'),
});

export type CreateScriptInput = z.infer<typeof createScriptSchema>;
export type UpdateScriptInput = z.infer<typeof updateScriptSchema>;
export type GenerateScriptInput = z.infer<typeof generateScriptSchema>;
