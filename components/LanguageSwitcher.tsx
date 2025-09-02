"use client"

import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="relative group">
      <button
        className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        onClick={() => setLanguage(language === 'pl' ? 'en' : 'pl')}
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{language === 'pl' ? 'Polski' : 'English'}</span>
        <span className="sm:hidden">{language.toUpperCase()}</span>
      </button>
      
      <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 hidden group-hover:block z-50">
        <button
          onClick={() => setLanguage('pl')}
          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-t-lg ${
            language === 'pl' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
          }`}
        >
          🇵🇱 Polski
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-b-lg ${
            language === 'en' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
          }`}
        >
          🇬🇧 English
        </button>
      </div>
    </div>
  );
}