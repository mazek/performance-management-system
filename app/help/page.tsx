"use client"

import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { 
  ArrowLeft,
  HelpCircle,
  Book,
  MessageCircle,
  Mail,
  Phone,
  FileText,
  Users,
  Target,
  Star,
  TrendingUp,
  Calendar,
  ChevronRight,
  LogOut
} from 'lucide-react'

export default function HelpPage() {
  const router = useRouter()
  const { t } = useLanguage()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const faqItems = [
    {
      question: "Jak rozpocząć proces samooceny?",
      answer: "Przejdź do panelu głównego i kliknij na aktywną ocenę w sekcji 'Moje oceny'. System automatycznie przeprowadzi Cię przez proces samooceny.",
      icon: FileText
    },
    {
      question: "Jakie są etapy procesu oceny?",
      answer: "Proces oceny składa się z 4 etapów: 1) Samoocena pracownika, 2) Ocena przełożonego, 3) Spotkanie końcowe i ustalenie planu rozwoju, 4) Zakończenie procesu.",
      icon: Calendar
    },
    {
      question: "Jak wypełnić cele osobiste?",
      answer: "W sekcji 'Cele osobiste' oceń każdy cel na skali 1-5, gdzie 1 oznacza 'Poniżej oczekiwań', a 5 'Wybitny'. Możesz dodać komentarze do każdej oceny.",
      icon: Target
    },
    {
      question: "Co to są kompetencje kluczowe?",
      answer: "To 5 głównych kompetencji ocenianych w firmie: Dostarczanie, Rozwój, Innowacyjność, Odwaga i Odporność. Każda jest oceniana na skali 1-5.",
      icon: Star
    },
    {
      question: "Jak utworzyć plan rozwoju?",
      answer: "Plan rozwoju tworzy się podczas spotkania końcowego. Wybierz 2 kompetencje do rozwoju i określ konkretne działania oraz oczekiwane rezultaty.",
      icon: TrendingUp
    },
    {
      question: "Kto może zobaczyć moje oceny?",
      answer: "Twoje oceny mogą zobaczyć: Ty, Twój bezpośredni przełożony oraz dział HR. Wszystkie dane są poufne i chronione.",
      icon: Users
    }
  ]

  const guides = [
    {
      title: "Poradnik dla pracownika",
      description: "Jak przygotować się do oceny i wypełnić samoocenę",
      icon: Book,
      color: "bg-blue-100 text-blue-600"
    },
    {
      title: "Poradnik dla przełożonego",
      description: "Jak przeprowadzić ocenę zespołu i udzielić konstruktywnej informacji zwrotnej",
      icon: Users,
      color: "bg-purple-100 text-purple-600"
    },
    {
      title: "Plan rozwoju - najlepsze praktyki",
      description: "Jak stworzyć skuteczny plan rozwoju kompetencji",
      icon: TrendingUp,
      color: "bg-green-100 text-green-600"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Powrót</span>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Centrum pomocy</h1>
                  <p className="text-sm text-gray-600">Znajdź odpowiedzi na swoje pytania</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <LanguageSwitcher />
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Help Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Jak możemy Ci pomóc?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {guides.map((guide, index) => {
              const GuideIcon = guide.icon
              return (
                <button
                  key={index}
                  className="text-left p-6 border border-gray-200 rounded-xl hover:shadow-md transition-all group"
                  onClick={() => {}}
                >
                  <div className={`w-12 h-12 ${guide.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <GuideIcon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{guide.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{guide.description}</p>
                  <div className="flex items-center text-blue-600 text-sm font-medium">
                    <span>Przeczytaj więcej</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Najczęściej zadawane pytania</h2>
          
          <div className="space-y-4">
            {faqItems.map((item, index) => {
              const FAQIcon = item.icon
              return (
                <details key={index} className="group">
                  <summary className="flex items-start cursor-pointer p-4 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mr-4">
                      <FAQIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-open:text-blue-600 transition-colors">
                        {item.question}
                      </h3>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform" />
                  </summary>
                  <div className="pl-14 pr-4 pb-4">
                    <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                  </div>
                </details>
              )
            })}
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Skontaktuj się z nami</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                <p className="text-sm text-gray-600 mb-2">Napisz do zespołu HR</p>
                <a href="mailto:hr@company.com" className="text-blue-600 text-sm font-medium hover:underline">
                  hr@company.com
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Telefon</h3>
                <p className="text-sm text-gray-600 mb-2">Pon-Pt, 9:00-17:00</p>
                <a href="tel:+48123456789" className="text-blue-600 text-sm font-medium hover:underline">
                  +48 123 456 789
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Chat</h3>
                <p className="text-sm text-gray-600 mb-2">Porozmawiaj z konsultantem</p>
                <button className="text-blue-600 text-sm font-medium hover:underline">
                  Rozpocznij czat
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-100">
          <div className="flex items-start space-x-4">
            <Book className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Dokumentacja systemu</h3>
              <p className="text-sm text-gray-600 mb-3">
                Szczegółowa dokumentacja systemu oceny pracowniczej, instrukcje krok po kroku oraz materiały szkoleniowe.
              </p>
              <button className="text-blue-600 text-sm font-medium hover:underline">
                Pobierz dokumentację (PDF)
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}