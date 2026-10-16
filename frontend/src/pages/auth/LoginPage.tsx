import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Navigate } from 'react-router-dom';
import { Home, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  if (isAuthenticated && user) {
    const paths: Record<string, string> = { ADMIN: '/admin/dashboard', RESIDENT: '/resident/dashboard', SECURITY: '/security/dashboard' };
    return <Navigate to={paths[user.role] || '/login'} replace />;
  }

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Login failed. Check your credentials.';
      toast.error(msg);
    }
  };

  const demoAccounts = [
    { role: 'Admin', email: 'admin@nivasa.com', password: 'Admin@123', color: 'bg-purple-100 text-purple-700' },
    { role: 'Resident', email: 'resident@nivasa.com', password: 'Resident@123', color: 'bg-emerald-100 text-emerald-700' },
    { role: 'Security', email: 'security@nivasa.com', password: 'Security@123', color: 'bg-blue-100 text-blue-700' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 rounded-2xl mb-4 backdrop-blur-sm">
            <Home className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Nivasa</h1>
          <p className="text-brand-300 text-sm mt-1">Smart Society Management</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Sign in to your account</h2>
          <p className="text-sm text-gray-500 mb-6">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="input"
                {...register('email')}
              />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="input pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-2.5"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
              ) : 'Sign in'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-3 text-center">DEMO ACCOUNTS (click to autofill)</p>
            <div className="space-y-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => {
                    const form = document.getElementById('email') as HTMLInputElement;
                    const pass = document.getElementById('password') as HTMLInputElement;
                    if (form) form.value = acc.email;
                    if (pass) pass.value = acc.password;
                    // Trigger react-hook-form
                    onSubmit({ email: acc.email, password: acc.password });
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left"
                >
                  <div>
                    <span className={`badge ${acc.color} mr-2`}>{acc.role}</span>
                    <span className="text-xs text-gray-600">{acc.email}</span>
                  </div>
                  <span className="text-xs text-gray-400">Click to login</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-brand-400 text-xs mt-6">
          Nivasa Residency Management System v1.0
        </p>
      </div>
    </div>
  );
}
