"use client"

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { 
  ArrowLeft, 
  Save, 
  Send,
  Target,
  Star,
  MessageSquare,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  Award,
  TrendingUp,
  FileText,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  Archive,
  Eye,
  Lock,
  LogOut
} from 'lucide-react'

interface CompetencyConfig {
  type: string
  name: string
  description: string
  icon: any
  color: string
}

interface Goal {
  id: string
  title: string
  description: string
  selfScore?: number
  selfComment?: string
  supervisorScore?: number
  supervisorComment?: string
  finalScore?: number
  isNew?: boolean
}

export default function ReviewPage() {
  const router = useRouter()
  const params = useParams()
  const reviewId = params.id as string
  const { t, language } = useLanguage()
  
  const [review, setReview] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [competencies, setCompetencies] = useState<any[]>([])
  const [developmentPlan, setDevelopmentPlan] = useState<any[]>([])
  const [summary, setSummary] = useState('')
  const [activeSection, setActiveSection] = useState('goals')

  const COMPETENCIES: CompetencyConfig[] = [
    { 
      type: 'DOSTARCZANIE', 
      name: t.review.competencies.types.DOSTARCZANIE, 
      description: t.review.competencies.descriptions.DOSTARCZANIE, 
      icon: Target, 
      color: 'bg-blue-100 text-blue-600' 
    },
    { 
      type: 'ROZWOJ', 
      name: t.review.competencies.types.ROZWOJ, 
      description: t.review.competencies.descriptions.ROZWOJ, 
      icon: TrendingUp, 
      color: 'bg-green-100 text-green-600' 
    },
    { 
      type: 'INNOWACYJNOSC', 
      name: t.review.competencies.types.INNOWACYJNOSC, 
      description: t.review.competencies.descriptions.INNOWACYJNOSC, 
      icon: Star, 
      color: 'bg-yellow-100 text-yellow-600' 
    },
    { 
      type: 'ODWAGA', 
      name: t.review.competencies.types.ODWAGA, 
      description: t.review.competencies.descriptions.ODWAGA, 
      icon: Award, 
      color: 'bg-red-100 text-red-600' 
    },
    { 
      type: 'ODPORNOSC', 
      name: t.review.competencies.types.ODPORNOSC, 
      description: t.review.competencies.descriptions.ODPORNOSC, 
      icon: FileText, 
      color: 'bg-purple-100 text-purple-600' 
    },
  ]

  const GRADES = [
    { value: 1, label: t.review.grades[1], color: 'bg-red-100 text-red-700 border-red-200', shortLabel: t.review.grades.short[1] },
    { value: 2, label: t.review.grades[2], color: 'bg-orange-100 text-orange-700 border-orange-200', shortLabel: t.review.grades.short[2] },
    { value: 3, label: t.review.grades[3], color: 'bg-yellow-100 text-yellow-700 border-yellow-200', shortLabel: t.review.grades.short[3] },
    { value: 4, label: t.review.grades[4], color: 'bg-green-100 text-green-700 border-green-200', shortLabel: t.review.grades.short[4] },
    { value: 5, label: t.review.grades[5], color: 'bg-blue-100 text-blue-700 border-blue-200', shortLabel: t.review.grades.short[5] },
  ]

  useEffect(() => {
    fetchReviewData()
    fetchUserData()
  }, [reviewId])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

  const fetchReviewData = async () => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`)
      if (!response.ok) {
        throw new Error('Review not found')
      }
      const data = await response.json()
      setReview(data.review)
      
      // If no goals exist, create empty ones for the employee to fill
      if (!data.review.goals || data.review.goals.length === 0) {
        setGoals([])
      } else {
        setGoals(data.review.goals)
      }
      
      setCompetencies(data.review.competencies || [])
      setSummary(data.review.summary || '')
      setDevelopmentPlan(data.review.developmentPlan?.items || [])
    } catch (error) {
      console.error('Error fetching review:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (submit = false) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goals: goals.filter(g => g.title && g.description), // Only save goals with content
          competencies,
          summary,
          developmentPlan,
          submit,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setReview(data.review)
        if (submit) {
          router.push('/dashboard')
        }
      }
    } catch (error) {
      console.error('Error saving review:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const updateGoal = (goalId: string, field: string, value: any) => {
    setGoals(goals.map(goal => 
      goal.id === goalId ? { ...goal, [field]: value } : goal
    ))
  }

  const addNewGoal = () => {
    if (goals.length < 7) {
      const newGoal: Goal = {
        id: `new-${Date.now()}`,
        title: '',
        description: '',
        isNew: true
      }
      setGoals([...goals, newGoal])
    }
  }

  const removeGoal = (goalId: string) => {
    setGoals(goals.filter(goal => goal.id !== goalId))
  }

  const updateCompetencyScore = (compId: string, field: string, value: any) => {
    setCompetencies(competencies.map(comp => 
      comp.id === compId ? { ...comp, [field]: value } : comp
    ))
  }

  const isEmployeeView = user?.id === review?.employeeId
  const isSupervisorView = user?.id === review?.supervisorId
  
  // Check if self-evaluation has been submitted
  const isSelfEvaluationSubmitted = review?.selfEvalCompletedAt !== null
  const isSupervisorEvaluationSubmitted = review?.supEvalCompletedAt !== null
  
  // Employees can edit their self-evaluation only if it hasn't been submitted
  const canEditSelfEvaluation = isEmployeeView && review?.phase === 'SELF_EVALUATION' && !isSelfEvaluationSubmitted
  
  // Supervisors can edit their evaluation only if it hasn't been submitted
  const canEditSupervisorEvaluation = isSupervisorView && review?.phase === 'SUPERVISOR_EVALUATION' && !isSupervisorEvaluationSubmitted
  
  // Final meeting phase allows editing for both
  const canEditFinal = review?.phase === 'FINAL_MEETING' && (isEmployeeView || isSupervisorView)
  
  // Determine if the current view should be read-only
  const isReadOnly = !canEditSelfEvaluation && !canEditSupervisorEvaluation && !canEditFinal
  
  // Allow supervisors to see employee self-evaluation after submission
  const canViewEmployeeEvaluation = isSupervisorView && isSelfEvaluationSubmitted
  
  // Allow employees to see their submitted self-evaluation
  const canViewOwnSubmission = isEmployeeView && isSelfEvaluationSubmitted

  const getPhaseInfo = (phase: string) => {
    const phases = {
      'NOT_STARTED': { label: t.review.phase.notStarted, color: 'text-gray-500', bgColor: 'bg-gray-100' },
      'SELF_EVALUATION': { label: t.review.phase.selfEvaluation, color: 'text-blue-600', bgColor: 'bg-blue-100' },
      'SUPERVISOR_EVALUATION': { label: t.review.phase.supervisorEvaluation, color: 'text-amber-600', bgColor: 'bg-amber-100' },
      'FINAL_MEETING': { label: t.review.phase.finalMeeting, color: 'text-purple-600', bgColor: 'bg-purple-100' },
      'COMPLETED': { label: t.review.phase.completed, color: 'text-green-600', bgColor: 'bg-green-100' }
    }
    return phases[phase as keyof typeof phases] || phases['NOT_STARTED']
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!review) return null

  const currentPhase = getPhaseInfo(review.phase)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-4 space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{t.common.back}</span>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg lg:text-xl font-bold text-gray-900">
                    {t.review.title} {review.reviewPeriod?.year} - {review.reviewPeriod?.type === 'MID_YEAR' ? 'Mid-Year' : 'End-Year'}
                  </h1>
                  {review.isArchived && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                      <Archive className="w-3 h-3" />
                      <span>Archived</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{isEmployeeView ? t.review.yourReview : `${review.employee?.firstName} ${review.employee?.lastName}`}</span>
                    </div>
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg ${currentPhase.bgColor}`}>
                      <Clock className="w-3 h-3" />
                      <span className={`font-medium ${currentPhase.color}`}>{currentPhase.label}</span>
                    </div>
                    {isReadOnly && (
                      <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-lg">
                        {canViewOwnSubmission || canViewEmployeeEvaluation ? (
                          <>
                            <Eye className="w-3 h-3" />
                            <span className="font-medium text-xs">
                              {language === 'pl' ? 'Tryb podglądu' : 'View Only'}
                            </span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" />
                            <span className="font-medium text-xs">
                              {language === 'pl' ? 'Tylko do odczytu' : 'Read Only'}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <LanguageSwitcher />
              {(canEditSelfEvaluation || canEditSupervisorEvaluation || canEditFinal) && (
                <>
                  <button
                    onClick={() => handleSave(false)}
                    disabled={saving}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span className="hidden sm:inline">{t.common.save}</span>
                  </button>
                  <button
                    onClick={() => handleSave(true)}
                    disabled={saving}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">{t.common.submitAndSend}</span>
                  </button>
                </>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t.common.logout}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Notification Banner for Read-Only Mode */}
      {isReadOnly && (canViewOwnSubmission || canViewEmployeeEvaluation) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className={`rounded-xl p-4 flex items-start space-x-3 ${
            canViewOwnSubmission 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-blue-50 border border-blue-200'
          }`}>
            <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              canViewOwnSubmission ? 'text-green-600' : 'text-blue-600'
            }`} />
            <div className="flex-1">
              <p className={`font-medium ${
                canViewOwnSubmission ? 'text-green-900' : 'text-blue-900'
              }`}>
                {canViewOwnSubmission 
                  ? (language === 'pl' 
                    ? 'Twoja samoocena została przesłana' 
                    : 'Your self-evaluation has been submitted')
                  : (language === 'pl'
                    ? `Przeglądasz samoocenę pracownika ${review.employee?.firstName} ${review.employee?.lastName}`
                    : `Viewing ${review.employee?.firstName} ${review.employee?.lastName}'s self-evaluation`)
                }
              </p>
              <p className={`text-sm mt-1 ${
                canViewOwnSubmission ? 'text-green-700' : 'text-blue-700'
              }`}>
                {canViewOwnSubmission
                  ? (language === 'pl'
                    ? 'Możesz przeglądać swoją ocenę, ale nie możesz już wprowadzać zmian. Twój przełożony otrzymał powiadomienie o zakończeniu samooceny.'
                    : 'You can view your evaluation but cannot make changes. Your supervisor has been notified of your submission.')
                  : (language === 'pl'
                    ? 'Pracownik zakończył swoją samoocenę. Możesz teraz przejrzeć jego odpowiedzi i przygotować swoją ocenę.'
                    : 'The employee has completed their self-evaluation. You can now review their responses and prepare your evaluation.')
                }
              </p>
              {isSelfEvaluationSubmitted && review.selfEvalCompletedAt && (
                <p className="text-xs text-gray-500 mt-2">
                  {language === 'pl' ? 'Data przesłania: ' : 'Submitted on: '}
                  {new Date(review.selfEvalCompletedAt).toLocaleDateString('pl-PL', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {[
              { phase: 'SELF_EVALUATION', label: t.review.phase.selfEvaluation, icon: User },
              { phase: 'SUPERVISOR_EVALUATION', label: t.review.phase.supervisorEvaluation, icon: Award },
              { phase: 'FINAL_MEETING', label: t.review.phase.finalMeeting, icon: Calendar },
              { phase: 'COMPLETED', label: t.review.phase.completed, icon: CheckCircle2 }
            ].map((step, index) => {
              const isActive = review.phase === step.phase
              const isCompleted = ['SUPERVISOR_EVALUATION', 'FINAL_MEETING', 'COMPLETED'].includes(review.phase) && 
                                 ['SELF_EVALUATION'].includes(step.phase) ||
                                 ['FINAL_MEETING', 'COMPLETED'].includes(review.phase) && 
                                 ['SUPERVISOR_EVALUATION'].includes(step.phase) ||
                                 ['COMPLETED'].includes(review.phase) && 
                                 ['FINAL_MEETING'].includes(step.phase)
              
              const StepIcon = step.icon
              
              return (
                <div key={step.phase} className="flex items-center">
                  <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive ? 'bg-blue-100 text-blue-600' :
                    isCompleted ? 'bg-green-100 text-green-600' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    <StepIcon className="w-5 h-5" />
                    <span className="font-medium text-sm hidden sm:inline">{step.label}</span>
                  </div>
                  {index < 3 && (
                    <div className={`hidden sm:block w-8 h-0.5 mx-2 ${
                      isCompleted ? 'bg-green-300' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'goals', label: t.review.goals.title, icon: Target },
            { id: 'competencies', label: t.review.competencies.title, icon: Star },
            ...(review.phase === 'FINAL_MEETING' ? [{ id: 'development', label: t.review.developmentPlan.title, icon: TrendingUp }] : []),
            { id: 'summary', label: t.review.summary.title, icon: MessageSquare }
          ].map((tab) => {
            const TabIcon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  activeSection === tab.id
                    ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Goals Section */}
        {activeSection === 'goals' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{t.review.goals.title}</h2>
                  <p className="text-gray-600">{t.review.goals.description}</p>
                </div>
              </div>
              {canEditSelfEvaluation && goals.length < 7 && (
                <button
                  onClick={addNewGoal}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'pl' ? 'Dodaj cel' : 'Add goal'}</span>
                </button>
              )}
            </div>
            
            <div className="space-y-6">
              {goals.length === 0 ? (
                canEditSelfEvaluation ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                    <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">
                      {language === 'pl' ? 'Nie masz jeszcze żadnych celów' : 'You have no goals yet'}
                    </p>
                    <button
                      onClick={addNewGoal}
                      className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{language === 'pl' ? 'Dodaj pierwszy cel' : 'Add first goal'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium mb-2">
                      {language === 'pl' ? 'Brak zdefiniowanych celów' : 'No goals defined'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {isEmployeeView 
                        ? (language === 'pl' 
                          ? 'Nie zdefiniowałeś żadnych celów podczas samooceny.' 
                          : 'You did not define any goals during self-evaluation.')
                        : (language === 'pl'
                          ? 'Pracownik nie zdefiniował żadnych celów podczas samooceny.'
                          : 'The employee did not define any goals during self-evaluation.')
                      }
                    </p>
                  </div>
                )
              ) : null}
              
              {goals.map((goal, index) => (
                <div key={goal.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-sm transition-shadow">
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        {canEditSelfEvaluation ? (
                          <input
                            type="text"
                            value={goal.title}
                            onChange={(e) => updateGoal(goal.id, 'title', e.target.value)}
                            placeholder={language === 'pl' ? 'Nazwa celu...' : 'Goal name...'}
                            className="flex-1 font-semibold text-gray-900 px-2 py-1 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
                          />
                        ) : (
                          <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                        )}
                      </div>
                      {canEditSelfEvaluation && (
                        <button
                          onClick={() => removeGoal(goal.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {canEditSelfEvaluation ? (
                      <textarea
                        value={goal.description}
                        onChange={(e) => updateGoal(goal.id, 'description', e.target.value)}
                        placeholder={language === 'pl' ? 'Opisz cel, co chcesz osiągnąć, jak zmierzysz sukces...' : 'Describe the goal, what you want to achieve, how you will measure success...'}
                        className="w-full text-gray-600 text-sm px-2 py-1 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                        rows={2}
                      />
                    ) : (
                      <p className="text-gray-600 text-sm">{goal.description}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Self Evaluation */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-700">{t.review.goals.selfScore}</label>
                      <div className="grid grid-cols-5 gap-1">
                        {GRADES.map((grade) => (
                          <button
                            key={grade.value}
                            onClick={() => canEditSelfEvaluation && updateGoal(goal.id, 'selfScore', grade.value)}
                            disabled={!canEditSelfEvaluation}
                            className={`aspect-square flex items-center justify-center p-1 rounded-lg text-xs font-bold transition-all border ${
                              goal.selfScore === grade.value
                                ? `${grade.color} border-current shadow-sm scale-105`
                                : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                            } ${!canEditSelfEvaluation ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-105'}`}
                            title={grade.label}
                          >
                            <span className="text-sm">{grade.value}</span>
                          </button>
                        ))}
                      </div>
                      {goal.selfScore && (
                        <p className="text-xs text-gray-500">
                          {GRADES.find(g => g.value === goal.selfScore)?.label}
                        </p>
                      )}
                      {canEditSelfEvaluation ? (
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            {t.review.goals.comments}
                          </label>
                          <textarea
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                            rows={3}
                            value={goal.selfComment || ''}
                            onChange={(e) => updateGoal(goal.id, 'selfComment', e.target.value)}
                            placeholder={t.review.goals.addComment}
                          />
                        </div>
                      ) : (goal.selfComment || (canViewEmployeeEvaluation && goal.selfScore)) ? (
                        <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                          <p className="text-xs font-medium text-gray-600 mb-1">{t.review.goals.comments}</p>
                          <p className="text-sm text-gray-700">{goal.selfComment || (language === 'pl' ? 'Brak komentarza' : 'No comment')}</p>
                        </div>
                      ) : null}
                    </div>
                    
                    {/* Supervisor Evaluation */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-700">{t.review.goals.supervisorScore}</label>
                      <div className="grid grid-cols-5 gap-1">
                        {GRADES.map((grade) => (
                          <button
                            key={grade.value}
                            onClick={() => canEditSupervisorEvaluation && updateGoal(goal.id, 'supervisorScore', grade.value)}
                            disabled={!canEditSupervisorEvaluation}
                            className={`aspect-square flex items-center justify-center p-1 rounded-lg text-xs font-bold transition-all border ${
                              goal.supervisorScore === grade.value
                                ? `${grade.color} border-current shadow-sm scale-105`
                                : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                            } ${!canEditSupervisorEvaluation ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-105'}`}
                            title={grade.label}
                          >
                            <span className="text-sm">{grade.value}</span>
                          </button>
                        ))}
                      </div>
                      {goal.supervisorScore && (
                        <p className="text-xs text-gray-500">
                          {GRADES.find(g => g.value === goal.supervisorScore)?.label}
                        </p>
                      )}
                      {canEditSupervisorEvaluation && (
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            {t.review.goals.comments}
                          </label>
                          <textarea
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                            rows={3}
                            value={goal.supervisorComment || ''}
                            onChange={(e) => updateGoal(goal.id, 'supervisorComment', e.target.value)}
                            placeholder={t.review.goals.addComment}
                          />
                        </div>
                      )}
                      {!canEditSupervisorEvaluation && goal.supervisorComment && (
                        <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                          <p className="text-xs font-medium text-gray-600 mb-1">{t.review.goals.comments}</p>
                          <p className="text-sm text-gray-700">{goal.supervisorComment}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Final Score */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-700">{t.review.goals.finalScore}</label>
                      <div className="grid grid-cols-5 gap-1">
                        {GRADES.map((grade) => (
                          <button
                            key={grade.value}
                            onClick={() => canEditFinal && updateGoal(goal.id, 'finalScore', grade.value)}
                            disabled={!canEditFinal}
                            className={`aspect-square flex items-center justify-center p-1 rounded-lg text-xs font-bold transition-all border ${
                              goal.finalScore === grade.value
                                ? `${grade.color} border-current shadow-sm scale-105`
                                : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                            } ${!canEditFinal ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-105'}`}
                            title={grade.label}
                          >
                            <span className="text-sm">{grade.value}</span>
                          </button>
                        ))}
                      </div>
                      {goal.finalScore && (
                        <p className="text-xs text-gray-500">
                          {GRADES.find(g => g.value === goal.finalScore)?.label}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Competencies Section */}
        {activeSection === 'competencies' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{t.review.competencies.title}</h2>
                <p className="text-gray-600">{t.review.competencies.description}</p>
              </div>
            </div>
            
            <div className="space-y-6">
              {COMPETENCIES.map((comp) => {
                const competency = competencies.find(c => c.type === comp.type)
                if (!competency) return null
                
                const CompIcon = comp.icon
                
                return (
                  <div key={competency.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-sm transition-shadow">
                    <div className="flex items-start space-x-4 mb-4">
                      <div className={`w-12 h-12 ${comp.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <CompIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{comp.name}</h3>
                        <p className="text-gray-600 text-sm">{comp.description}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Self Evaluation */}
                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-700">{t.review.competencies.selfScore}</label>
                        <div className="grid grid-cols-5 gap-1">
                          {GRADES.map((grade) => (
                            <button
                              key={grade.value}
                              onClick={() => canEditSelfEvaluation && updateCompetencyScore(competency.id, 'selfScore', grade.value)}
                              disabled={!canEditSelfEvaluation}
                              className={`aspect-square flex items-center justify-center p-1 rounded-lg text-xs font-bold transition-all border ${
                                competency.selfScore === grade.value
                                  ? `${grade.color} border-current shadow-sm scale-105`
                                  : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                              } ${!canEditSelfEvaluation ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-105'}`}
                              title={grade.label}
                            >
                              <span className="text-sm">{grade.value}</span>
                            </button>
                          ))}
                        </div>
                        {competency.selfScore && (
                          <p className="text-xs text-gray-500">
                            {GRADES.find(g => g.value === competency.selfScore)?.label}
                          </p>
                        )}
                        {canEditSelfEvaluation && (
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              {t.review.competencies.comments}
                            </label>
                            <textarea
                              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                              rows={3}
                              value={competency.selfComment || ''}
                              onChange={(e) => updateCompetencyScore(competency.id, 'selfComment', e.target.value)}
                              placeholder={t.review.competencies.addComment}
                            />
                          </div>
                        )}
                        {!canEditSelfEvaluation && competency.selfComment && (
                          <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                            <p className="text-xs font-medium text-gray-600 mb-1">{t.review.competencies.comments}</p>
                            <p className="text-sm text-gray-700">{competency.selfComment}</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Supervisor Evaluation */}
                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-700">{t.review.competencies.supervisorScore}</label>
                        <div className="grid grid-cols-5 gap-1">
                          {GRADES.map((grade) => (
                            <button
                              key={grade.value}
                              onClick={() => canEditSupervisorEvaluation && updateCompetencyScore(competency.id, 'supervisorScore', grade.value)}
                              disabled={!canEditSupervisorEvaluation}
                              className={`aspect-square flex items-center justify-center p-1 rounded-lg text-xs font-bold transition-all border ${
                                competency.supervisorScore === grade.value
                                  ? `${grade.color} border-current shadow-sm scale-105`
                                  : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                              } ${!canEditSupervisorEvaluation ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-105'}`}
                              title={grade.label}
                            >
                              <span className="text-sm">{grade.value}</span>
                            </button>
                          ))}
                        </div>
                        {competency.supervisorScore && (
                          <p className="text-xs text-gray-500">
                            {GRADES.find(g => g.value === competency.supervisorScore)?.label}
                          </p>
                        )}
                        {canEditSupervisorEvaluation && (
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              {t.review.competencies.comments}
                            </label>
                            <textarea
                              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                              rows={3}
                              value={competency.supervisorComment || ''}
                              onChange={(e) => updateCompetencyScore(competency.id, 'supervisorComment', e.target.value)}
                              placeholder={t.review.competencies.addComment}
                            />
                          </div>
                        )}
                        {!canEditSupervisorEvaluation && competency.supervisorComment && (
                          <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                            <p className="text-xs font-medium text-gray-600 mb-1">{t.review.competencies.comments}</p>
                            <p className="text-sm text-gray-700">{competency.supervisorComment}</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Final Score */}
                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-700">{t.review.competencies.finalScore}</label>
                        <div className="grid grid-cols-5 gap-1">
                          {GRADES.map((grade) => (
                            <button
                              key={grade.value}
                              onClick={() => canEditFinal && updateCompetencyScore(competency.id, 'finalScore', grade.value)}
                              disabled={!canEditFinal}
                              className={`aspect-square flex items-center justify-center p-1 rounded-lg text-xs font-bold transition-all border ${
                                competency.finalScore === grade.value
                                  ? `${grade.color} border-current shadow-sm scale-105`
                                  : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                              } ${!canEditFinal ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-105'}`}
                              title={grade.label}
                            >
                              <span className="text-sm">{grade.value}</span>
                            </button>
                          ))}
                        </div>
                        {competency.finalScore && (
                          <p className="text-xs text-gray-500">
                            {GRADES.find(g => g.value === competency.finalScore)?.label}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Development Plan Section */}
        {activeSection === 'development' && review.phase === 'FINAL_MEETING' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{t.review.developmentPlan.title}</h2>
                <p className="text-gray-600">{t.review.developmentPlan.description}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[0, 1].map((index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <h3 className="font-semibold text-gray-900">{t.review.developmentPlan.competency} {index + 1}</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.review.developmentPlan.selectCompetency}
                      </label>
                      <select
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={developmentPlan[index]?.competencyType || ''}
                        onChange={(e) => {
                          const newPlan = [...developmentPlan]
                          if (!newPlan[index]) {
                            newPlan[index] = { competencyType: e.target.value, action: '', expectedOutcome: '' }
                          } else {
                            newPlan[index].competencyType = e.target.value
                          }
                          setDevelopmentPlan(newPlan)
                        }}
                        disabled={!canEditFinal}
                      >
                        <option value="">{t.review.developmentPlan.selectCompetency}</option>
                        {COMPETENCIES.map((comp) => (
                          <option key={comp.type} value={comp.type}>
                            {comp.name} - {comp.description}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.review.developmentPlan.actions}
                      </label>
                      <textarea
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={4}
                        value={developmentPlan[index]?.action || ''}
                        onChange={(e) => {
                          const newPlan = [...developmentPlan]
                          if (!newPlan[index]) {
                            newPlan[index] = { competencyType: '', action: e.target.value, expectedOutcome: '' }
                          } else {
                            newPlan[index].action = e.target.value
                          }
                          setDevelopmentPlan(newPlan)
                        }}
                        disabled={!canEditFinal}
                        placeholder={t.review.developmentPlan.actionsPlaceholder}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.review.developmentPlan.expectedResults}
                      </label>
                      <textarea
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={3}
                        value={developmentPlan[index]?.expectedOutcome || ''}
                        onChange={(e) => {
                          const newPlan = [...developmentPlan]
                          if (!newPlan[index]) {
                            newPlan[index] = { competencyType: '', action: '', expectedOutcome: e.target.value }
                          } else {
                            newPlan[index].expectedOutcome = e.target.value
                          }
                          setDevelopmentPlan(newPlan)
                        }}
                        disabled={!canEditFinal}
                        placeholder={t.review.developmentPlan.expectedResultsPlaceholder}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Section */}
        {activeSection === 'summary' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{t.review.summary.title}</h2>
                <p className="text-gray-600">{t.review.summary.description}</p>
              </div>
            </div>
            
            <textarea
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={12}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              disabled={!canEditSelfEvaluation && !canEditSupervisorEvaluation && !canEditFinal}
              placeholder={t.review.summary.placeholder}
            />
          </div>
        )}
      </main>
    </div>
  )
}