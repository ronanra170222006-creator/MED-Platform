import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Megaphone,
  RefreshCw,
  Send,
  Shield,
  Users,
  X,
} from 'lucide-react';
import { StatusBadge } from '../components/Brand';
import { showToast } from '../components/Toast';
import { usePlatform } from '../store/alphaStore';
import { formatAR, formatDateTime } from '../utils/format';

export function AdminPage({ navigate }: { navigate: (path: string) => void }) {
  const {
    allUsers,
    deposits,
    withdrawals,
    announcements,
    approveDeposit,
    rejectDeposit,
    approveWithdrawal,
    rejectWithdrawal,
    processAdminEmailAction,
    publishGlobalAnnouncement,
    reloadFromStorage,
    logout,
  } = usePlatform();

  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [actionFeedback, setActionFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const processedHashRef = useRef<string | null>(null);

  useEffect(() => {
    reloadFromStorage();

    const rawHash = window.location.hash;
    const [, rawQuery = ''] = rawHash.split('?');
    if (!rawQuery) return;

    const searchParams = new URLSearchParams(rawQuery);
    const action = searchParams.get('action');
    const txId = searchParams.get('txId');

    if ((action === 'accept' || action === 'reject') && txId) {
      if (processedHashRef.current === rawHash) return;
      processedHashRef.current = rawHash;

      const phone = searchParams.get('phone') || undefined;
      const amountStr = searchParams.get('amount');
      const amount = amountStr ? Number(amountStr) : undefined;
      const type = searchParams.get('type') || undefined;

      const res = processAdminEmailAction({
        action,
        txId,
        phone,
        amount,
        type,
      });

      setActionFeedback(res);
      showToast(
        res.message,
        res.ok ? (action === 'accept' ? 'success' : 'info') : 'error'
      );

      window.history.replaceState(null, '', window.location.pathname + '#/admin');
      navigate('/admin');
    }
  }, [navigate, processAdminEmailAction, reloadFromStorage]);

  const handleRefresh = () => {
    reloadFromStorage();
    showToast('Données actualisées depuis le stockage local', 'success');
  };

  const pendingDeposits = deposits.filter((d) => d.status === 'pending');
  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending');

  const exitAdmin = async () => {
    await logout();
    navigate('/admin');
  };

  const handlePublishNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await publishGlobalAnnouncement(noticeTitle, noticeMessage);
    if (!res.ok) {
      showToast(res.error || 'Erreur lors de la publication', 'error');
      return;
    }
    setNoticeTitle('');
    setNoticeMessage('');
    showToast('Avis global diffusé à tous les membres !', 'success');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-gradient-to-r from-med-forest to-med-deep text-white px-4 py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-med-light" />
            <h1 className="font-bold text-base">Administration MED</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Actualiser</span>
            </button>
            <button
              onClick={exitAdmin}
              className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {actionFeedback && (
          <div
            className={`rounded-2xl border p-4 flex items-center justify-between gap-3 ${
              actionFeedback.ok
                ? 'bg-med-soft border-med-light text-med-forest'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            <p className="text-xs font-bold">{actionFeedback.message}</p>
            <button
              onClick={() => setActionFeedback(null)}
              className="text-current opacity-70 hover:opacity-100 cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4">
            <p className="text-xs text-gray-500">Utilisateurs</p>
            <p className="text-2xl font-extrabold text-med-forest tabular-nums mt-1">
              {allUsers.length}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500">Dépôts en attente</p>
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
                        onClick={async () => {
                          await approveDeposit(d.id);
                          showToast('Dépôt approuvé et crédité !', 'success');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-med-deep text-white text-xs font-bold flex items-center gap-1 hover:bg-med-forest cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Valider
                      </button>
                      <button
                        onClick={async () => {
                          await rejectDeposit(d.id);
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
                        onClick={async () => {
                          await approveWithdrawal(w.id);
                          showToast('Retrait approuvé !', 'success');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-med-deep text-white text-xs font-bold flex items-center gap-1 hover:bg-med-forest cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Approuver
                      </button>
                      <button
                        onClick={async () => {
                          await rejectWithdrawal(w.id);
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

        {/* Global Notice Broadcast */}
        <section>
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-med-deep" />
            <span>Diffuser un avis global</span>
          </h2>
          <form onSubmit={handlePublishNotice} className="card p-5 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Titre de l’annonce
              </label>
              <input
                type="text"
                required
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                className="input-field text-sm"
                placeholder="Ex : Maintenance planifiée ou Promotion VIP"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Message officiel
              </label>
              <textarea
                required
                rows={3}
                value={noticeMessage}
                onChange={(e) => setNoticeMessage(e.target.value)}
                className="input-field text-sm resize-none"
                placeholder="Rédigez le message visible par tous les membres..."
              />
            </div>
            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
            >
              <Send className="w-4 h-4" />
              <span>Diffuser l’avis</span>
            </button>
          </form>

          {announcements.length > 0 && (
            <div className="mt-3 space-y-2">
              {announcements.slice(0, 3).map((a) => (
                <div key={a.id} className="card p-3.5 border-l-4 border-l-med-emerald">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-gray-900">{a.title}</p>
                    <span className="text-[10px] text-gray-400">
                      {formatDateTime(a.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{a.message}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Users List */}
        <section>
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-med-deep" />
            <span>Utilisateurs inscrits ({allUsers.length})</span>
          </h2>
          {allUsers.length === 0 ? (
            <div className="card p-6 text-center text-sm text-gray-400">
              Aucun utilisateur enregistré
            </div>
          ) : (
            <div className="card divide-y divide-gray-50">
              {allUsers.map((u) => (
                <div key={u.user_id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{u.full_name}</p>
                    <p className="text-xs text-gray-500">
                      {u.phone} • Code : <span className="font-mono">{u.referral_code}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-med-deep tabular-nums">
                      {formatAR(u.balance)}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Gains : +{formatAR(u.total_earned)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
