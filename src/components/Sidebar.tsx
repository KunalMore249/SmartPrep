import React from 'react';
import {
  Calendar,
  BookOpen,
  BrainCircuit,
  BarChart3,
  Settings,
  PlusCircle,
  GraduationCap,
  RefreshCw
} from 'lucide-react';
import { useAuth } from './auth/AuthProvider';

interface SidebarProps {
  onNavigate: (view: 'dashboard' | 'generator' | 'schedule' | 'tests' | 'performance' | 'revision') => void;
  currentView: string;
}

const Sidebar = ({ onNavigate, currentView }: SidebarProps) => {
  const { signOut } = useAuth();

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-8">
        <BrainCircuit className="w-8 h-8 text-indigo-600" />
        <h1 className="text-xl font-bold text-gray-900">SmartPrep</h1>
      </div>
      
      <nav className="space-y-1">
        <NavItem
          icon={<Calendar />}
          label="Dashboard"
          active={currentView === 'dashboard'}
          onClick={() => onNavigate('dashboard')}
        />
        <NavItem
          icon={<PlusCircle />}
          label="Generate Schedule"
          active={currentView === 'generator'}
          onClick={() => onNavigate('generator')}
        />
        <NavItem
          icon={<BookOpen />}
          label="View Schedule"
          active={currentView === 'schedule'}
          onClick={() => onNavigate('schedule')}
        />
        <NavItem
          icon={<GraduationCap />}
          label="Mock Tests"
          active={currentView === 'tests'}
          onClick={() => onNavigate('tests')}
        />
        <NavItem
          icon={<BarChart3 />}
          label="Performance"
          active={currentView === 'performance'}
          onClick={() => onNavigate('performance')}
        />
        <NavItem
          icon={<RefreshCw />}
          label="Revision"
          active={currentView === 'revision'}
          onClick={() => onNavigate('revision')}
        />
        <NavItem
          icon={<Settings />}
          label="Settings"
          active={false}
          onClick={() => {}}
        />
      </nav>

      <div className="mt-auto pt-8">
        <button
          onClick={() => signOut()}
          className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const NavItem = ({ icon, label, active = false, onClick }: NavItemProps) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors w-full ${
        active
          ? 'bg-indigo-50 text-indigo-600'
          : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
};

export default Sidebar;