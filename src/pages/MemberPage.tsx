import React, { useState } from 'react';
import {
  Check,
  Copy,
  Crown,
  LogOut,
  Wallet,
} from 'lucide-react';
import { PageHeader } from '../components/Brand';
import { showToast } from '../components/Toast';
import { VIP_PLANS } from '../data/seed';
import { usePlatform } from '../store/alphaStore';
import { formatAR, formatDateTime } from '../utils/format';

type MemberTab = 'profile' | 'vip' | 'transactions';

export function MemberPage({ navigate }: { navigate: (path: string) => void }) {
  const {
    profile,
    investments,
    transactions,
    logout,
  } = usePlatform();

  const [tab, setTab] = useState<MemberTab>('profile');
  const [copied, setCopied] = useState(false);

  const availableBalance = (profile?.balance ?? 0) - (profile?.reserved_balance ?? 0);
  const userInvestments = investments.filter((i) => i.user_id === profile?.user_id);
  const userTransactions = transactions.filter(
    (t) => (t.user_id || t.userId) === profile?.user_id
  );

  const copyCode = () => {
    if (!profile?.referral_code) return;
    navigator.clipboard?.writeText(profile.referral_code);
    setCopied(true);
    showToast('Code copié !', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div>
      <PageHeader title="Mon Profil" onBack={() => navigate('/home')} />

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Profile Header Card */}
        <div className="card p-5 mb-5 bg-gradient-to-br from-med-forest via-med-deep to-med-emerald border-0 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center text-xl font-extrabold text-med-light">
              {(profile?.full_name ?? 'M').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold truncate">
                {profile?.full_name ?? 'Membre'}
              </h2>
              <p className="text-xs text-white/75">{profile?.phone}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <code className="text-xs font-mono text-med-light bg-white/15 px-2 py-0.5 rounded">
                  {profile?.referral_code}
                </code>
                <button
                  onClick={copyCode}
                  className="text-white/75 hover:text-white cursor-pointer"
                  aria-label="Copier"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/15">
            <div>
              <p className="text-[11px] text-white/70">Solde disponible</p>
              <p className="text-lg font-extrabold tabular-nums">
                {formatAR(availableBalance)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-white/70">Gains totaux</p>
              <p className="text-lg font-extrabold text-med-light tabular-nums">
                +{formatAR(profile?.total_earned ?? 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-med-soft rounded-xl mb-5">
          {(
            [
              { id: 'profile', label: 'Aperçu' },
              { id: 'vip', label: `Mes VIP (${userInvestments.length})` },
              { id: 'transactions', label: 'Historique' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                tab === t.id
                  ? 'bg-white text-med-deep shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <div className="space-y-3 mb-8">
            <div className="card p-4 space-y-2.5 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Nom complet</span>
                <span className="font-semibold text-gray-900">{profile?.full_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Téléphone</span>
                <span className="font-semibold text-gray-900">{profile?.phone}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Membre depuis</span>
                <span className="font-semibold text-gray-900">
                  {profile?.created_at ? formatDateTime(profile.created_at) : '-'}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full card p-4 flex items-center gap-3 text-red-600 hover:bg-red-50/50 transition-colors cursor-pointer text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                <LogOut className="w-4 h-4 text-red-600" />
              </div>
              <span className="text-sm font-bold">Se déconnecter</span>
            </button>
          </div>
        )}

        {tab === 'vip' && (
          <div className="space-y-3 mb-8">
            {userInvestments.length === 0 ? (
              <div className="card p-8 text-center">
                <Crown className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400 mb-4">
                  Aucun portefeuille VIP actif
                </p>
                <button
                  onClick={() => navigate('/plan')}
                  className="btn-primary text-sm"
                >
                  Découvrir les plans
                </button>
              </div>
            ) : (
              userInvestments.map((inv) => {
                const plan = VIP_PLANS.find((p) => p.id === inv.plan_id);
                return (
                  <div key={inv.id} className="card p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">{plan?.name ?? 'VIP'}</p>
                      <p className="text-xs text-gray-500">
                        Capital : {formatAR(inv.amount)} • {plan?.daily_rate}% / jour
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Activé le {formatDateTime(inv.created_at)}
                      </p>
                    </div>
                    <span className="badge badge-approved">ACTIF</span>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === 'transactions' && (
          <div className="space-y-2.5 mb-8">
            {userTransactions.length === 0 ? (
              <div className="card p-8 text-center">
                <Wallet className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Aucune transaction enregistrée</p>
              </div>
            ) : (
              userTransactions.map((tx) => {
                const txAmount =
                  tx.amount ?? (tx.type === 'RETRAIT' ? -tx.montant : tx.montant);
                const txDate = tx.created_at || tx.date;
                const txDesc =
                  tx.description || `${tx.type} ${tx.operateur ?? ''}`.trim();
                return (
                  <div
                    key={tx.id}
                    className="card p-4 flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {txDesc}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {formatDateTime(txDate)}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-extrabold tabular-nums whitespace-nowrap ${
                        txAmount >= 0 ? 'text-med-deep' : 'text-gray-900'
                      }`}
                    >
                      {txAmount >= 0 ? '+' : ''}
                      {formatAR(txAmount)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
