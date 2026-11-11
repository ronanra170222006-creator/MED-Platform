import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  DailyTask,
  DepositRequest,
  Investment,
  NotificationItem,
  ReferralMember,
  TransactionRecord,
  UserProfile,
  WithdrawalRequest,
} from '../types';
import { VIP_PLANS } from '../data/seed';
import { formatAR } from '../utils/format';

interface StoredAccount {
  profile: UserProfile;
  password: string;
}

interface PlatformState {
  loading: boolean;
  isAuthenticated: boolean;
  isAdminMode: boolean;
  profile: UserProfile | null;
  accounts: StoredAccount[];
  allUsers: UserProfile[];
  investments: Investment[];
  tasks: DailyTask[];
  deposits: DepositRequest[];
  withdrawals: WithdrawalRequest[];
  transactions: TransactionRecord[];
  notifications: NotificationItem[];
  referrals: ReferralMember[];
}

interface ActionResult {
  ok: boolean;
  error?: string;
  reward?: number;
}

interface PlatformContextValue extends PlatformState {
  loginWithPhone: (phone: string, password: string) => Promise<ActionResult>;
  signup: (data: {
    full_name: string;
    phone: string;
    password: string;
    referral_code?: string;
  }) => Promise<ActionResult>;
  loginAdmin: (email: string, password: string) => Promise<ActionResult>;
  logout: () => Promise<void>;
  submitDeposit: (payload: {
    amount: number;
    payment_method: string;
    payment_operator: string;
    payer_number: string;
    transaction_ref?: string;
    proof_name?: string;
  }) => Promise<ActionResult>;
  submitWithdrawal: (payload: {
    amount: number;
    payment_method: string;
    beneficiary_number: string;
    beneficiary_name: string;
  }) => Promise<ActionResult>;
  investInPlan: (planId: string) => Promise<ActionResult>;
  completeDailyTask: (investmentId: string, rating: number) => Promise<ActionResult>;
  markAllNotificationsRead: () => Promise<void>;
  approveDeposit: (id: string) => Promise<void>;
  rejectDeposit: (id: string) => Promise<void>;
  approveWithdrawal: (id: string) => Promise<void>;
  rejectWithdrawal: (id: string) => Promise<void>;
}

const STORAGE_KEY = 'med_local_data_v1';
const ROOT_ADMIN_EMAIL = 'ronanswerdna@gmail.com';
const ROOT_ADMIN_PASS = 'Ronan17#';

const initialCleanState: PlatformState = {
  loading: false,
  isAuthenticated: false,
  isAdminMode: false,
  profile: null,
  accounts: [],
  allUsers: [],
  investments: [],
  tasks: [],
  deposits: [],
  withdrawals: [],
  transactions: [],
  notifications: [],
  referrals: [],
};

