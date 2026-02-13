import React from 'react';
import { 
  BookOpenIcon, 
  PlusCircleIcon, 
  ChartBarIcon, 
  Cog6ToothIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

type ViewType = 'dashboard' | 'create' | 'saved' | 'review';

interface SidebarProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const navItems: { id: ViewType; label: string; icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: ChartBarIcon },
    { id: 'create', label: 'Nuevo Plan', icon: PlusCircleIcon },
    { id: 'review', label: 'Repaso WhatsApp', icon: ChatBubbleLeftRightIcon },
    { id: 'saved', label: 'Mis Planes', icon: BookOpenIcon },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 shadow-xl z-10">
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-8 h-8 bg-gradient-to-tr from-amber-400 to-amber-600 rounded-lg flex items-center justify-center font-bold text-slate-900 text-xl">
          U
        </div>
        <span className="text-xl font-bold tracking-tight">Plan Ultra</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-amber-500 text-slate-900 font-medium shadow-lg shadow-amber-500/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button className="flex items-center space-x-3 text-slate-400 hover:text-white transition-colors w-full px-4 py-2">
          <Cog6ToothIcon className="w-5 h-5" />
          <span>Configuración</span>
        </button>
        <div className="mt-4 text-xs text-slate-500 text-center">
          v1.0.0 | MINED Compliant
        </div>
      </div>
    </aside>
  );
};