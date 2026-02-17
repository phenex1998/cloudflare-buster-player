import React from 'react';
import { useIptv } from '@/contexts/IptvContext';
import { Search, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AppHeaderProps {
  title: string;
  showSearch?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({ title, showSearch = true }) => {
  const { logout } = useIptv();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <h1 className="text-lg font-bold text-foreground truncate">{title}</h1>
        <div className="flex items-center gap-2">
          {showSearch && (
            <button
              onClick={() => navigate('/search')}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={logout}
            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
