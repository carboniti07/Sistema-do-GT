import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCog,
  Building2,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';

const menuItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/jovens', label: 'Jovens', icon: Users },
  { path: '/admin/usuarios', label: 'Usuarios', icon: UserCog },
  { path: '/admin/congregacoes', label: 'Congregacoes', icon: Building2 },
  { path: '/admin/relatorios', label: 'Relatorios', icon: BarChart3 },
  { path: '/admin/configuracoes', label: 'Configuracoes', icon: Settings },
];

export default function Sidebar({ onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('umadrur_auth');
    navigate('/admin/login');
  };

  const handleNav = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const baseItem =
    'w-full box-border relative flex items-center gap-3 px-4 py-2.5 min-h-[44px] text-sm font-medium transition-colors';

  return (
    <div className="w-64 bg-card h-full flex flex-col border-r border-border">
      <div className="p-4 border-b border-border">
        <h2 className="font-heading font-bold text-primary text-base tracking-tight leading-none">
          UMADRUR
        </h2>
        <p className="text-xs text-muted-foreground mt-1 leading-none">
          Painel Administrativo
        </p>
      </div>

      <nav className="flex-1 py-3">
        {menuItems.map((item) => {
          const active = location.pathname === item.path;

          return (
            <button
              key={item.label}
              onClick={() => handleNav(item.path)}
              className={`${baseItem} ${active ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-surface-2'
                }`}
            >
              <span
                className={`absolute left-0 top-0 h-full w-1 ${active ? 'bg-primary' : 'bg-transparent'
                  }`}
                aria-hidden="true"
              />
              <item.icon size={18} />
              <span className="leading-none">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">

        <button
          onClick={handleLogout}
          className={`
      ${baseItem}
      rounded-xl
      text-red-600
      hover:bg-red-50
      hover:text-red-700
      transition-all
    `}
        >
          <LogOut size={18} />
          <span className="leading-none">Sair</span>
        </button>
      </div>
    </div>
  );
}
