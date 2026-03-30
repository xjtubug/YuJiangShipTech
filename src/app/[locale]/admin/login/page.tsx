'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { Ship, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) || 'en';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          locale === 'zh'
            ? '邮箱或密码错误'
            : locale === 'ja'
            ? 'メールアドレスまたはパスワードが正しくありません'
            : 'Invalid email or password'
        );
      } else {
        router.push(`/${locale}/admin`);
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 px-4">
      <div className="w-full max-w-md">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary-500 rounded-2xl mb-4 shadow-lg">
            <Ship className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">禹疆船舶</h1>
          <p className="text-primary-300 text-sm mt-1">YuJiang ShipTech Admin</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-1">
            {locale === 'zh' ? '管理员登录' : locale === 'ja' ? '管理者ログイン' : 'Admin Login'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {locale === 'zh'
              ? '请输入您的账号信息'
              : locale === 'ja'
              ? '認証情報を入力してください'
              : 'Enter your credentials to continue'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                {locale === 'zh' ? '邮箱地址' : 'Email'}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                placeholder="admin@yujiangshiptech.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                {locale === 'zh' ? '密码' : 'Password'}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading
                ? locale === 'zh'
                  ? '登录中...'
                  : 'Signing in...'
                : locale === 'zh'
                ? '登录'
                : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-primary-400 text-xs mt-6">
          © {new Date().getFullYear()} YuJiang ShipTech. All rights reserved.
        </p>
      </div>
    </div>
  );
}
