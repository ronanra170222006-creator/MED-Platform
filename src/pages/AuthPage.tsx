import React, { useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock, Phone, User, Users } from 'lucide-react';
import { BrandLogo } from '../components/Brand';
import { showToast } from '../components/Toast';
import { usePlatform } from '../store/alphaStore';

type AuthMode = 'login' | 'signup' | 'adminLogin';

export function AuthPage({
  navigate,
  initialMode = 'login',
  initialRef = '',
}: {
  navigate: (path: string) => void;
  initialMode?: AuthMode;
  initialRef?: string;
}) {
  const { loginWithPhone, signup, loginAdmin } = usePlatform();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    referral_code: initialRef,
  });

  useEffect(() => {
    setMode(initialMode);
    setErrorMessage(null);
  }, [initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      if (mode === 'signup') {
        if (form.password !== form.confirmPassword) {
          const msg = 'Les mots de passe ne correspondent pas';
          setErrorMessage(msg);
          showToast(msg, 'error');
          return;
        }
        const res = await signup({
          full_name: form.full_name,
          phone: form.phone,
          password: form.password,
          referral_code: form.referral_code,
        });
        if (!res.ok) {
          const msg = res.error || 'Erreur lors de la création du compte';
          setErrorMessage(msg);
          showToast(msg, 'error');
          return;
        }
        showToast('Compte créé avec succès !', 'success');
        navigate('/home');
      } else if (mode === 'login') {
        const res = await loginWithPhone(form.phone, form.password);
        if (!res.ok) {
          const msg = res.error || 'Identifiants incorrects';
          setErrorMessage(msg);
          showToast(msg, 'error');
          return;
        }
        showToast('Connexion réussie !', 'success');
        navigate('/home');
      } else {
        const res = await loginAdmin(form.email, form.password);
        if (!res.ok) {
          const msg = res.error || 'Identifiants administrateur invalides';
          setErrorMessage(msg);
          showToast(msg, 'error');
          return;
        }
        showToast('Connexion administrateur réussie !', 'success');
        if (!window.location.hash.startsWith('#/admin')) {
          navigate('/admin');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<AuthMode, string> = {
    login: 'Connexion',
    signup: 'Créer un compte',
    adminLogin: 'Espace Administrateur',
  };

  const subtitles: Record<AuthMode, string> = {
    login: 'Accédez à votre espace membre',
    signup: 'Rejoignez la communauté MED',
    adminLogin: 'Connexion sécurisée administrateur',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-med-forest via-med-deep to-med-emerald flex flex-col">
      <div className="pt-6 px-4 max-w-md mx-auto w-full">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/85 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Retour</span>
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <BrandLogo size="lg" />
            </div>
            <h1 className="text-2xl font-bold text-white">{titles[mode]}</h1>
            <p className="text-white/75 text-sm mt-2">{subtitles[mode]}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-6 animate-slide-up">
            {mode !== 'adminLogin' && (
              <div className="grid grid-cols-2 gap-1 p-1 bg-med-soft rounded-xl mb-5">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    mode === 'login'
                      ? 'bg-white text-med-deep shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Connexion
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-white text-med-deep shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Inscription
                </button>
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Nom complet
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      className="input-field pl-10"
                      placeholder="Votre nom complet"
                    />
                  </div>
                </div>
              )}

              {mode === 'adminLogin' ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email administrateur
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input-field"
                    placeholder="••••••••@•••••.•••"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Numéro de téléphone
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="input-field pl-10"
                      placeholder="033 00 000 00"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="input-field pl-10 pr-11"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Confirmer le mot de passe
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={form.confirmPassword}
                      onChange={(e) =>
                        setForm({ ...form, confirmPassword: e.target.value })
                      }
                      className="input-field"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Code de parrainage (optionnel)
                    </label>
                    <div className="relative">
                      <Users className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={form.referral_code}
                        onChange={(e) =>
                          setForm({ ...form, referral_code: e.target.value.toUpperCase() })
                        }
                        className="input-field pl-10 uppercase font-mono"
                        placeholder="Code d'invitation"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-sm tracking-wide"
              >
                {loading
                  ? 'Patientez...'
                  : mode === 'login'
                    ? 'SE CONNECTER'
                    : mode === 'signup'
                      ? 'CRÉER UN COMPTE'
                      : 'CONNEXION ADMIN'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
