import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { generateToken, generateRefreshToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { email, password, firstName, lastName, role, departmentId } = req.body;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ error: 'User already exists' });
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                role: role || 'EMPLOYEE',
                departmentId,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                position: true,
                department: {
                    select: {
                        id: true,
                        name: true,
                        nameEs: true,
                    },
                },
            },
        });

        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        const refreshToken = generateRefreshToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        res.status(201).json({
            message: 'User created successfully',
            user,
            token,
            refreshToken,
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                        nameEs: true,
                        code: true,
                        color: true,
                    },
                },
                manager: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });

        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Check if user is active
        if (user.status !== 'ACTIVE') {
            res.status(403).json({ error: 'Account is not active' });
            return;
        }

        // Generate tokens
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        const refreshToken = generateRefreshToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            message: 'Login successful',
            user: userWithoutPassword,
            token,
            refreshToken,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                position: true,
                avatar: true,
                defaultHourlyRate: true,
                weeklyHourGoal: true,
                department: {
                    select: {
                        id: true,
                        name: true,
                        nameEs: true,
                        code: true,
                        color: true,
                    },
                },
                manager: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({ user });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { firstName, lastName, avatar, weeklyHourGoal } = req.body;

        const user = await prisma.user.update({
            where: { id: req.user.userId },
            data: {
                firstName,
                lastName,
                avatar,
                weeklyHourGoal,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                position: true,
                avatar: true,
                weeklyHourGoal: true,
            },
        });

        res.json({
            message: 'Profile updated successfully',
            user,
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};
