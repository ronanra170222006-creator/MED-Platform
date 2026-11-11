import React, { useEffect, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Check,
  CheckSquare,
  Clock,
  Copy,
  Crown,
  HelpCircle,
  History,
  LogOut,
  Megaphone,
  Play,
  Star,
  Users,
  Video,
  Wallet,
} from 'lucide-react';
import { BrandLogo, Modal } from '../components/Brand';
import { showToast } from '../components/Toast';
import { VIP_PLANS } from '../data/seed';
import { usePlatform } from '../store/alphaStore';
import { Investment } from '../types';
import { formatAR, formatCountdown, formatDateTime } from '../utils/format';
import { requestBrowserNotificationPermission } from '../utils/notifications';

const DAY_MS = 24 * 60 * 60 * 1000;
const VIDEO_DURATION_SEC = 10;

export function HomePage({ navigate }: { navigate: (path: string) => void }) {
  const {
    profile,
    investments,
    tasks,
    notifications,
    announcements,
    logout,
    markAllNotificationsRead,
  } = usePlatform();

  const [notifOpen, setNotifOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (profile?.user_id) {
      requestBrowserNotificationPermission();
    }
  }, [profile?.user_id]);

  const uid = profile?.user_id ?? '';
  const userNotifs = notifications.filter(
    (n) => n.user_id === uid || n.user_id === 'ALL'
  );
  const isNotifRead = (n: (typeof userNotifs)[number]) =>
    n.user_id === 'ALL' ? (n.read_by ?? []).includes(uid) : n.is_read;
  const unreadCount = userNotifs.filter((n) => !isNotifRead(n)).length;
  const availableBalance = (profile?.balance ?? 0) - (profile?.reserved_balance ?? 0);
  const activeInvestments = investments.filter(
    (i) => i.user_id === profile?.user_id && i.status === 'active'
  );
  const userTasks = tasks.filter((t) => t.user_id === profile?.user_id);

  const handleCopyCode = () => {
    if (!profile?.referral_code) return;
    navigator.clipboard?.writeText(profile.referral_code);
    setCopied(true);
    showToast('Code de parrainage copié !', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-br from-med-forest via-med-deep to-med-emerald pt-8 pb-20 px-5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-med-light blur-3xl" />
        </div>

        <div className="max-w-md mx-auto relative">
          <div className="flex items-center justify-between mb-5">
            <BrandLogo size="sm" />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-colors cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-white" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-med-light text-med-forest text-[10px] font-extrabold rounded-full flex items-center justify-center tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={handleLogout}
                className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-colors cursor-pointer"
                aria-label="Déconnexion"
              >
                <LogOut className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          <div className="text-white">
            <p className="text-white/75 text-sm">Bienvenue,</p>
            <h2 className="text-xl font-bold">{profile?.full_name ?? 'Membre'}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-white/65">ID:</span>
              <code className="text-xs text-med-light font-mono bg-white/15 px-2 py-0.5 rounded">
                {profile?.referral_code ?? '---'}
              </code>
              <button
                onClick={handleCopyCode}
                className="text-white/75 hover:text-white cursor-pointer"
                aria-label="Copier l'identifiant"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications Drawer */}
      {notifOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={() => setNotifOpen(false)}
        >
          <div
            className="max-w-md mx-auto bg-white shadow-xl animate-slide-down max-h-[60vh] overflow-y-auto rounded-b-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllNotificationsRead}
                  className="text-xs text-med-deep font-semibold cursor-pointer"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>
            <div className="divide-y divide-gray-50">
              {userNotifs.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  Aucune notification pour le moment
                </div>
              ) : (
                userNotifs.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 ${isNotifRead(n) ? 'bg-white' : 'bg-med-soft'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-gray-900">{n.title}</p>
                      <span className="text-[10px] text-gray-400">
                        {formatDateTime(n.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 -mt-12 relative z-10">
        {/* Balance Card */}
        <div className="card p-5 shadow-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500">Solde disponible</span>
            <Wallet className="w-4 h-4 text-med-deep" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900 tabular-nums">
            {formatAR(availableBalance)}
          </p>

          <div className="mt-4 pt-3 border-t border-emerald-50 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-400 block">Gains cumulés</span>
              <span className="font-bold text-med-deep tabular-nums">
                +{formatAR(profile?.total_earned ?? 0)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-gray-400 block">VIP Actifs</span>
              <span className="font-bold text-med-deep tabular-nums">
                {activeInvestments.length}
              </span>
            </div>
          </div>
        </div>

        {/* Official Global Announcement */}
        {announcements.length > 0 && (
          <div className="mt-4 rounded-2xl bg-med-soft border border-med-light p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-med-deep flex items-center justify-center flex-shrink-0">
              <Megaphone className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-extrabold text-med-forest uppercase tracking-wide">
                  Avis officiel • {announcements[0].title}
                </p>
                <span className="text-[10px] text-med-forest/65 whitespace-nowrap">
                  {formatDateTime(announcements[0].created_at)}
                </span>
              </div>
              <p className="text-xs text-med-forest/90 mt-1 leading-relaxed">
                {announcements[0].message}
              </p>
            </div>
          </div>
        )}

        {/* 4 Quick Actions */}
        <div className="grid grid-cols-4 gap-3 mt-5">
          <QuickAction
            icon={ArrowDownLeft}
            label="DÉPÔT"
            color="from-med-deep to-med-emerald"
            onClick={() => navigate('/deposit')}
          />
          <QuickAction
            icon={ArrowUpRight}
            label="RETRAIT"
            color="from-emerald-600 to-teal-500"
            onClick={() => navigate('/withdraw')}
          />
          <QuickAction
            icon={HelpCircle}
            label="AIDE"
            color="from-med-forest to-med-deep"
            onClick={() => navigate('/help')}
          />
          <QuickAction
            icon={Users}
            label="ÉQUIPE"
            color="from-teal-600 to-emerald-500"
            onClick={() => navigate('/team')}
          />
        </div>

        {/* Workspace: Video Watching Tasks */}
        <section className="mt-7 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Video className="w-5 h-5 text-med-deep" />
              <span>Espace de Travail - Tâches de Visionnage</span>
            </h3>
          </div>

          {activeInvestments.length === 0 ? (
            <div className="card p-6 text-center">
              <Crown className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-4">
                Activez un niveau VIP pour accéder aux tâches de visionnage et générer vos revenus quotidiens.
              </p>
              <button onClick={() => navigate('/plan')} className="btn-primary text-sm">
                Voir les plans VIP
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeInvestments.map((inv) => (
                <DailyTaskCard
                  key={inv.id}
                  investment={inv}
                  tasks={userTasks.filter((t) => t.investment_id === inv.id)}
                />
              ))}

              {/* Task History */}
              <div className="mt-6">
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <History className="w-4 h-4 text-gray-400" />
                  <span>Historique des tâches</span>
                </h4>
                {userTasks.filter((t) => t.payment_status === 'paid').length === 0 ? (
                  <div className="card p-6 text-center">
                    <p className="text-sm text-gray-400">
                      Aucune tâche réalisée pour le moment
                    </p>
                  </div>
                ) : (
                  <div className="card divide-y divide-gray-50">
                    {userTasks
                      .filter((t) => t.payment_status === 'paid')
                      .slice(0, 5)
                      .map((t) => (
                        <div
                          key={t.id}
                          className="px-4 py-3 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {t.plan_name}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {formatDateTime(t.paid_at || t.created_at)}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-med-deep tabular-nums">
                            +{formatAR(t.reward)}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* VIP Portfolios Preview */}
        <section className="mt-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Portefeuilles VIP</h3>
            <button
              onClick={() => navigate('/plan')}
              className="text-sm text-med-deep font-semibold hover:underline cursor-pointer"
            >
              Voir tout
            </button>
          </div>

          <div className="space-y-3">
            {VIP_PLANS.slice(0, 5).map((plan) => (
              <div
                key={plan.id}
                onClick={() => navigate('/plan')}
                className="bg-white rounded-2xl shadow-xs border border-emerald-100 hover:shadow-md transition-all cursor-pointer overflow-hidden flex"
              >
                <div className="w-1.5 bg-med-emerald flex-shrink-0" />
                <div className="flex-1 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-med-deep to-med-forest flex items-center justify-center">
                        <Crown className="w-4 h-4 text-med-light" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{plan.name}</p>
                        <p className="text-[11px] text-gray-400">
                          {plan.duration_days} jours • {plan.daily_rate}% / jour
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-med-deep text-sm tabular-nums">
                        {formatAR(plan.price)}
                      </p>
                      <p className="text-[11px] text-emerald-600 font-semibold tabular-nums">
                        +{formatAR(plan.daily_task_reward)} / tâche
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  color,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 group cursor-pointer"
    >
      <div
        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-sm group-hover:scale-105 group-active:scale-95 transition-transform`}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className="text-[11px] font-bold text-gray-700">{label}</span>
    </button>
  );
}

function DailyTaskCard({
  investment,
  tasks,
}: {
  investment: Investment;
  tasks: ReturnType<typeof usePlatform>['tasks'];
}) {
  const { completeDailyTask } = usePlatform();
  const [modalOpen, setModalOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [step, setStep] = useState<'ready' | 'watching' | 'review'>('ready');
  const [secondsLeft, setSecondsLeft] = useState(VIDEO_DURATION_SEC);
  const [rating, setRating] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  const plan = VIP_PLANS.find((p) => p.id === investment.plan_id);
  const reward = plan?.daily_task_reward ?? 0;
  const planName = plan?.name ?? 'VIP';

  const paidTimes = tasks
    .filter((t) => t.payment_status === 'paid' && t.paid_at)
    .map((t) => new Date(t.paid_at!).getTime());
  const lastPaid = paidTimes.length > 0 ? Math.max(...paidTimes) : null;
  const nextAvailableAt = lastPaid !== null ? lastPaid + DAY_MS : 0;
  const isCooldown = now < nextAvailableAt;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (step !== 'watching') return;
    if (secondsLeft <= 0) {
      setStep('review');
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [step, secondsLeft]);

  const openTaskModal = () => {
    setStep('ready');
    setSecondsLeft(VIDEO_DURATION_SEC);
    setRating(0);
    setConfirmed(false);
    setModalOpen(true);
  };

  const startWatch = () => {
    setSecondsLeft(VIDEO_DURATION_SEC);
    setStep('watching');
  };

  const handleValidateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) {
      showToast('Veuillez sélectionner une note de 1 à 5 étoiles', 'error');
      return;
    }
    if (!confirmed) {
      showToast('Veuillez cocher la case de confirmation', 'error');
      return;
    }

    const res = await completeDailyTask(investment.id, rating);
    if (res.ok) {
      showToast(`Travail validé ! Récompense de ${formatAR(reward)} créditée.`, 'success');
      setModalOpen(false);
    } else {
      showToast(res.error || 'Erreur lors de la validation', 'error');
    }
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-bold text-gray-900">{planName}</p>
          <p className="text-xs text-gray-400">Une tâche de visionnage toutes les 24h</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase text-gray-400">Récompense</p>
          <p className="font-extrabold text-med-deep flex items-center gap-1 justify-end tabular-nums">
            <Crown className="w-4 h-4 text-med-emerald" />
            <span>{formatAR(reward)}</span>
          </p>
        </div>
      </div>

      {isCooldown ? (
        <div className="rounded-xl bg-med-soft px-4 py-3 text-center border border-med-light/60">
          <p className="text-xs text-med-forest flex items-center justify-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Prochaine tâche disponible dans</span>
          </p>
          <p className="text-xl font-extrabold text-med-forest tabular-nums mt-1 font-mono">
            {formatCountdown(nextAvailableAt - now)}
          </p>
        </div>
      ) : (
        <button
          onClick={openTaskModal}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" />
          <span>Démarrer le visionnage</span>
        </button>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setStep('ready');
          setModalOpen(false);
        }}
        title="Tâche de Visionnage"
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900">{planName}</p>
              <p className="text-xs text-gray-400">
                Clip publicitaire MED ({VIDEO_DURATION_SEC}s)
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase text-gray-400">Récompense</p>
              <p className="font-extrabold text-med-deep tabular-nums">
                {formatAR(reward)}
              </p>
            </div>
          </div>

          {step !== 'review' ? (
            <>
              <div className="rounded-xl bg-gradient-to-br from-med-forest to-med-deep p-6 text-center text-white relative overflow-hidden">
                {step === 'watching' ? (
                  <div className="space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-full bg-white/15 flex items-center justify-center font-mono text-xl font-extrabold text-med-light tabular-nums">
                      {secondsLeft}s
                    </div>
                    <p className="text-sm font-semibold">
                      Visionnage du clip publicitaire en cours…
                    </p>
                    <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-med-light h-full transition-all duration-1000"
                        style={{
                          width: `${((VIDEO_DURATION_SEC - secondsLeft) / VIDEO_DURATION_SEC) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Video className="w-8 h-8 text-med-light mx-auto" />
                    <p className="text-sm text-white/85">
                      Visionnez le clip jusqu’à la fin puis remplissez le court avis pour créditer votre récompense.
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={startWatch}
                disabled={step === 'watching'}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                <span>
                  {step === 'watching'
                    ? `Visionnage (${secondsLeft}s)...`
                    : 'Lancer le clip publicitaire'}
                </span>
              </button>
            </>
          ) : (
            <form onSubmit={handleValidateTask} className="space-y-4">
              <div className="rounded-xl bg-med-soft border border-med-light p-4 space-y-3">
                <p className="text-xs font-bold text-med-forest">
                  Évaluation obligatoire du clip visionné
                </p>

                <div>
                  <label className="block text-xs text-gray-600 mb-2">
                    Attribuez une note (1 à 5 étoiles)
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className="p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer"
                        aria-label={`${star} étoiles`}
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            star <= rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-start gap-2.5 text-xs text-gray-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-med-deep text-med-deep focus:ring-med-emerald"
                  />
                  <span>
                    Je confirme avoir visionné le clip média dans son intégralité.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <CheckSquare className="w-4 h-4" />
                <span>Valider et créditer {formatAR(reward)}</span>
              </button>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
}
