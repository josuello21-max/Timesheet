import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const createOrGetTimesheet = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { weekStart } = req.body;
        const userId = req.user.userId;

        const weekStartDate = new Date(weekStart);
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekEndDate.getDate() + 6); // Sunday

        // Check if timesheet already exists
        let timesheet = await prisma.timesheet.findUnique({
            where: {
                userId_weekStart: {
                    userId,
                    weekStart: weekStartDate,
                },
            },
            include: {
                timeEntries: {
                    include: {
                        project: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                                client: {
                                    select: {
                                        name: true,
                                        color: true,
                                    },
                                },
                                campaign: {
                                    select: {
                                        name: true,
                                        brand: {
                                            select: {
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
                            },
                        },
                    },
                    orderBy: {
                        date: 'asc',
                    },
                },
                approvals: {
                    include: {
                        approver: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        if (!timesheet) {
            // Create new timesheet
            timesheet = await prisma.timesheet.create({
                data: {
                    userId,
                    weekStart: weekStartDate,
                    weekEnd: weekEndDate,
                    status: 'DRAFT',
                },
                include: {
                    timeEntries: {
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
                                    name: true,
                                },
                            },
                        },
                    },
                    approvals: true,
                },
            });
        }

        res.json({ timesheet });
    } catch (error) {
        console.error('Create/Get timesheet error:', error);
        res.status(500).json({ error: 'Failed to create or fetch timesheet' });
    }
};

export const submitTimesheet = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { id } = req.params;

        const timesheet = await prisma.timesheet.findUnique({
            where: { id },
            include: {
                timeEntries: true,
                user: {
                    select: {
                        managerId: true,
                    },
                },
            },
        });

        if (!timesheet) {
            res.status(404).json({ error: 'Timesheet not found' });
            return;
        }

        if (timesheet.userId !== req.user.userId && req.user.role === 'EMPLOYEE') {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        if (timesheet.status !== 'DRAFT') {
            res.status(400).json({ error: 'Timesheet already submitted' });
            return;
        }

        // Calculate totals
        const totalHours = timesheet.timeEntries.reduce(
            (sum, entry) => sum + Number(entry.hours),
            0
        );
        const billableHours = timesheet.timeEntries
            .filter((e) => e.isBillable)
            .reduce((sum, entry) => sum + Number(entry.hours), 0);
        const nonBillableHours = totalHours - billableHours;

        // Update timesheet
        const updatedTimesheet = await prisma.timesheet.update({
            where: { id },
            data: {
                status: 'SUBMITTED',
                totalHours,
                billableHours,
                nonBillableHours,
                submittedAt: new Date(),
            },
        });

        // Create approval request if user has a manager
        if (timesheet.user.managerId) {
            await prisma.timesheetApproval.create({
                data: {
                    timesheetId: id,
                    approverId: timesheet.user.managerId,
                    submitterId: timesheet.userId,
                    status: 'PENDING',
                },
            });
        }

        res.json({
            message: 'Timesheet submitted successfully',
            timesheet: updatedTimesheet,
        });
    } catch (error) {
        console.error('Submit timesheet error:', error);
        res.status(500).json({ error: 'Failed to submit timesheet' });
    }
};

export const approveTimesheet = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { id } = req.params;

        const approval = await prisma.timesheetApproval.findFirst({
            where: {
                timesheetId: id,
                approverId: req.user.userId,
                status: 'PENDING',
            },
            include: {
                timesheet: true,
            },
        });

        if (!approval) {
            res.status(404).json({ error: 'Approval not found or already processed' });
            return;
        }

        // Update approval
        await prisma.timesheetApproval.update({
            where: { id: approval.id },
            data: {
                status: 'APPROVED',
                approvedAt: new Date(),
            },
        });

        // Update timesheet status
        await prisma.timesheet.update({
            where: { id },
            data: {
                status: 'APPROVED',
            },
        });

        res.json({ message: 'Timesheet approved successfully' });
    } catch (error) {
        console.error('Approve timesheet error:', error);
        res.status(500).json({ error: 'Failed to approve timesheet' });
    }
};

export const rejectTimesheet = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { id } = req.params;
        const { rejectionReason } = req.body;

        if (!rejectionReason) {
            res.status(400).json({ error: 'Rejection reason is required' });
            return;
        }

        const approval = await prisma.timesheetApproval.findFirst({
            where: {
                timesheetId: id,
                approverId: req.user.userId,
                status: 'PENDING',
            },
        });

        if (!approval) {
            res.status(404).json({ error: 'Approval not found or already processed' });
            return;
        }

        // Update approval
        await prisma.timesheetApproval.update({
            where: { id: approval.id },
            data: {
                status: 'REJECTED',
                rejectionReason,
                rejectedAt: new Date(),
            },
        });

        // Update timesheet status to rejected
        await prisma.timesheet.update({
            where: { id },
            data: {
                status: 'REJECTED',
            },
        });

        res.json({
            message: 'Timesheet rejected successfully',
            rejectionReason,
        });
    } catch (error) {
        console.error('Reject timesheet error:', error);
        res.status(500).json({ error: 'Failed to reject timesheet' });
    }
};

export const getPendingApprovals = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const approvals = await prisma.timesheetApproval.findMany({
            where: {
                approverId: req.user.userId,
                status: 'PENDING',
            },
            include: {
                timesheet: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                position: true,
                                department: {
                                    select: {
                                        name: true,
                                        nameEs: true,
                                    },
                                },
                            },
                        },
                        timeEntries: {
                            include: {
                                project: {
                                    select: {
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
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
                submitter: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.json({ approvals });
    } catch (error) {
        console.error('Get pending approvals error:', error);
        res.status(500).json({ error: 'Failed to fetch pending approvals' });
    }
};

export const getTimesheetById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { id } = req.params;

        const timesheet = await prisma.timesheet.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        position: true,
                        department: {
                            select: {
                                name: true,
                                nameEs: true,
                            },
                        },
                    },
                },
                timeEntries: {
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
                            },
                        },
                    },
                    orderBy: {
                        date: 'asc',
                    },
                },
                approvals: {
                    include: {
                        approver: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        if (!timesheet) {
            res.status(404).json({ error: 'Timesheet not found' });
            return;
        }

        // Check permissions
        const isOwner = timesheet.userId === req.user.userId;
        const isManager = req.user.role === 'MANAGER' || req.user.role === 'SUPER_ADMIN';

        if (!isOwner && !isManager) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        res.json({ timesheet });
    } catch (error) {
        console.error('Get timesheet error:', error);
        res.status(500).json({ error: 'Failed to fetch timesheet' });
    }
};
