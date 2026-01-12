import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getProjects = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { status, clientId, search } = req.query;

        const where: any = {};

        if (status) {
            where.status = status;
        }

        if (clientId) {
            where.clientId = clientId;
        }

        if (search) {
            where.OR = [
                { name: { contains: search as string, mode: 'insensitive' } },
                { code: { contains: search as string, mode: 'insensitive' } },
            ];
        }

        const projects = await prisma.project.findMany({
            where,
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        color: true,
                    },
                },
                campaign: {
                    select: {
                        id: true,
                        name: true,
                        brand: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        tasks: true,
                        timeEntries: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Calculate actual hours for each project
        const projectsWithHours = await Promise.all(
            projects.map(async (project) => {
                const timeEntries = await prisma.timeEntry.aggregate({
                    where: { projectId: project.id },
                    _sum: { hours: true },
                });

                return {
                    ...project,
                    actualHours: timeEntries._sum.hours || 0,
                    progress:
                        project.estimatedHours && timeEntries._sum.hours
                            ? (Number(timeEntries._sum.hours) / Number(project.estimatedHours)) * 100
                            : 0,
                };
            })
        );

        res.json({ projects: projectsWithHours });
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
};

export const getProjectById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                client: true,
                campaign: {
                    include: {
                        brand: true,
                    },
                },
                tasks: {
                    include: {
                        department: true,
                        _count: {
                            select: {
                                timeEntries: true,
                            },
                        },
                    },
                },
            },
        });

        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }

        // Get time entries statistics
        const timeStats = await prisma.timeEntry.aggregate({
            where: { projectId: id },
            _sum: {
                hours: true,
            },
        });

        // Get billable hours
        const billableStats = await prisma.timeEntry.aggregate({
            where: {
                projectId: id,
                isBillable: true,
            },
            _sum: {
                hours: true,
            },
        });

        const response = {
            ...project,
            actualHours: timeStats._sum.hours || 0,
            billableHours: billableStats._sum.hours || 0,
            progress:
                project.estimatedHours && timeStats._sum.hours
                    ? (Number(timeStats._sum.hours) / Number(project.estimatedHours)) * 100
                    : 0,
        };

        res.json({ project: response });
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
};

export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const {
            name,
            code,
            description,
            status,
            clientId,
            campaignId,
            estimatedHours,
            budgetAmount,
            startDate,
            endDate,
        } = req.body;

        const project = await prisma.project.create({
            data: {
                name,
                code,
                description,
                status: status || 'PLANNING',
                clientId,
                campaignId,
                estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
                budgetAmount: budgetAmount ? parseFloat(budgetAmount) : null,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
            },
            include: {
                client: true,
                campaign: {
                    include: {
                        brand: true,
                    },
                },
            },
        });

        res.status(201).json({
            message: 'Project created successfully',
            project,
        });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
};

export const updateProject = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const {
            name,
            description,
            status,
            campaignId,
            estimatedHours,
            budgetAmount,
            startDate,
            endDate,
        } = req.body;

        const project = await prisma.project.update({
            where: { id },
            data: {
                name,
                description,
                status,
                campaignId,
                estimatedHours: estimatedHours !== undefined ? parseFloat(estimatedHours) : undefined,
                budgetAmount: budgetAmount !== undefined ? parseFloat(budgetAmount) : undefined,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
            },
            include: {
                client: true,
                campaign: {
                    include: {
                        brand: true,
                    },
                },
            },
        });

        res.json({
            message: 'Project updated successfully',
            project,
        });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
};

export const deleteProject = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Check if project has time entries
        const timeEntriesCount = await prisma.timeEntry.count({
            where: { projectId: id },
        });

        if (timeEntriesCount > 0) {
            res.status(400).json({
                error: 'Cannot delete project with existing time entries',
            });
            return;
        }

        await prisma.project.delete({ where: { id } });

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
};

export const getProjectTasks = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const tasks = await prisma.task.findMany({
            where: { projectId: id, isActive: true },
            include: {
                department: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        res.json({ tasks });
    } catch (error) {
        console.error('Get project tasks error:', error);
        res.status(500).json({ error: 'Failed to fetch project tasks' });
    }
};
