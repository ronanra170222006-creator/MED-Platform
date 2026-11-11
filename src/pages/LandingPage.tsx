import React from 'react';
import {
  ArrowRight,
  Award,
  Crown,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { BrandLogo } from '../components/Brand';

export function LandingPage({ navigate }: { navigate: (path: string) => void }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-med-forest via-med-deep to-med-emerald overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-med-light blur-3xl" />
          <div className="absolute bottom-16 right-10 w-56 h-56 rounded-full bg-emerald-300 blur-3xl" />
        </div>

        <div className="relative max-w-md mx-auto px-5 pt-12 pb-16">
          <div className="flex justify-center mb-8">
            <BrandLogo size="lg" />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-white mb-3 tracking-tight">
              Achetez <span className="text-med-light">•</span> Vendez{' '}
              <span className="text-med-light">•</span> Gagnez
            </h1>
            <p className="text-white/85 text-sm leading-relaxed max-w-xs mx-auto">
              La plateforme d’investissement premium qui vous accompagne vers le succès.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/auth?mode=signup')}
              className="w-full bg-white text-med-forest font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Commencer maintenant</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/auth?mode=login')}
              className="w-full bg-white/15 backdrop-blur-sm border border-white/25 text-white font-semibold py-4 rounded-2xl hover:bg-white/25 transition-all duration-200 cursor-pointer"
            >
              J’ai déjà un compte
            </button>
          </div>
        </div>
      </div>

      {/* Why Choose MED */}
      <div className="max-w-md mx-auto px-5 py-12">
        <h2 className="text-xl font-bold text-center text-gray-900 mb-8">
          Pourquoi choisir MED ?
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <FeatureCard
            icon={Wallet}
            title="Dépôts sécurisés"
            description="Dépôts rapides via Airtel Money"
            color="from-med-deep to-med-emerald"
          />
          <FeatureCard
            icon={Crown}
            title="15 niveaux VIP"
            description="Des plans pour tous les budgets"
            color="from-emerald-600 to-teal-500"
          />
          <FeatureCard
            icon={Users}
            title="Parrainage"
            description="Gagnez des commissions"
            color="from-green-600 to-emerald-500"
          />
          <FeatureCard
            icon={ShieldCheck}
            title="Sécurité maximale"
            description="Vos données sont protégées"
            color="from-med-forest to-med-deep"
          />
        </div>
      </div>

      {/* Stats Strip */}
      <div className="bg-gradient-to-r from-med-soft to-emerald-50 border-y border-med-light/40">
        <div className="max-w-md mx-auto px-5 py-10">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-extrabold text-med-deep tabular-nums">15</p>
              <p className="text-xs text-gray-600 mt-1">Niveaux VIP</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-med-emerald tabular-nums">2</p>
              <p className="text-xs text-gray-600 mt-1">Réseaux Mobile Money</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-med-forest tabular-nums">100%</p>
              <p className="text-xs text-gray-600 mt-1">Sécurisé</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="max-w-md mx-auto px-5 py-12">
        <div className="card p-8 text-center bg-gradient-to-br from-med-forest to-med-deep border-0 text-white">
          <Award className="w-12 h-12 text-med-light mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Prêt à investir ?</h3>
          <p className="text-white/80 text-sm mb-6">
            Rejoignez des milliers de membres qui génèrent des revenus quotidiens avec MED.
          </p>
          <button
            onClick={() => navigate('/auth?mode=signup')}
            className="w-full bg-med-light text-med-forest font-bold py-3.5 rounded-xl hover:brightness-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <TrendingUp className="w-5 h-5" />
            <span>Créer mon compte</span>
          </button>
        </div>

        <footer className="mt-10 text-center text-xs text-gray-400">
          <p>© {new Date().getFullYear()} MED Investment Platform. Tous droits réservés.</p>
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      <div
        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-sm`}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className="font-bold text-gray-900 text-sm mb-1">{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}
