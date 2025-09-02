import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/api-middleware'
import { Permission } from '@/lib/permissions'
import { createAuditLog, AuditAction, EntityType } from '@/lib/audit'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  // Check permission using new middleware
  const session = await requirePermission(request, Permission.VIEW_EMPLOYEES)
  if (session instanceof NextResponse) return session

  try {

    const users = await prisma.user.findMany({
      include: {
        supervisor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true
          }
        },
        subordinates: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true
          }
        }
      },
      orderBy: [
        { department: 'asc' },
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    })

    // Remove password from response
    const safeUsers = users.map(({ password, ...user }) => user)

    return NextResponse.json({ users: safeUsers })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Check permission using new middleware
  const session = await requirePermission(request, Permission.CREATE_EMPLOYEES)
  if (session instanceof NextResponse) return session

  try {

    const body = await request.json()
    const { email, firstName, lastName, employeeId, department, position, role, supervisorId, password } = body

    // Validate required fields
    if (!email || !firstName || !lastName || !employeeId || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { employeeId }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email or employee ID already exists' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user with tracking who created them
    const newUser = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        employeeId,
        department: department || null,
        position: position || null,
        role: role || 'EMPLOYEE',
        supervisorId: supervisorId || null,
        password: hashedPassword,
        isActive: true,
        authProvider: 'LOCAL',
        roleAssignedBy: session.email,
        roleAssignedById: session.userId,
        roleAssignedAt: new Date(),
      },
      include: {
        supervisor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true
          }
        },
        subordinates: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true
          }
        }
      }
    })

    // Remove password from response
    const { password: _, ...safeUser } = newUser

    // Log user creation
    await createAuditLog({
      userId: session.userId,
      action: AuditAction.USER_CREATED,
      entityType: EntityType.USER,
      entityId: newUser.id,
      details: {
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        createdBy: session.email,
      },
    })

    return NextResponse.json({ user: safeUser })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}