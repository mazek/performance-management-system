import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// Security constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ROWS = 1000; // Maximum number of users to import at once

// Helper function to parse CSV line properly
function parseCsvLine(line: string): string[] {
  const result = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++ // Skip next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

export async function POST(request: NextRequest) {
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

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Security: Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` 
      }, { status: 400 })
    }

    // Security: Validate file type
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      return NextResponse.json({ 
        error: 'Invalid file type. Only CSV files are allowed' 
      }, { status: 400 })
    }

    const csvText = await file.text()
    
    // Security: Sanitize CSV to prevent injection
    const sanitizedText = csvText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    const lines = sanitizedText.split('\n').filter(line => line.trim())

    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file must have header and at least one data row' }, { status: 400 })
    }

    // Security: Limit number of rows
    if (lines.length - 1 > MAX_ROWS) {
      return NextResponse.json({ 
        error: `Too many rows. Maximum ${MAX_ROWS} users can be imported at once` 
      }, { status: 400 })
    }

    const headers = lines[0].split(',').map(h => h.trim())
    const expectedHeaders = ['firstName', 'lastName', 'email', 'employeeId', 'department', 'position', 'role', 'supervisorEmployeeId', 'password']
    
    // Validate headers
    const missingHeaders = expectedHeaders.filter(h => !headers.includes(h))
    if (missingHeaders.length > 0) {
      return NextResponse.json({ 
        error: `Missing required headers: ${missingHeaders.join(', ')}` 
      }, { status: 400 })
    }

    const dataLines = lines.slice(1)
    const usersToCreate = []
    const errors = []

    // Get existing users for supervisor mapping
    const existingUsers = await prisma.user.findMany({
      select: { id: true, employeeId: true }
    })
    const employeeIdToId = new Map(existingUsers.map(u => [u.employeeId, u.id]))

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i]
      if (!line.trim()) continue

      // Parse CSV properly handling quoted values
      const values = parseCsvLine(line)
      
      if (values.length !== headers.length) {
        errors.push(`Row ${i + 2}: Invalid number of columns`)
        continue
      }

      const userData: Record<string, any> = {}
      headers.forEach((header, index) => {
        // Security: Sanitize CSV values to prevent formula injection
        let value = values[index] || null
        if (value && typeof value === 'string') {
          // Remove formula indicators
          if (/^[=+\-@]/.test(value)) {
            value = "'" + value
          }
          // Limit field length
          if (value.length > 255) {
            value = value.substring(0, 255)
          }
        }
        userData[header] = value
      })

      // Validate required fields
      if (!userData.firstName || !userData.lastName || !userData.email || !userData.employeeId || !userData.password) {
        errors.push(`Row ${i + 2}: Missing required fields`)
        continue
      }

      // Validate email format with stricter regex
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
      if (!emailRegex.test(userData.email) || userData.email.length > 254) {
        errors.push(`Row ${i + 2}: Invalid email format`)
        continue
      }

      // Validate role
      if (userData.role && !['EMPLOYEE', 'SUPERVISOR', 'HR', 'ADMIN'].includes(userData.role)) {
        errors.push(`Row ${i + 2}: Invalid role. Must be EMPLOYEE, SUPERVISOR, HR, or ADMIN`)
        continue
      }

      // Map supervisor employee ID to user ID
      let supervisorId = null
      if (userData.supervisorEmployeeId) {
        supervisorId = employeeIdToId.get(userData.supervisorEmployeeId)
        if (!supervisorId) {
          errors.push(`Row ${i + 2}: Supervisor with employee ID ${userData.supervisorEmployeeId} not found`)
          continue
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12)

      usersToCreate.push({
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        employeeId: userData.employeeId,
        department: userData.department || null,
        position: userData.position || null,
        role: userData.role || 'EMPLOYEE',
        supervisorId,
        password: hashedPassword,
        isActive: true
      })
    }

    if (errors.length > 0) {
      return NextResponse.json({ 
        error: `CSV validation failed:\n${errors.join('\n')}` 
      }, { status: 400 })
    }

    if (usersToCreate.length === 0) {
      return NextResponse.json({ error: 'No valid users to import' }, { status: 400 })
    }

    // Check for existing emails/employee IDs
    const existingEmails = new Set(existingUsers.map(u => u.email))
    const existingEmployeeIds = new Set(existingUsers.map(u => u.employeeId))
    
    const conflicts = []
    for (const userData of usersToCreate) {
      if (existingEmails.has(userData.email)) {
        conflicts.push(`Email ${userData.email} already exists`)
      }
      if (existingEmployeeIds.has(userData.employeeId)) {
        conflicts.push(`Employee ID ${userData.employeeId} already exists`)
      }
    }

    if (conflicts.length > 0) {
      return NextResponse.json({ 
        error: `Conflicts found:\n${conflicts.join('\n')}` 
      }, { status: 400 })
    }

    // Create users in batches to avoid timeout
    const batchSize = 10
    let imported = 0

    for (let i = 0; i < usersToCreate.length; i += batchSize) {
      const batch = usersToCreate.slice(i, i + batchSize)
      
      try {
        await prisma.user.createMany({
          data: batch,
          skipDuplicates: true
        })
        imported += batch.length
      } catch (error) {
        console.error('Error creating batch:', error)
        return NextResponse.json({ 
          error: `Failed to import users at batch starting row ${i + 2}` 
        }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      message: 'Users imported successfully',
      imported,
      total: usersToCreate.length
    })

  } catch (error) {
    console.error('Error importing CSV:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}