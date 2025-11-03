import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';

export default function AdminAuth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      // Verify admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .eq('role', 'admin')
        .single();

      if (!roleData) {
        await supabase.auth.signOut();
        throw new Error('Access denied. Admin privileges required.');
      }

      toast.success('Welcome, Admin!');
      navigate('/platform/admin');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-gray-900 border-2 p-8" style={{ borderColor: 'hsl(var(--neon-red))' }}>
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 mx-auto mb-4" style={{ color: 'hsl(var(--neon-red))' }} />
          <h1 className="text-3xl font-bold mb-2 text-white">Admin Portal</h1>
          <p className="text-gray-400">Sign in with admin credentials</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="bg-gray-800 border-gray-700"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="bg-gray-800 border-gray-700"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full"
            style={{ backgroundColor: 'hsl(var(--neon-red))', color: 'white' }}
          >
            {loading ? 'Loading...' : 'Sign In as Admin'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Admin access only
        </div>
      </Card>
    </div>
  );
}

