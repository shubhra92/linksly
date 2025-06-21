import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { LinkShortener } from './components/LinkShortener';
import { LinksList } from './components/LinksList';
import { Dashboard } from './components/Dashboard';

function App() {
  const [activeTab, setActiveTab] = useState('create');
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  const handleLinkCreated = () => {
    // Auto-switch to links tab after creating a link
    setTimeout(() => setActiveTab('links'), 1500);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'create':
        return <LinkShortener onLinkCreated={handleLinkCreated} />;
      case 'links':
        return <LinksList />;
      case 'dashboard':
        return <Dashboard />;
      default:
        return <LinkShortener onLinkCreated={handleLinkCreated} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {activeTab === 'create' && 'Create Short Links'}
            {activeTab === 'links' && 'Manage Your Links'}
            {activeTab === 'dashboard' && 'Analytics Dashboard'}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {activeTab === 'create' && 'Transform long URLs into short, shareable links with advanced analytics and customization options.'}
            {activeTab === 'links' && 'View and manage all your shortened links in one place with detailed statistics.'}
            {activeTab === 'dashboard' && 'Track your link performance with comprehensive analytics and insights.'}
          </p>
        </div>

        {renderContent()}
      </main>

      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-blue-300 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-300 dark:bg-cyan-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>
    </div>
  );
}

export default App;