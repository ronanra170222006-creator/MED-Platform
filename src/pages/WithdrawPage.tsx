import React, { useState } from 'react';
import { PageHeader, StatusBadge } from '../components/Brand';
import { showToast } from '../components/Toast';
import { WITHDRAWAL_METHODS } from '../data/seed';
import { usePlatform } from '../store/alphaStore';
import { formatAR, formatDateTime } from '../utils/format';

const MIN_WITHDRAWAL = 3000;
const FEE_PERCENT = 3;

export function WithdrawPage({ navigate }: { navigate: (path: string) => void }) {
  const { profile, withdrawals, submitWithdrawal } = usePlatform();
  const userWithdrawals = withdrawals.filter((w) => w.user_id === profile?.user_id);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(WITHDRAWAL_METHODS[0].name);
  const [beneficiaryNumber, setBeneficiaryNumber] = useState(profile?.phone ?? '');
  const [beneficiaryName, setBeneficiaryName] = useState(profile?.full_name ?? '');

  const availableBalance = (profile?.balance ?? 0) - (profile?.reserved_balance ?? 0);
  const parsedAmount = parseFloat(amount) || 0;
  const fee = Math.round((parsedAmount * FEE_PERCENT) / 100);
  const netAmount = Math.max(0, parsedAmount - fee);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('Veuillez saisir un montant valide', 'error');
      return;
    }
    if (parsedAmount < MIN_WITHDRAWAL) {
      showToast(`Le montant minimum de retrait est de ${formatAR(MIN_WITHDRAWAL)}.`, 'error');
      return;
    }
    if (parsedAmount > availableBalance) {
      showToast('Solde disponible insuffisant', 'error');
      return;
    }

    const res = await submitWithdrawal({
      amount: parsedAmount,
      payment_method: paymentMethod,
      beneficiary_number: beneficiaryNumber.trim(),
      beneficiary_name: beneficiaryName.trim(),
    });

    if (!res.ok) {
      showToast(res.error || 'Erreur lors de la demande', 'error');
      return;
    }

    showToast('Demande de retrait soumise ! Le montant a été réservé.', 'success');
    setAmount('');
  };

  return (
    <div>
      <PageHeader title="Retrait" onBack={() => navigate('/home')} />

      <div className="max-w-md mx-auto px-4 py-6">
        <div className="card p-5 mb-6 bg-gradient-to-br from-med-forest via-med-deep to-med-emerald border-0 text-white">
          <p className="text-white/75 text-xs">Solde disponible</p>
          <p className="text-3xl font-extrabold tabular-nums mt-1">
            {formatAR(availableBalance)}
          </p>
          {(profile?.reserved_balance ?? 0) > 0 && (
            <p className="text-xs text-med-light mt-2 tabular-nums">
              Montant réservé en attente : {formatAR(profile?.reserved_balance ?? 0)}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="card p-5 space-y-4 mb-6">
          {/* Withdrawal Method Cards (Airtel Money & Orange Money only) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Réseau de réception
            </label>
            <div className="grid grid-cols-2 gap-3">
              {WITHDRAWAL_METHODS.map((method) => {
                const active = paymentMethod === method.name;
                return (
                  <button
                    type="button"
                    key={method.id}
                    onClick={() => setPaymentMethod(method.name)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      active
                        ? 'border-med-deep bg-med-soft ring-2 ring-med-emerald/25'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 mx-auto mb-1.5 rounded-lg bg-gradient-to-br ${method.color} flex items-center justify-center text-white font-bold text-xs`}
                    >
                      {method.operator === 'Airtel Money' ? 'AM' : 'OM'}
                    </div>
                    <span className="text-xs font-bold text-gray-900 block">
                      {method.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Montant à retirer (min. {formatAR(MIN_WITHDRAWAL)})
            </label>
            <input
              type="number"
              required
              min={MIN_WITHDRAWAL}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field font-semibold tabular-nums"
              placeholder="Ex: 25000"
            />
          </div>

          {parsedAmount > 0 && (
            <div className="rounded-xl bg-med-soft border border-med-light/50 p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Réseau sélectionné</span>
                <span className="font-semibold text-gray-900">{paymentMethod}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Frais de traitement ({FEE_PERCENT}%)</span>
                <span className="tabular-nums">-{formatAR(fee)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-sm pt-1.5 border-t border-med-light/50">
                <span>Montant net à recevoir</span>
                <span className="text-med-deep tabular-nums">{formatAR(netAmount)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Numéro {paymentMethod} bénéficiaire
            </label>
            <input
              type="tel"
              required
              value={beneficiaryNumber}
              onChange={(e) => setBeneficiaryNumber(e.target.value)}
              className="input-field"
              placeholder={paymentMethod === 'Airtel Money' ? '033 12 345 67' : '032 12 345 67'}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Nom du bénéficiaire
            </label>
            <input
              type="text"
              required
              value={beneficiaryName}
              onChange={(e) => setBeneficiaryName(e.target.value)}
              className="input-field"
              placeholder="Nom complet"
            />
          </div>

          <button type="submit" className="btn-primary w-full">
            Confirmer le retrait ({paymentMethod})
          </button>
        </form>

        <h3 className="font-bold text-gray-900 mb-3">Historique des retraits</h3>
        {userWithdrawals.length === 0 ? (
          <div className="card p-6 text-center text-sm text-gray-400">
            Aucun retrait effectué pour le moment
          </div>
        ) : (
          <div className="space-y-2.5 mb-8">
            {userWithdrawals.map((w) => (
              <div key={w.id} className="card p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900 text-sm tabular-nums">
                    {formatAR(w.amount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {w.payment_method} • Net : {formatAR(w.net_amount)}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {formatDateTime(w.created_at)}
                  </p>
                </div>
                <StatusBadge status={w.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
