import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Flame, Mail, Phone, Lock, KeyRound, Eye, EyeOff, MessageSquare, QrCode, Github, Loader2, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { loginWithPassword, loginWithCode, sendVerifyCode, loginWithSocial, type SocialProvider } from '@/services/authService';
import { toast } from 'sonner';

export const Route = createFileRoute('/auth')({
  head: () => ({
    meta: [
      { title: '登录 — 火花 Brand Spark' },
      { name: 'description', content: '登录或注册火花账号' },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuthStore();
  const [tab, setTab] = useState<'password' | 'code'>('password');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  // password form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // code form
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (isAuthenticated) navigate({ to: '/' });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handlePasswordLogin = async () => {
    setLoading(true);
    const res = await loginWithPassword(username, password);
    setLoading(false);
    if (res.success && res.user && res.token) {
      login(res.user, res.token);
      toast.success('登录成功，欢迎回来！');
      navigate({ to: '/' });
    } else {
      toast.error(res.error || '登录失败');
    }
  };

  const handleCodeLogin = async () => {
    setLoading(true);
    const res = await loginWithCode(phone, code);
    setLoading(false);
    if (res.success && res.user && res.token) {
      login(res.user, res.token);
      toast.success('登录成功！');
      navigate({ to: '/' });
    } else {
      toast.error(res.error || '登录失败');
    }
  };

  const handleSendCode = async () => {
    const res = await sendVerifyCode(phone);
    if (res.success) {
      setCountdown(60);
      toast.success('验证码已发送');
    } else {
      toast.error(res.error || '发送失败');
    }
  };

  const handleSocial = async (provider: SocialProvider) => {
    setLoading(true);
    const res = await loginWithSocial(provider);
    setLoading(false);
    if (res.success && res.user && res.token) {
      login(res.user, res.token);
      toast.success(`${provider} 登录成功`);
      navigate({ to: '/' });
    }
  };

  const socialProviders: { id: SocialProvider; icon: React.ReactNode; label: string }[] = [
    { id: 'wechat', icon: <MessageSquare size={20} />, label: '微信' },
    { id: 'qrcode', icon: <QrCode size={20} />, label: '扫码' },
    { id: 'github', icon: <Github size={20} />, label: 'GitHub' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4"
      style={{ background: 'linear-gradient(135deg, oklch(0.985 0.002 90), oklch(0.95 0.04 70 / 30%))' }}>
      {/* Card */}
      <div className="w-full max-w-[420px] rounded-2xl bg-card shadow-lg border border-border p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl spark-gradient flex items-center justify-center mb-4 spark-shadow">
            <Flame className="text-primary-foreground" size={28} />
          </div>
          <h1 className="text-xl font-bold text-foreground">欢迎来到火花</h1>
          <p className="text-sm text-muted-foreground mt-1">登录以解锁你的 AI 内容助手</p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-muted p-1 mb-6">
          <button
            onClick={() => setTab('password')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === 'password'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            密码登录
          </button>
          <button
            onClick={() => setTab('code')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === 'code'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            验证码登录
          </button>
        </div>

        {/* Password form */}
        {tab === 'password' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                className="spark-input pl-9"
                placeholder="手机号 / 邮箱"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                className="spark-input pl-9 pr-10"
                type={showPwd ? 'text' : 'password'}
                placeholder="密码"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePasswordLogin()}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button
              onClick={handlePasswordLogin}
              disabled={loading}
              className="spark-btn-primary w-full h-11 text-base"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <>登录 <ArrowRight size={16} /></>}
            </button>
          </div>
        )}

        {/* Code form */}
        {tab === 'code' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                className="spark-input pl-9"
                placeholder="手机号"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="spark-input pl-9"
                  placeholder="验证码"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCodeLogin()}
                />
              </div>
              <button
                onClick={handleSendCode}
                disabled={countdown > 0}
                className="spark-btn-secondary whitespace-nowrap px-4 text-xs"
              >
                {countdown > 0 ? `${countdown}s` : '发送验证码'}
              </button>
            </div>
            <button
              onClick={handleCodeLogin}
              disabled={loading}
              className="spark-btn-primary w-full h-11 text-base"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <>登录 <ArrowRight size={16} /></>}
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">其他方式登录</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Social */}
        <div className="flex justify-center gap-4">
          {socialProviders.map(sp => (
            <button
              key={sp.id}
              onClick={() => handleSocial(sp.id)}
              className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all hover:shadow-md"
              title={sp.label}
            >
              {sp.icon}
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          登录即表示同意 <span className="text-primary cursor-pointer hover:underline">服务条款</span> 和 <span className="text-primary cursor-pointer hover:underline">隐私政策</span>
        </p>
      </div>
    </div>
  );
}
