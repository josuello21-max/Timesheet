import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Create departments
    const departments = await Promise.all([
        prisma.department.upsert({
            where: { code: 'DES' },
            update: {},
            create: {
                name: 'Design',
                nameEs: 'Diseño',
                code: 'DES',
                color: '#FF6B6B',
                description: 'Creative design team',
            },
        }),
        prisma.department.upsert({
            where: { code: 'DEV' },
            update: {},
            create: {
                name: 'Development',
                nameEs: 'Desarrollo',
                code: 'DEV',
                color: '#4ECDC4',
                description: 'Software development team',
            },
        }),
        prisma.department.upsert({
            where: { code: 'CPY' },
            update: {},
            create: {
                name: 'Copywriting',
                nameEs: 'Redacción',
                code: 'CPY',
                color: '#95E1D3',
                description: 'Content and copywriting team',
            },
        }),
        prisma.department.upsert({
            where: { code: 'STR' },
            update: {},
            create: {
                name: 'Strategy',
                nameEs: 'Estrategia',
                code: 'STR',
                color: '#F38181',
                description: 'Strategic planning team',
            },
        }),
    ]);

    console.log('✅ Created departments');

    // Create users
    const hashedPassword = await bcrypt.hash('password123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@star5.com' },
        update: {},
        create: {
            email: 'admin@star5.com',
            password: hashedPassword,
            firstName: 'Alex',
            lastName: 'Morgan',
            role: 'SUPER_ADMIN',
            position: 'CEO',
            defaultHourlyRate: 150,
        },
    });

    const manager = await prisma.user.upsert({
        where: { email: 'manager@star5.com' },
        update: {},
        create: {
            email: 'manager@star5.com',
            password: hashedPassword,
            firstName: 'Carlos',
            lastName: 'Gutierrez',
            role: 'MANAGER',
            position: 'Creative Director',
            departmentId: departments[0].id,
            defaultHourlyRate: 100,
        },
    });

    const employee1 = await prisma.user.upsert({
        where: { email: 'maria@star5.com' },
        update: {},
        create: {
            email: 'maria@star5.com',
            password: hashedPassword,
            firstName: 'Maria',
            lastName: 'Rodriguez',
            role: 'EMPLOYEE',
            position: 'Senior Designer',
            departmentId: departments[0].id,
            managerId: manager.id,
            defaultHourlyRate: 75,
        },
    });

    const employee2 = await prisma.user.upsert({
        where: { email: 'juan@star5.com' },
        update: {},
        create: {
            email: 'juan@star5.com',
            password: hashedPassword,
            firstName: 'Juan',
            lastName: 'Perez',
            role: 'EMPLOYEE',
            position: 'Graphic Designer',
            departmentId: departments[0].id,
            managerId: manager.id,
            defaultHourlyRate: 65,
        },
    });

    console.log('✅ Created users');

    // Create clients
    const nike = await prisma.client.upsert({
        where: { code: 'NIKE' },
        update: {},
        create: {
            name: 'Nike',
            code: 'NIKE',
            color: '#000000',
            contactName: 'John Smith',
            contactEmail: 'john@nike.com',
        },
    });

    const cocaCola = await prisma.client.upsert({
        where: { code: 'COCA' },
        update: {},
        create: {
            name: 'Coca-Cola',
            code: 'COCA',
            color: '#F40009',
            contactName: 'Sarah Johnson',
            contactEmail: 'sarah@cocacola.com',
        },
    });

    console.log('✅ Created clients');

    // Create brands
    const nikeBrand = await prisma.brand.create({
        data: {
            name: 'Nike Running',
            code: 'NIKE_RUN',
            clientId: nike.id,
        },
    });

    const cokeZero = await prisma.brand.create({
        data: {
            name: 'Coke Zero',
            code: 'COKE_ZERO',
            clientId: cocaCola.id,
        },
    });

    console.log('✅ Created brands');

    // Create campaigns
    const nikeCampaign = await prisma.campaign.create({
        data: {
            name: 'Marathon Campaign',
            code: 'Q4_2024',
            brandId: nikeBrand.id,
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
        },
    });

    const cokeCampaign = await prisma.campaign.create({
        data: {
            name: 'Summer Vibes',
            code: 'SUMMER_2024',
            brandId: cokeZero.id,
            startDate: new Date('2024-06-01'),
            endDate: new Date('2024-08-31'),
        },
    });

    console.log('✅ Created campaigns');

    // Create projects
    const nikeProject = await prisma.project.create({
        data: {
            name: 'Nike Campaign - Q4',
            code: 'PRJ-001',
            status: 'ACTIVE',
            clientId: nike.id,
            campaignId: nikeCampaign.id,
            estimatedHours: 100,
            budgetAmount: 15000,
            startDate: new Date('2024-01-01'),
        },
    });

    const cokeProject = await prisma.project.create({
        data: {
            name: 'Summer Campaign 2024',
            code: 'PRJ-002',
            status: 'ACTIVE',
            clientId: cocaCola.id,
            campaignId: cokeCampaign.id,
            estimatedHours: 200,
            budgetAmount: 30000,
            startDate: new Date('2024-06-01'),
        },
    });

    console.log('✅ Created projects');

    // Create tasks
    const designTask = await prisma.task.create({
        data: {
            name: 'Art Direction',
            nameEs: 'Dirección de Arte',
            type: 'DESIGN',
            projectId: nikeProject.id,
            departmentId: departments[0].id,
            isBillable: true,
            hourlyRate: 80,
            estimatedHours: 40,
        },
    });

    const socialMediaTask = await prisma.task.create({
        data: {
            name: 'Social Media Assets',
            nameEs: 'Activos para Redes Sociales',
            type: 'DESIGN',
            projectId: cokeProject.id,
            departmentId: departments[0].id,
            isBillable: true,
            hourlyRate: 75,
            estimatedHours: 80,
        },
    });

    console.log('✅ Created tasks');

    // Create sample time entries
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday

    const timeEntry1 = await prisma.timeEntry.create({
        data: {
            userId: employee1.id,
            projectId: nikeProject.id,
            taskId: designTask.id,
            date: weekStart,
            hours: 8,
            isBillable: true,
            hourlyRate: 75,
            notes: 'Working on campaign concepts',
        },
    });

    const timeEntry2 = await prisma.timeEntry.create({
        data: {
            userId: employee1.id,
            projectId: cokeProject.id,
            taskId: socialMediaTask.id,
            date: new Date(weekStart.getTime() + 86400000), // Tuesday
            hours: 8,
            isBillable: true,
            hourlyRate: 75,
            notes: 'Created 5 social media posts',
        },
    });

    console.log('✅ Created time entries');

    console.log('🎉 Seed completed successfully!');
    console.log('\n📧 Test credentials:');
    console.log('Admin: admin@star5.com / password123');
    console.log('Manager: manager@star5.com / password123');
    console.log('Employee: maria@star5.com / password123');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
