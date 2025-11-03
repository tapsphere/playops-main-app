import { useEffect, useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, Palette, Building2, Store } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export const PlatformLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole, loggedIn, logout } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loggedIn) {
      const path = location.pathname;
      let authPath = '/auth';
      
      if (path.startsWith('/platform/admin')) {
        authPath = '/auth/admin';
      } else if (path.startsWith('/platform/creator')) {
        authPath = '/auth/creator';
      } else if (path.startsWith('/platform/brand')) {
        authPath = '/auth/brand';
      }
      
      navigate(`${authPath}?redirect=${location.pathname}`);
      return;
    }

    if (userRole) {
      const path = location.pathname;
      let requiredRole: string | null = null;

      if (path.startsWith('/platform/admin')) {
        requiredRole = 'admin';
      } else if (path.startsWith('/platform/creator')) {
        requiredRole = 'creator';
      } else if (path.startsWith('/platform/brand')) {
        requiredRole = 'brand';
      }

      if (requiredRole && userRole !== requiredRole) {
        toast.error('Access Denied', {
          description: `You do not have permission to access this page.`,
        });
        navigate('/lobby');
        return;
      }
    }

    setLoading(false);
  }, [loggedIn, userRole, location.pathname, navigate]);

  const handleSignOut = async () => {
    logout();
    toast.success('Signed out');
    navigate('/auth');
  };

  const isCreator = userRole === 'creator';
  const isBrand = userRole === 'brand';

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-neon-green">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Nav */}
      <header className="border-b border-neon-green/30 bg-gray-900/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--neon-green))' }}>
              {isCreator ? 'Creator Studio' : 'Brand Hub'}
            </h1>
            
            <nav className="flex gap-4">
              {isCreator && (
                <>
                  <Button
                    variant={location.pathname === '/platform/creator' ? 'default' : 'ghost'}
                    onClick={() => navigate('/platform/creator')}
                    className="gap-2"
                  >
                    <Palette className="w-4 h-4" />
                    My Templates
                  </Button>
                </>
              )}
              
              {isBrand && (
                <>
                  <Button
                    variant={location.pathname === '/platform/brand' ? 'default' : 'ghost'}
                    onClick={() => navigate('/platform/brand')}
                    className="gap-2"
                  >
                    <Building2 className="w-4 h-4" />
                    Dashboard
                  </Button>
                  <Button
                    variant={location.pathname === '/platform/marketplace' ? 'default' : 'ghost'}
                    onClick={() => navigate('/platform/marketplace')}
                    className="gap-2"
                  >
                    <Store className="w-4 h-4" />
                    Marketplace
                  </Button>
                </>
              )}
            </nav>
          </div>

          <Button variant="ghost" onClick={handleSignOut} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};
