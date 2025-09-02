import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all'
    const department = searchParams.get('department') || 'all'
    const format = searchParams.get('format') || 'csv'

    // Build filters
    let reviewFilter: any = {}
    let userFilter: any = {}

    if (period !== 'all') {
      reviewFilter.reviewPeriodId = period
    }

    if (department !== 'all') {
      userFilter.department = department
    }

    // Get detailed report data
    const reviews = await prisma.review.findMany({
      where: {
        ...reviewFilter,
        employee: userFilter.department ? { department: userFilter.department } : undefined
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true,
            department: true,
            position: true
          }
        },
        supervisor: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true
          }
        },
        reviewPeriod: {
          select: {
            year: true,
            type: true
          }
        },
        goals: {
          select: {
            text: true,
            selfRating: true,
            supervisorRating: true,
            finalRating: true,
            selfComments: true,
            supervisorComments: true
          }
        },
        competencies: {
          select: {
            name: true,
            selfRating: true,
            supervisorRating: true,
            finalRating: true,
            selfComments: true,
            supervisorComments: true
          }
        }
      },
      orderBy: [
        { employee: { department: 'asc' } },
        { employee: { lastName: 'asc' } },
        { employee: { firstName: 'asc' } }
      ]
    })

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Employee ID',
        'First Name',
        'Last Name',
        'Department',
        'Position',
        'Supervisor',
        'Review Year',
        'Review Type',
        'Review Phase',
        'Self Evaluation Date',
        'Supervisor Evaluation Date',
        'Final Meeting Date',
        'Final Score (Calculated)',
        'Goals Count',
        'Goals Average Self Rating',
        'Goals Average Supervisor Rating',
        'Goals Average Final Rating',
        'Competencies Average Self Rating',
        'Competencies Average Supervisor Rating',
        'Competencies Average Final Rating',
        'Created Date',
        'Last Updated'
      ]

      const csvRows = [
        headers.join(','),
        ...reviews.map(review => {
          const employee = review.employee
          const supervisor = review.supervisor
          const period = review.reviewPeriod
          
          // Calculate goal averages
          const goalSelfAvg = review.goals.length > 0 
            ? review.goals.filter(g => g.selfRating !== null).reduce((sum, g) => sum + (g.selfRating || 0), 0) / review.goals.filter(g => g.selfRating !== null).length
            : 0
          
          const goalSupAvg = review.goals.length > 0 
            ? review.goals.filter(g => g.supervisorRating !== null).reduce((sum, g) => sum + (g.supervisorRating || 0), 0) / review.goals.filter(g => g.supervisorRating !== null).length
            : 0
          
          const goalFinalAvg = review.goals.length > 0 
            ? review.goals.filter(g => g.finalRating !== null).reduce((sum, g) => sum + (g.finalRating || 0), 0) / review.goals.filter(g => g.finalRating !== null).length
            : 0

          // Calculate competency averages  
          const compSelfAvg = review.competencies.length > 0 
            ? review.competencies.filter(c => c.selfRating !== null).reduce((sum, c) => sum + (c.selfRating || 0), 0) / review.competencies.filter(c => c.selfRating !== null).length
            : 0
          
          const compSupAvg = review.competencies.length > 0 
            ? review.competencies.filter(c => c.supervisorRating !== null).reduce((sum, c) => sum + (c.supervisorRating || 0), 0) / review.competencies.filter(c => c.supervisorRating !== null).length
            : 0
          
          const compFinalAvg = review.competencies.length > 0 
            ? review.competencies.filter(c => c.finalRating !== null).reduce((sum, c) => sum + (c.finalRating || 0), 0) / review.competencies.filter(c => c.finalRating !== null).length
            : 0

          // Calculate final score from goals and competencies
          const goalFinalScores = review.goals.filter(g => g.finalRating !== null).map(g => g.finalRating!)
          const compFinalScores = review.competencies.filter(c => c.finalRating !== null).map(c => c.finalRating!)
          const allFinalScores = [...goalFinalScores, ...compFinalScores]
          const calculatedFinalScore = allFinalScores.length > 0 
            ? (allFinalScores.reduce((sum, score) => sum + score, 0) / allFinalScores.length).toFixed(2)
            : ''

          return [
            `"${employee.employeeId}"`,
            `"${employee.firstName}"`,
            `"${employee.lastName}"`,
            `"${employee.department || ''}"`,
            `"${employee.position || ''}"`,
            `"${supervisor ? `${supervisor.firstName} ${supervisor.lastName}` : ''}"`,
            period?.year || '',
            period?.type === 'MID_YEAR' ? 'Mid-Year' : 'End-Year',
            review.phase,
            review.selfEvaluationDate?.toISOString().split('T')[0] || '',
            review.supervisorEvaluationDate?.toISOString().split('T')[0] || '',
            review.finalMeetingDate?.toISOString().split('T')[0] || '',
            calculatedFinalScore,
            review.goals.length,
            goalSelfAvg.toFixed(2),
            goalSupAvg.toFixed(2),
            goalFinalAvg.toFixed(2),
            compSelfAvg.toFixed(2),
            compSupAvg.toFixed(2),
            compFinalAvg.toFixed(2),
            review.createdAt.toISOString().split('T')[0],
            review.updatedAt.toISOString().split('T')[0]
          ].join(',')
        })
      ]

      const csvContent = csvRows.join('\n')
      
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="performance-report-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })

    } else if (format === 'pdf') {
      // For PDF export, we'll create a simple HTML report that can be converted to PDF
      // In a real implementation, you might use a library like puppeteer or jsPDF
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Performance Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { margin-bottom: 30px; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .table th { background-color: #f2f2f2; }
            .section { margin-bottom: 30px; }
            .metric { display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Performance Management Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString('en-GB')}</p>
            ${department !== 'all' ? `<p>Department: ${department}</p>` : ''}
            ${period !== 'all' ? `<p>Review Period: ${period}</p>` : ''}
          </div>
          
          <div class="summary">
            <h2>Summary Statistics</h2>
            <div class="metric">
              <strong>Total Reviews:</strong> ${reviews.length}
            </div>
            <div class="metric">
              <strong>Completed:</strong> ${reviews.filter(r => r.phase === 'COMPLETED').length}
            </div>
            <div class="metric">
              <strong>Completion Rate:</strong> ${Math.round((reviews.filter(r => r.phase === 'COMPLETED').length / reviews.length) * 100)}%
            </div>
          </div>

          <div class="section">
            <h2>Review Details</h2>
            <table class="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Review Type</th>
                  <th>Phase</th>
                  <th>Final Score</th>
                </tr>
              </thead>
              <tbody>
                ${reviews.map(review => `
                  <tr>
                    <td>${review.employee.firstName} ${review.employee.lastName}</td>
                    <td>${review.employee.department || 'N/A'}</td>
                    <td>${review.reviewPeriod?.year} - ${review.reviewPeriod?.type === 'MID_YEAR' ? 'Mid-Year' : 'End-Year'}</td>
                    <td>${review.phase}</td>
                    <td>${(() => {
                      const goalFinalScores = review.goals.filter(g => g.finalRating !== null).map(g => g.finalRating!)
                      const compFinalScores = review.competencies.filter(c => c.finalRating !== null).map(c => c.finalRating!)
                      const allFinalScores = [...goalFinalScores, ...compFinalScores]
                      return allFinalScores.length > 0 
                        ? (allFinalScores.reduce((sum, score) => sum + score, 0) / allFinalScores.length).toFixed(2)
                        : 'N/A'
                    })()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </body>
        </html>
      `

      return new NextResponse(htmlContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="performance-report-${new Date().toISOString().split('T')[0]}.html"`
        }
      })
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })

  } catch (error) {
    console.error('Error exporting report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}