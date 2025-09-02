import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { validatePassword } from '@/lib/password-validation'

interface Params {
  params: {
    id: string
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get user and check admin privileges
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user || !['ADMIN', 'HR'].includes(user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { id } = params
    const body = await request.json()
    const { email, firstName, lastName, employeeId, department, position, role, supervisorId, password } = body

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check for email/employeeId conflicts with other users
    const conflictingUser = await prisma.user.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [
              { email },
              { employeeId }
            ]
          }
        ]
      }
    })

    if (conflictingUser) {
      return NextResponse.json({ error: 'Another user with this email or employee ID already exists' }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = {
      email,
      firstName,
      lastName,
      employeeId,
      department: department || null,
      position: position || null,
      role: role || 'EMPLOYEE',
      supervisorId: supervisorId || null
    }

    // Validate and hash password if provided
    if (password && password.trim()) {
      const validation = validatePassword(password)
      if (!validation.isValid) {
        return NextResponse.json({ 
          error: 'Password does not meet security requirements',
          details: validation.errors 
        }, { status: 400 })
      }
      updateData.password = await bcrypt.hash(password, 12)
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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
    const { password: _, ...safeUser } = updatedUser

    return NextResponse.json({ user: safeUser })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get user and check admin privileges
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user || !['ADMIN', 'HR'].includes(user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { id } = params

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        reviewsAsEmployee: true,
        reviewsAsSupervisor: true,
        subordinates: true
      }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent deleting user with active reviews or subordinates
    if (existingUser.reviewsAsEmployee.length > 0 || existingUser.reviewsAsSupervisor.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete user with active reviews. Archive the user instead.' 
      }, { status: 400 })
    }

    if (existingUser.subordinates.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete user with subordinates. Reassign subordinates first.' 
      }, { status: 400 })
    }

    // Instead of hard delete, deactivate the user
    const deactivatedUser = await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        email: `${existingUser.email}.deleted.${Date.now()}`, // Prevent email conflicts
        employeeId: `${existingUser.employeeId}.deleted.${Date.now()}` // Prevent ID conflicts
      }
    })

    return NextResponse.json({ message: 'User deactivated successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}