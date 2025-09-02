import { PrismaClient, Role, CompetencyType, ReviewPeriodType, ReviewPeriodStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create review periods for 2024
  const midYear2024 = await prisma.reviewPeriod.create({
    data: {
      year: 2024,
      type: ReviewPeriodType.MID_YEAR,
      status: ReviewPeriodStatus.OPEN,
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-07-31'),
      openedAt: new Date(),
    },
  });

  const endYear2024 = await prisma.reviewPeriod.create({
    data: {
      year: 2024,
      type: ReviewPeriodType.END_YEAR,
      status: ReviewPeriodStatus.PLANNED,
      startDate: new Date('2024-12-01'),
      endDate: new Date('2025-01-31'),
    },
  });

  // Create review periods for 2025
  const midYear2025 = await prisma.reviewPeriod.create({
    data: {
      year: 2025,
      type: ReviewPeriodType.MID_YEAR,
      status: ReviewPeriodStatus.PLANNED,
      startDate: new Date('2025-06-01'),
      endDate: new Date('2025-07-31'),
    },
  });

  const endYear2025 = await prisma.reviewPeriod.create({
    data: {
      year: 2025,
      type: ReviewPeriodType.END_YEAR,
      status: ReviewPeriodStatus.PLANNED,
      startDate: new Date('2025-12-01'),
      endDate: new Date('2026-01-31'),
    },
  });

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@company.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'System',
      employeeId: 'EMP001',
      department: 'IT',
      position: 'System Administrator',
      role: Role.ADMIN,
    },
  });

  // Create HR user
  const hrPassword = await bcrypt.hash('hr123', 12);
  const hr = await prisma.user.create({
    data: {
      email: 'hr@company.com',
      password: hrPassword,
      firstName: 'Anna',
      lastName: 'Kowalska',
      employeeId: 'EMP002',
      department: 'HR',
      position: 'HR Manager',
      role: Role.HR,
    },
  });

  // Create supervisors
  const supervisorPassword = await bcrypt.hash('supervisor123', 12);
  
  const supervisor1 = await prisma.user.create({
    data: {
      email: 'jan.nowak@company.com',
      password: supervisorPassword,
      firstName: 'Jan',
      lastName: 'Nowak',
      employeeId: 'EMP003',
      department: 'Engineering',
      position: 'Engineering Manager',
      role: Role.SUPERVISOR,
    },
  });

  const supervisor2 = await prisma.user.create({
    data: {
      email: 'maria.wisniewska@company.com',
      password: supervisorPassword,
      firstName: 'Maria',
      lastName: 'Wiśniewska',
      employeeId: 'EMP004',
      department: 'Sales',
      position: 'Sales Manager',
      role: Role.SUPERVISOR,
    },
  });

  // Create employees
  const employeePassword = await bcrypt.hash('employee123', 12);
  
  const employees = [
    {
      email: 'piotr.kowalczyk@company.com',
      firstName: 'Piotr',
      lastName: 'Kowalczyk',
      employeeId: 'EMP005',
      department: 'Engineering',
      position: 'Senior Developer',
      supervisorId: supervisor1.id,
    },
    {
      email: 'katarzyna.lewandowska@company.com',
      firstName: 'Katarzyna',
      lastName: 'Lewandowska',
      employeeId: 'EMP006',
      department: 'Engineering',
      position: 'Frontend Developer',
      supervisorId: supervisor1.id,
    },
    {
      email: 'tomasz.wojcik@company.com',
      firstName: 'Tomasz',
      lastName: 'Wójcik',
      employeeId: 'EMP007',
      department: 'Engineering',
      position: 'Backend Developer',
      supervisorId: supervisor1.id,
    },
    {
      email: 'agnieszka.kaminska@company.com',
      firstName: 'Agnieszka',
      lastName: 'Kamińska',
      employeeId: 'EMP008',
      department: 'Sales',
      position: 'Sales Representative',
      supervisorId: supervisor2.id,
    },
    {
      email: 'marcin.zielinski@company.com',
      firstName: 'Marcin',
      lastName: 'Zieliński',
      employeeId: 'EMP009',
      department: 'Sales',
      position: 'Account Manager',
      supervisorId: supervisor2.id,
    },
  ];

  for (const employeeData of employees) {
    const employee = await prisma.user.create({
      data: {
        ...employeeData,
        password: employeePassword,
        role: Role.EMPLOYEE,
      },
    });

    // Create a sample review for mid-year 2024
    const review = await prisma.review.create({
      data: {
        reviewPeriodId: midYear2024.id,
        employeeId: employee.id,
        supervisorId: employeeData.supervisorId,
        phase: 'SELF_EVALUATION',
      },
    });

    // Note: Goals are now created by employees during the review process
    // No pre-defined goals are created in the seed

    // Create competencies for the review
    const competencyTypes = Object.values(CompetencyType);
    for (const type of competencyTypes) {
      await prisma.competency.create({
        data: {
          reviewId: review.id,
          type: type as CompetencyType,
        },
      });
    }
  }

  console.log('Database seeded successfully!');
  console.log('\nTest accounts:');
  console.log('Admin: admin@company.com / admin123');
  console.log('HR: hr@company.com / hr123');
  console.log('Supervisor: jan.nowak@company.com / supervisor123');
  console.log('Employee: piotr.kowalczyk@company.com / employee123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });