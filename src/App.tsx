import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useAuth } from './components/auth/AuthProvider';
import { Calendar, BookOpen, BrainCircuit } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import LoginForm from './components/auth/LoginForm';
import SignUpForm from './components/auth/SignUpForm';
import ScheduleGenerator from './components/schedule/ScheduleGenerator';
import ScheduleView from './components/schedule/ScheduleView';
import MockTestGenerator from './components/tests/MockTestGenerator';
import TestInterface from './components/tests/TestInterface';
import PerformanceDashboard from './components/performance/PerformanceDashboard';
import RevisionScheduler from './components/revision/RevisionScheduler';

function App() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = React.useState<
    'dashboard' | 'generator' | 'schedule' | 'tests' | 'performance' | 'revision'
  >('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      {!user ? (
        <Routes>
          <Route path="/" element={<LoginForm />} />
          <Route path="/signup" element={<SignUpForm />} />
        </Routes>
      ) : (
        <div className="min-h-screen bg-gray-50 flex">
          <Sidebar onNavigate={setCurrentView} currentView={currentView} />
          <main className="flex-1 p-8">
            {currentView === 'dashboard' && <Dashboard />}
            {currentView === 'generator' && <ScheduleGenerator />}
            {currentView === 'schedule' && <ScheduleView />}
            {currentView === 'tests' && <TestInterface />}
            {currentView === 'performance' && <PerformanceDashboard />}
            {currentView === 'revision' && <RevisionScheduler />}
          </main>
        </div>
      )}
    </Router>
  );
}

export default App;