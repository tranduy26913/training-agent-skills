// Projects data access using Prisma Client.
import { prisma } from '@database/prisma';
import type { Prisma } from '@prisma/client';

// Columns the project-list API exposes.
const PROJECT_PUBLIC_SELECT = {
  id: true,
  name: true,
  description: true,
  projectPrompt: true,
  headline: true,
  caption: true,
  subtext: true,
  ownerId: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
  owner: {
    select: { name: true },
  },
} as const;

export class ProjectsRepository {
  // Find all non-deleted projects, sorted by updatedAt desc.
  async findAll() {
    return prisma.project.findMany({
      where: { isDeleted: false },
      orderBy: { updatedAt: 'desc' },
      select: PROJECT_PUBLIC_SELECT,
    });
  }

  // Find a single non-deleted project by id.
  findById(id: number) {
    return prisma.project.findFirst({
      where: { id, isDeleted: false },
      select: PROJECT_PUBLIC_SELECT,
    });
  }

  // Create a new project.
  create(data: Prisma.ProjectCreateInput) {
    return prisma.project.create({ data });
  }

  // Update a project by id (only if not deleted). Returns count of affected rows.
  update(id: number, data: Prisma.ProjectUpdateInput) {
    return prisma.project.updateMany({
      where: { id, isDeleted: false },
      data,
    });
  }

  // Soft delete a project. Returns count of affected rows.
  softDelete(id: number) {
    return prisma.project.updateMany({
      where: { id, isDeleted: false },
      data: { isDeleted: true },
    });
  }
}
