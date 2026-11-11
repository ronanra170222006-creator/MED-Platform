import React from 'react';
import { ArrowLeft, Check, Shield, X } from 'lucide-react';
import { StatusBadge } from '../components/Brand';
import { showToast } from '../components/Toast';
import { usePlatform } from '../store/alphaStore';
import { formatAR, formatDateTime } from '../utils/format';

export function AdminPage({ navigate }: { navigate: (path: string) => void }) {
  const {
    deposits,
    withdrawals,
    approveDeposit,
    rejectDeposit,
    approveWithdrawal,
    rejectWithdrawal,
    logout,
  } = usePlatform();

  const pendingDeposits = deposits.filter((d) => d.status === 'pending');
  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending');

  const exitAdmin = () => {
    logout();
    navigate('/auth?mode=adminLogin');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-gradient-to-r from-med-forest to-med-deep text-white px-4 py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-med-light" />
            <h1 className="font-bold text-base">Administration MED</h1>
          </div>
          <button
            onClick={exitAdmin}
            className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Vue Membre</span>
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4">
            <p className="text-xs text-gray-500">Dépôts Airtel Money en attente</p>
            <p className="text-2xl font-extrabold text-med-deep tabular-nums mt-1">
              {pendingDeposits.length}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500">Retraits en attente</p>
            <p className="text-2xl font-extrabold text-med-emerald tabular-nums mt-1">
              {pendingWithdrawals.length}
            </p>
          </div>
        </div>

        {/* Deposits Management */}
        <section>
          <h2 className="font-bold text-gray-900 mb-3">Demandes de dépôt (Airtel Money)</h2>
          {deposits.length === 0 ? (
            <div className="card p-6 text-center text-sm text-gray-400">
              Aucun dépôt
            </div>
          ) : (
            <div className="space-y-3">
              {deposits.map((d) => (
                <div
                  key={d.id}
                  className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 tabular-nums">
                        {formatAR(d.amount)}
                      </span>
                      <StatusBadge status={d.status} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {d.user_name} • {d.payment_method} ({d.payer_number})
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {formatDateTime(d.created_at)}
                    </p>
                  </div>

                  {d.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          approveDeposit(d.id);
                          showToast('Dépôt approuvé et crédité !', 'success');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-med-deep text-white text-xs font-bold flex items-center gap-1 hover:bg-med-forest cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Valider
                      </button>
                      <button
                        onClick={() => {
                          rejectDeposit(d.id);
                          showToast('Dépôt refusé', 'info');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold flex items-center gap-1 hover:bg-red-700 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" /> Refuser
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Withdrawals Management */}
        <section>
          <h2 className="font-bold text-gray-900 mb-3">
            Demandes de retrait (Airtel Money / Orange Money)
          </h2>
          {withdrawals.length === 0 ? (
            <div className="card p-6 text-center text-sm text-gray-400">
              Aucun retrait
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((w) => (
                <div
                  key={w.id}
                  className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 tabular-nums">
                        {formatAR(w.amount)}
                      </span>
                      <StatusBadge status={w.status} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {w.beneficiary_name} • {w.payment_method} ({w.beneficiary_number}) • Net:{' '}
                      {formatAR(w.net_amount)}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {formatDateTime(w.created_at)}
                    </p>
                  </div>

                  {w.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          approveWithdrawal(w.id);
                          showToast('Retrait approuvé !', 'success');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-med-deep text-white text-xs font-bold flex items-center gap-1 hover:bg-med-forest cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Approuver
                      </button>
                      <button
                        onClick={() => {
                          rejectWithdrawal(w.id);
                          showToast('Retrait refusé (solde libéré)', 'info');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold flex items-center gap-1 hover:bg-red-700 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" /> Refuser
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