const PlatformContext = createContext<PlatformContextValue | null>(null);

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PlatformState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PlatformState>;
        const accounts = parsed.accounts ?? [];
        const currentProfile = parsed.profile
          ? accounts.find((a) => a.profile.user_id === parsed.profile?.user_id)?.profile ??
            parsed.profile
          : null;
        return {
          ...initialCleanState,
          ...parsed,
          loading: false,
          profile: currentProfile,
          allUsers: accounts.map((a) => a.profile),
        };
      }
    } catch {
      // ignore storage read error
    }
    return initialCleanState;
  });

  useEffect(() => {
    try {
      const toPersist = {
        isAuthenticated: state.isAuthenticated,
        isAdminMode: state.isAdminMode,
        profile: state.profile,
        accounts: state.accounts,
        investments: state.investments,
        tasks: state.tasks,
        deposits: state.deposits,
        withdrawals: state.withdrawals,
        transactions: state.transactions,
        notifications: state.notifications,
        referrals: state.referrals,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
    } catch {
      // ignore storage write error
    }
  }, [state]);

  const syncAccountProfile = useCallback(
    (
      prev: PlatformState,
      userId: string,
      updater: (p: UserProfile) => UserProfile
    ): { accounts: StoredAccount[]; allUsers: UserProfile[]; profile: UserProfile | null } => {
      const nextAccounts = prev.accounts.map((acc) =>
        acc.profile.user_id === userId ? { ...acc, profile: updater(acc.profile) } : acc
      );
      const nextProfile =
        prev.profile && prev.profile.user_id === userId
          ? updater(prev.profile)
          : prev.profile;
      return {
        accounts: nextAccounts,
        allUsers: nextAccounts.map((a) => a.profile),
        profile: nextProfile,
      };
    },
    []
  );

  const loginWithPhone = async (phone: string, password: string): Promise<ActionResult> => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 9) {
      return { ok: false, error: 'Numéro de téléphone invalide' };
    }

    const found = state.accounts.find((a) => a.profile.phone === cleanPhone);
    if (!found || found.password !== password) {
      return { ok: false, error: 'Numéro de téléphone ou mot de passe incorrect' };
    }

    setState((prev) => ({
      ...prev,
      isAuthenticated: true,
      isAdminMode: false,
      profile: found.profile,
      allUsers: prev.accounts.map((a) => a.profile),
    }));

    return { ok: true };
  };

  const signup = async ({
    full_name,
    phone,
    password,
    referral_code,
  }: {
    full_name: string;
    phone: string;
    password: string;
    referral_code?: string;
  }): Promise<ActionResult> => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 9) {
      return { ok: false, error: 'Numéro de téléphone invalide' };
    }
    if (password.length < 6) {
      return { ok: false, error: 'Le mot de passe doit contenir au moins 6 caractères' };
    }
    if (state.accounts.some((a) => a.profile.phone === cleanPhone)) {
      return { ok: false, error: 'Ce numéro de téléphone est déjà utilisé' };
    }

    const generatedCode = 'MED' + Math.floor(100 + Math.random() * 900).toString();
    const userId = 'user-' + Date.now();
    const now = new Date().toISOString();

    const newProfile: UserProfile = {
      user_id: userId,
      full_name: full_name.trim(),
      phone: cleanPhone,
      referral_code: generatedCode,
      referred_by: referral_code?.trim() || undefined,
      balance: 0,
      reserved_balance: 0,
      total_earned: 0,
      is_admin: false,
      is_suspended: false,
      created_at: now,
    };

    setState((prev) => {
      const nextAccounts = [...prev.accounts, { profile: newProfile, password }];
      return {
        ...prev,
        isAuthenticated: true,
        isAdminMode: false,
        profile: newProfile,
        accounts: nextAccounts,
        allUsers: nextAccounts.map((a) => a.profile),
      };
    });

    return { ok: true };
  };

  const loginAdmin = async (email: string, password: string): Promise<ActionResult> => {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail !== ROOT_ADMIN_EMAIL || password !== ROOT_ADMIN_PASS) {
      return { ok: false, error: 'Identifiants administrateur invalides' };
    }

    setState((prev) => ({
      ...prev,
      isAuthenticated: true,
      isAdminMode: true,
      allUsers: prev.accounts.map((a) => a.profile),
      profile: {
        user_id: 'root-admin',
        full_name: 'Administrateur MED',
        phone: '0337466748',
        email: ROOT_ADMIN_EMAIL,
        referral_code: 'ADMIN',
        balance: 0,
        reserved_balance: 0,
        total_earned: 0,
        is_admin: true,
        is_suspended: false,
        created_at: new Date().toISOString(),
      },
    }));

    return { ok: true };
  };

  const logout = async () => {
    setState((prev) => ({
      ...prev,
      isAuthenticated: false,
      isAdminMode: false,
      profile: null,
    }));
  };

  const submitDeposit = async (payload: {
    amount: number;
    payment_method: string;
    payment_operator: string;
    payer_number: string;
    transaction_ref?: string;
    proof_name?: string;
  }): Promise<ActionResult> => {
    if (!state.profile) return { ok: false, error: 'Session expirée' };
    if (payload.payment_operator !== 'Airtel Money') {
      return { ok: false, error: 'Les dépôts sont autorisés uniquement via Airtel Money.' };
    }

    const now = new Date().toISOString();
    const dep: DepositRequest = {
      id: 'dep-' + Date.now(),
      user_id: state.profile.user_id,
      user_name: state.profile.full_name,
      amount: payload.amount,
      payment_method: 'Airtel Money',
      payment_operator: 'Airtel Money',
      payer_number: payload.payer_number,
      transaction_ref: payload.transaction_ref,
      proof_name: payload.proof_name,
      status: 'pending',
      created_at: now,
    };

    const notif: NotificationItem = {
      id: 'notif-' + Date.now(),
      user_id: state.profile.user_id,
      title: 'Demande de dépôt enregistrée',
      message: `Votre dépôt de ${formatAR(payload.amount)} via Airtel Money (0337466748) est en attente de validation.`,
      is_read: false,
      created_at: now,
    };

    setState((prev) => ({
      ...prev,
      deposits: [dep, ...prev.deposits],
      notifications: [notif, ...prev.notifications],
    }));

    return { ok: true };
  };

  const submitWithdrawal = async (payload: {
    amount: number;
    payment_method: string;
    beneficiary_number: string;
    beneficiary_name: string;
  }): Promise<ActionResult> => {
    if (!state.profile) return { ok: false, error: 'Session expirée' };
    if (
      payload.payment_method !== 'Airtel Money' &&
      payload.payment_method !== 'Orange Money'
    ) {
      return {
        ok: false,
        error: 'Réseau non autorisé. Choisissez Airtel Money ou Orange Money.',
      };
    }

    const available = state.profile.balance - state.profile.reserved_balance;
    if (payload.amount > available) {
      return { ok: false, error: 'Solde disponible insuffisant' };
    }

    const fee = Math.round(payload.amount * 0.03);
    const netAmount = payload.amount - fee;
    const now = new Date().toISOString();

    setState((prev) => {
      if (!prev.profile) return prev;
      const synced = syncAccountProfile(prev, prev.profile.user_id, (p) => ({
        ...p,
        reserved_balance: p.reserved_balance + payload.amount,
      }));
      const wit: WithdrawalRequest = {
        id: 'wit-' + Date.now(),
        user_id: prev.profile.user_id,
        user_name: prev.profile.full_name,
        amount: payload.amount,
        fee,
        net_amount: netAmount,
        payment_method: payload.payment_method,
        beneficiary_number: payload.beneficiary_number,
        beneficiary_name: payload.beneficiary_name,
        status: 'pending',
        created_at: now,
      };
      const notif: NotificationItem = {
        id: 'notif-' + Date.now(),
        user_id: prev.profile.user_id,
        title: 'Retrait en cours',
        message: `Demande de retrait de ${formatAR(payload.amount)} via ${payload.payment_method} soumise (${formatAR(netAmount)} net).`,
        is_read: false,
        created_at: now,
      };
      return {
        ...prev,
        ...synced,
        withdrawals: [wit, ...prev.withdrawals],
        notifications: [notif, ...prev.notifications],
      };
    });

    return { ok: true };
  };

  const investInPlan = async (planId: string): Promise<ActionResult> => {
    const plan = VIP_PLANS.find((p) => p.id === planId);
    if (!plan) return { ok: false, error: 'Plan introuvable' };
    if (!state.profile) return { ok: false, error: 'Session expirée' };

    const available = state.profile.balance - state.profile.reserved_balance;
    if (available < plan.price) {
      return { ok: false, error: 'Solde disponible insuffisant pour ce niveau VIP' };
    }

    const now = new Date().toISOString();
    setState((prev) => {
      if (!prev.profile) return prev;
      const synced = syncAccountProfile(prev, prev.profile.user_id, (p) => ({
        ...p,
        balance: p.balance - plan.price,
      }));
      const inv: Investment = {
        id: 'inv-' + Date.now(),
        user_id: prev.profile.user_id,
        plan_id: plan.id,
        amount: plan.price,
        status: 'active',
        created_at: now,
        activated_at: now,
      };
      const tx: TransactionRecord = {
        id: 'tx-' + Date.now(),
        user_id: prev.profile.user_id,
        type: 'investment',
        amount: -plan.price,
        description: `Activation Portefeuille ${plan.name}`,
        created_at: now,
      };
      const notif: NotificationItem = {
        id: 'notif-' + Date.now(),
        user_id: prev.profile.user_id,
        title: `${plan.name} activé`,
        message: `Votre portefeuille ${plan.name} est actif. Accomplissez votre tâche de visionnage quotidienne pour recevoir ${formatAR(plan.daily_task_reward)}.`,
        is_read: false,
        created_at: now,
      };
      return {
        ...prev,
        ...synced,
        investments: [inv, ...prev.investments],
        transactions: [tx, ...prev.transactions],
        notifications: [notif, ...prev.notifications],
      };
    });

    return { ok: true };
  };

  const completeDailyTask = async (
    investmentId: string,
    rating: number
  ): Promise<ActionResult> => {
    if (rating < 1 || rating > 5) {
      return { ok: false, error: 'Veuillez attribuer une note de 1 à 5 étoiles' };
    }
    if (!state.profile) return { ok: false, error: 'Session expirée' };

    const inv = state.investments.find((i) => i.id === investmentId);
    if (!inv) return { ok: false, error: 'Investissement introuvable' };
    const plan = VIP_PLANS.find((p) => p.id === inv.plan_id);
    if (!plan) return { ok: false, error: 'Plan introuvable' };

    const lastPaid = state.tasks
      .filter((t) => t.investment_id === investmentId && t.payment_status === 'paid' && t.paid_at)
      .map((t) => new Date(t.paid_at!).getTime());

    if (lastPaid.length > 0 && Date.now() - Math.max(...lastPaid) < 24 * 3600 * 1000) {
      return { ok: false, error: 'Tâche déjà réalisée aujourd’hui' };
    }

    const now = new Date().toISOString();
    setState((prev) => {
      if (!prev.profile) return prev;
      const synced = syncAccountProfile(prev, prev.profile.user_id, (p) => ({
        ...p,
        balance: p.balance + plan.daily_task_reward,
        total_earned: p.total_earned + plan.daily_task_reward,
      }));
      const task: DailyTask = {
        id: 'task-' + Date.now(),
        user_id: prev.profile.user_id,
        investment_id: investmentId,
        plan_name: plan.name,
        reward: plan.daily_task_reward,
        payment_status: 'paid',
        paid_at: now,
        created_at: now,
      };
      const tx: TransactionRecord = {
        id: 'tx-' + Date.now(),
        user_id: prev.profile.user_id,
        type: 'task_reward',
        amount: plan.daily_task_reward,
        description: `Tâche de visionnage ${plan.name} (Note ${rating}/5)`,
        created_at: now,
      };
      return {
        ...prev,
        ...synced,
        tasks: [task, ...prev.tasks],
        transactions: [tx, ...prev.transactions],
      };
    });

    return { ok: true, reward: plan.daily_task_reward };
  };

  const markAllNotificationsRead = async () => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, is_read: true })),
    }));
  };

  const approveDeposit = async (id: string) => {
    setState((prev) => {
      const target = prev.deposits.find((d) => d.id === id);
      if (!target || target.status !== 'pending') return prev;
      const now = new Date().toISOString();
      const synced = syncAccountProfile(prev, target.user_id, (p) => ({
        ...p,
        balance: p.balance + target.amount,
      }));
      return {
        ...prev,
        ...synced,
        deposits: prev.deposits.map((d) =>
          d.id === id ? { ...d, status: 'approved' } : d
        ),
        transactions: [
          {
            id: 'tx-' + Date.now(),
            user_id: target.user_id,
            type: 'deposit',
            amount: target.amount,
            description: `Dépôt ${target.payment_method} validé`,
            created_at: now,
          },
          ...prev.transactions,
        ],
        notifications: [
          {
            id: 'notif-' + Date.now(),
            user_id: target.user_id,
            title: 'Dépôt validé',
            message: `Votre dépôt de ${formatAR(target.amount)} a été crédité sur votre solde.`,
            is_read: false,
            created_at: now,
          },
          ...prev.notifications,
        ],
      };
    });
  };

  const rejectDeposit = async (id: string) => {
    setState((prev) => ({
      ...prev,
      deposits: prev.deposits.map((d) =>
        d.id === id && d.status === 'pending' ? { ...d, status: 'rejected' } : d
      ),
    }));
  };

  const approveWithdrawal = async (id: string) => {
    setState((prev) => {
      const target = prev.withdrawals.find((w) => w.id === id);
      if (!target || target.status !== 'pending') return prev;
      const now = new Date().toISOString();
      const synced = syncAccountProfile(prev, target.user_id, (p) => ({
        ...p,
        balance: Math.max(0, p.balance - target.amount),
        reserved_balance: Math.max(0, p.reserved_balance - target.amount),
      }));
      return {
        ...prev,
        ...synced,
        withdrawals: prev.withdrawals.map((w) =>
          w.id === id ? { ...w, status: 'approved' } : w
        ),
        transactions: [
          {
            id: 'tx-' + Date.now(),
            user_id: target.user_id,
            type: 'withdrawal',
            amount: -target.amount,
            description: `Retrait ${target.payment_method} approuvé`,
            created_at: now,
          },
          ...prev.transactions,
        ],
        notifications: [
          {
            id: 'notif-' + Date.now(),
            user_id: target.user_id,
            title: 'Retrait approuvé',
            message: `Votre retrait de ${formatAR(target.net_amount)} net a été envoyé via ${target.payment_method}.`,
            is_read: false,
            created_at: now,
          },
          ...prev.notifications,
        ],
      };
    });
  };

  const rejectWithdrawal = async (id: string) => {
    setState((prev) => {
      const target = prev.withdrawals.find((w) => w.id === id);
      if (!target || target.status !== 'pending') return prev;
      const synced = syncAccountProfile(prev, target.user_id, (p) => ({
        ...p,
        reserved_balance: Math.max(0, p.reserved_balance - target.amount),
      }));
      return {
        ...prev,
        ...synced,
        withdrawals: prev.withdrawals.map((w) =>
          w.id === id ? { ...w, status: 'rejected' } : w
        ),
      };
    });
  };

  return (
    <PlatformContext.Provider
      value={{
        ...state,
        loginWithPhone,
        signup,
        loginAdmin,
        logout,
        submitDeposit,
        submitWithdrawal,
        investInPlan,
        completeDailyTask,
        markAllNotificationsRead,
        approveDeposit,
        rejectDeposit,
        approveWithdrawal,
        rejectWithdrawal,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error('usePlatform must be used inside PlatformProvider');
  return ctx;
}
