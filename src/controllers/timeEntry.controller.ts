import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const createTimeEntry = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { projectId, taskId, date, hours, isBillable, hourlyRate, notes } = req.body;

        // Verify project and task exist
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: { project: true },
        });

        if (!task || task.projectId !== projectId) {
            res.status(400).json({ error: 'Invalid project or task' });
            return;
        }

        // Create time entry
        const timeEntry = await prisma.timeEntry.create({
            data: {
                userId: req.user.userId,
                projectId,
                taskId,
                date: new Date(date),
                hours: parseFloat(hours),
                isBillable: isBillable !== undefined ? isBillable : task.isBillable,
                hourlyRate: hourlyRate || task.hourlyRate,
                notes,
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        client: {
                            select: {
                                id: true,
                                name: true,
                                color: true,
                            },
                        },
                    },
                },
                task: {
                    select: {
                        id: true,
                        name: true,
                        nameEs: true,
                        type: true,
                    },
                },
            },
        });

        res.status(201).json({
            message: 'Time entry created successfully',
            timeEntry,
        });
    } catch (error) {
        console.error('Create time entry error:', error);
        res.status(500).json({ error: 'Failed to create time entry' });
    }
};

export const getTimeEntries = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { startDate, endDate, projectId, userId } = req.query;

        // Build filter
        const where: any = {};

        // If not admin/manager, only show own entries
        if (req.user.role === 'EMPLOYEE') {
            where.userId = req.user.userId;
        } else if (userId) {
            where.userId = userId as string;
        }

        if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate as string),
                lte: new Date(endDate as string),
            };
        }

        if (projectId) {
            where.projectId = projectId as string;
        }

        const timeEntries = await prisma.timeEntry.findMany({
            where,
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
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
                    },
                },
                task: {
                    select: {
                        id: true,
                        name: true,
                        nameEs: true,
                        type: true,
                        isBillable: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                date: 'desc',
            },
        });

        res.json({ timeEntries });
    } catch (error) {
        console.error('Get time entries error:', error);
        res.status(500).json({ error: 'Failed to fetch time entries' });
    }
};

export const updateTimeEntry = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { id } = req.params;
        const { hours, isBillable, hourlyRate, notes } = req.body;

        // Check ownership
        const existing = await prisma.timeEntry.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ error: 'Time entry not found' });
            return;
        }

        if (existing.userId !== req.user.userId && req.user.role === 'EMPLOYEE') {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        // Check if already in submitted timesheet
        if (existing.timesheetId) {
            const timesheet = await prisma.timesheet.findUnique({
                where: { id: existing.timesheetId },
            });

            if (timesheet && timesheet.status !== 'DRAFT') {
                res.status(400).json({ error: 'Cannot edit time entry in submitted timesheet' });
                return;
            }
        }

        const timeEntry = await prisma.timeEntry.update({
            where: { id },
            data: {
                hours: hours !== undefined ? parseFloat(hours) : undefined,
                isBillable,
                hourlyRate,
                notes,
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        client: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
                task: {
                    select: {
                        id: true,
                        name: true,
                        nameEs: true,
                    },
                },
            },
        });

        res.json({
            message: 'Time entry updated successfully',
            timeEntry,
        });
    } catch (error) {
        console.error('Update time entry error:', error);
        res.status(500).json({ error: 'Failed to update time entry' });
    }
};

export const deleteTimeEntry = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { id } = req.params;

        const existing = await prisma.timeEntry.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ error: 'Time entry not found' });
            return;
        }

        if (existing.userId !== req.user.userId && req.user.role === 'EMPLOYEE') {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        // Check if already in submitted timesheet
        if (existing.timesheetId) {
            const timesheet = await prisma.timesheet.findUnique({
                where: { id: existing.timesheetId },
            });

            if (timesheet && timesheet.status !== 'DRAFT') {
                res.status(400).json({ error: 'Cannot delete time entry in submitted timesheet' });
                return;
            }
        }

        await prisma.timeEntry.delete({ where: { id } });

        res.json({ message: 'Time entry deleted successfully' });
    } catch (error) {
        console.error('Delete time entry error:', error);
        res.status(500).json({ error: 'Failed to delete time entry' });
    }
};

export const getWeeklySummary = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            res.status(400).json({ error: 'startDate and endDate are required' });
            return;
        }

        const timeEntries = await prisma.timeEntry.findMany({
            where: {
                userId: req.user.userId,
                date: {
                    gte: new Date(startDate as string),
                    lte: new Date(endDate as string),
                },
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        client: {
                            select: {
                                name: true,
                                color: true,
                            },
                        },
                    },
                },
                task: {
                    select: {
                        name: true,
                        type: true,
                    },
                },
            },
        });

        // Calculate summary
        const totalHours = timeEntries.reduce((sum, entry) => sum + Number(entry.hours), 0);
        const billableHours = timeEntries
            .filter((e) => e.isBillable)
            .reduce((sum, entry) => sum + Number(entry.hours), 0);
        const nonBillableHours = totalHours - billableHours;

        // Group by day
        const byDay: Record<string, number> = {};
        timeEntries.forEach((entry) => {
            const day = entry.date.toISOString().split('T')[0];
            byDay[day] = (byDay[day] || 0) + Number(entry.hours);
        });

        // Group by project
        const byProject: Record<string, { name: string; hours: number; client: string }> = {};
        timeEntries.forEach((entry) => {
            const projectId = entry.projectId;
            if (!byProject[projectId]) {
                byProject[projectId] = {
                    name: entry.project.name,
                    client: entry.project.client.name,
                    hours: 0,
                };
            }
            byProject[projectId].hours += Number(entry.hours);
        });

        res.json({
            summary: {
                totalHours,
                billableHours,
                nonBillableHours,
                billablePercentage: totalHours > 0 ? (billableHours / totalHours) * 100 : 0,
            },
            byDay,
            byProject: Object.values(byProject),
            entries: timeEntries,
        });
    } catch (error) {
        console.error('Get weekly summary error:', error);
        res.status(500).json({ error: 'Failed to fetch weekly summary' });
    }
};
