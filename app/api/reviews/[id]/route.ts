import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  const { id } = await params;

  if (!session) {
    return NextResponse.json(
      { error: 'Nie jesteś zalogowany' },
      { status: 401 }
    );
  }

  try {
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        reviewPeriod: {
          select: {
            year: true,
            type: true,
            status: true,
            startDate: true,
            endDate: true,
          }
        },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
            position: true,
          },
        },
        supervisor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        goals: {
          orderBy: { orderIndex: 'asc' },
        },
        competencies: true,
        developmentPlan: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Ocena nie została znaleziona' },
        { status: 404 }
      );
    }

    // Check access permissions
    const canAccess = 
      session.role === 'HR' || 
      session.role === 'ADMIN' ||
      review.employeeId === session.userId ||
      review.supervisorId === session.userId;

    if (!canAccess) {
      return NextResponse.json(
        { error: 'Brak dostępu do tej oceny' },
        { status: 403 }
      );
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania oceny' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  const { id } = await params;

  if (!session) {
    return NextResponse.json(
      { error: 'Nie jesteś zalogowany' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { goals, competencies, summary, developmentPlan, submit } = body;

    const review = await prisma.review.findUnique({
      where: { id },
      select: {
        id: true,
        employeeId: true,
        supervisorId: true,
        phase: true,
        selfEvalCompletedAt: true,
        supEvalCompletedAt: true,
        finalMeetingAt: true,
        completedAt: true,
        summary: true,
      }
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Ocena nie została znaleziona' },
        { status: 404 }
      );
    }

    // Check permissions based on phase
    const isEmployee = review.employeeId === session.userId;
    const isSupervisor = review.supervisorId === session.userId;
    
    let canEdit = false;
    let updatePhase = review.phase;

    if (review.phase === 'SELF_EVALUATION' && isEmployee) {
      // Allow edit only if not already submitted
      if (!review.selfEvalCompletedAt) {
        canEdit = true;
        if (submit) updatePhase = 'SUPERVISOR_EVALUATION';
      }
    } else if (review.phase === 'SUPERVISOR_EVALUATION' && isSupervisor) {
      // Allow edit only if not already submitted
      if (!review.supEvalCompletedAt) {
        canEdit = true;
        if (submit) updatePhase = 'FINAL_MEETING';
      }
    } else if (review.phase === 'FINAL_MEETING' && (isEmployee || isSupervisor)) {
      canEdit = true;
      if (submit) updatePhase = 'COMPLETED';
    }

    if (!canEdit) {
      return NextResponse.json(
        { error: 'Nie masz uprawnień do edycji tej oceny w obecnej fazie' },
        { status: 403 }
      );
    }

    // Update review phase and summary
    await prisma.review.update({
      where: { id },
      data: {
        phase: updatePhase,
        summary: summary || review.summary,
        ...(review.phase === 'SELF_EVALUATION' && submit ? {
          selfEvalCompletedAt: new Date(),
        } : {}),
        ...(review.phase === 'SUPERVISOR_EVALUATION' && submit ? {
          supEvalCompletedAt: new Date(),
        } : {}),
        ...(review.phase === 'FINAL_MEETING' && submit ? {
          completedAt: new Date(),
        } : {}),
      },
    });

    // Update goals
    if (goals && goals.length > 0) {
      for (let i = 0; i < goals.length; i++) {
        const goal = goals[i];
        
        // Check if it's a new goal (id starts with 'new-') or existing
        if (goal.id && !goal.id.startsWith('new-')) {
          // Update existing goal
          const updateData: any = {
            title: goal.title,
            description: goal.description,
            orderIndex: i,
          };
          
          if (review.phase === 'SELF_EVALUATION' && isEmployee) {
            updateData.selfScore = goal.selfScore;
            updateData.selfComment = goal.selfComment;
          } else if (review.phase === 'SUPERVISOR_EVALUATION' && isSupervisor) {
            updateData.supervisorScore = goal.supervisorScore;
            updateData.supervisorComment = goal.supervisorComment;
          } else if (review.phase === 'FINAL_MEETING') {
            updateData.finalScore = goal.finalScore;
          }

          try {
            await prisma.goal.update({
              where: { id: goal.id },
              data: updateData,
            });
          } catch (error) {
            console.error('Error updating goal:', goal.id, error);
          }
        } else if (goal.title && goal.description) {
          // Create new goal (only if it has content)
          try {
            await prisma.goal.create({
              data: {
                reviewId: id,
                title: goal.title,
                description: goal.description,
                orderIndex: i,
                selfScore: goal.selfScore,
                selfComment: goal.selfComment,
              },
            });
          } catch (error) {
            console.error('Error creating goal:', error);
          }
        }
      }
    }

    // Update competencies
    if (competencies && competencies.length > 0) {
      for (const comp of competencies) {
        const updateData: any = {};
        
        if (review.phase === 'SELF_EVALUATION' && isEmployee) {
          updateData.selfScore = comp.selfScore;
          updateData.selfComment = comp.selfComment;
        } else if (review.phase === 'SUPERVISOR_EVALUATION' && isSupervisor) {
          updateData.supervisorScore = comp.supervisorScore;
          updateData.supervisorComment = comp.supervisorComment;
        } else if (review.phase === 'FINAL_MEETING') {
          updateData.finalScore = comp.finalScore;
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.competency.update({
            where: { id: comp.id },
            data: updateData,
          });
        }
      }
    }

    // Update development plan (only in final meeting phase)
    if (review.phase === 'FINAL_MEETING' && developmentPlan && developmentPlan.length > 0) {
      // First, ensure development plan exists
      let devPlan = await prisma.developmentPlan.findUnique({
        where: { reviewId: id },
      });

      if (!devPlan) {
        devPlan = await prisma.developmentPlan.create({
          data: { reviewId: id },
        });
      }

      // Clear existing items and create new ones
      await prisma.developmentItem.deleteMany({
        where: { developmentPlanId: devPlan.id },
      });

      for (const item of developmentPlan) {
        if (item.competencyType && item.action) {
          await prisma.developmentItem.create({
            data: {
              developmentPlanId: devPlan.id,
              competencyType: item.competencyType,
              action: item.action,
              expectedOutcome: item.expectedOutcome,
              deadline: item.deadline ? new Date(item.deadline) : null,
            },
          });
        }
      }
    }

    // Fetch updated review
    const updatedReview = await prisma.review.findUnique({
      where: { id },
      include: {
        reviewPeriod: {
          select: {
            year: true,
            type: true,
            status: true,
            startDate: true,
            endDate: true,
          }
        },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
            position: true,
          },
        },
        supervisor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        goals: {
          orderBy: { orderIndex: 'asc' },
        },
        competencies: true,
        developmentPlan: {
          include: {
            items: true,
          },
        },
      },
    });

    return NextResponse.json({ review: updatedReview });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas aktualizacji oceny' },
      { status: 500 }
    );
  }
}