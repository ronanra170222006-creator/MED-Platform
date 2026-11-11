import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  DailyTask,
  DepositRequest,
  Investment,
  NotificationItem,
  ReferralMember,
  RequestStatus,
  TransactionRecord,
  UserProfile,
  WithdrawalRequest,
} from '../types';
import { VIP_PLANS } from '../data/seed';
import { formatAR } from '../utils/format';

interface StoredAccount {
  profile: UserProfile & { solde_ariary?: number };
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
  reloadFromStorage: () => void;
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

export const STORAGE_KEY = 'med_local_data_v1';
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

function mapStatutToStatus(statut?: string): RequestStatus {
  if (statut === 'REUSSI') return 'approved';
  if (statut === 'REFUSE') return 'rejected';
  return 'pending';
}

function normalizeStoredProfile(raw: any): UserProfile {
  const solde = Number(raw?.solde_ariary ?? raw?.balance ?? 0);
  return {
    ...raw,
    balance: solde,
  };
}

function deriveDepositsFromTransactions(transactions: TransactionRecord[]): DepositRequest[] {
  return transactions
    .filter((tx) => tx.type === 'DEPOT')
    .map((tx) => ({
      id: tx.id,
      user_id: tx.userId,
      user_name: tx.user_name || tx.telephone || 'Membre MED',
      amount: Number(tx.montant ?? 0),
      payment_method: tx.operateur || 'Airtel Money',
      payment_operator: tx.operateur || 'Airtel Money',
      payer_number: tx.telephone || '',
      transaction_ref: tx.reference,
      status: mapStatutToStatus(tx.statut),
      created_at: tx.date,
    }));
}

function deriveWithdrawalsFromTransactions(transactions: TransactionRecord[]): WithdrawalRequest[] {
  return transactions
    .filter((tx) => tx.type === 'RETRAIT')
    .map((tx) => ({
      id: tx.id,
      user_id: tx.userId,
      user_name: tx.user_name || tx.telephone || 'Membre MED',
      amount: Number(tx.montant ?? 0),
      fee: Number(tx.frais ?? 0),
      net_amount: Number(tx.montant_net ?? tx.montant ?? 0),
      payment_method: tx.operateur || 'Airtel Money',
      beneficiary_number: tx.telephone || '',
      beneficiary_name: tx.beneficiary_name || tx.user_name || 'Membre MED',
      status: mapStatutToStatus(tx.statut),
      created_at: tx.date,
    }));
}

function readLocalState(): PlatformState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PlatformState>;
      const accounts = (parsed.accounts ?? []).map((a) => ({
        ...a,
        profile: normalizeStoredProfile(a.profile),
      }));
      const transactions = (parsed.transactions ?? []) as TransactionRecord[];
      const currentProfile = parsed.profile
        ? accounts.find((a) => a.profile.user_id === parsed.profile?.user_id)?.profile ??
          normalizeStoredProfile(parsed.profile)
        : null;

      return {
        ...initialCleanState,
        ...parsed,
        loading: false,
        profile: currentProfile,
        accounts,
        allUsers: accounts.map((a) => a.profile),
        transactions,
        deposits: deriveDepositsFromTransactions(transactions),
        withdrawals: deriveWithdrawalsFromTransactions(transactions),
      };
    }
  } catch {
    // ignore storage read error
  }
  return initialCleanState;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PlatformState>(() => readLocalState());

  const persistToStorage = useCallback((next: PlatformState) => {
    try {
      const accountsWithSolde = next.accounts.map((acc) => ({
        ...acc,
        profile: {
          ...acc.profile,
          solde_ariary: acc.profile.balance,
        },
      }));
      const toPersist = {
        isAuthenticated: next.isAuthenticated,
        isAdminMode: next.isAdminMode,
        profile: next.profile
          ? { ...next.profile, solde_ariary: next.profile.balance }
          : null,
        accounts: accountsWithSolde,
        investments: next.investments,
        tasks: next.tasks,
        transactions: next.transactions,
        notifications: next.notifications,
        referrals: next.referrals,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
    } catch {
      // ignore storage write error
    }
  }, []);

  useEffect(() => {
    persistToStorage(state);
  }, [state, persistToStorage]);

  const reloadFromStorage = useCallback(() => {
    const fresh = readLocalState();
    setState((prev) => ({
      ...fresh,
      isAuthenticated: prev.isAuthenticated || fresh.isAuthenticated,
      isAdminMode: prev.isAdminMode || fresh.isAdminMode,
      profile: prev.isAdminMode ? prev.profile : fresh.profile,
    }));
  }, []);

  const syncAccountProfile = useCallback(
    (
      prev: PlatformState,
      userId: string,
      updater: (p: UserProfile) => UserProfile
    ): { accounts: StoredAccount[]; allUsers: UserProfile[]; profile: UserProfile | null } => {
      const nextAccounts = prev.accounts.map((acc) => {
        if (acc.profile.user_id !== userId) return acc;
        const updated = updater(acc.profile);
        return {
          ...acc,
          profile: {
            ...updated,
            solde_ariary: updated.balance,
          },
        };
      });
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

    const latest = readLocalState();
    const found = latest.accounts.find((a) => a.profile.phone === cleanPhone);
    if (!found || found.password !== password) {
      return { ok: false, error: 'Numéro de téléphone ou mot de passe incorrect' };
    }

    setState({
      ...latest,
      isAuthenticated: true,
      isAdminMode: false,
      profile: found.profile,
      allUsers: latest.accounts.map((a) => a.profile),
    });

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

    const latest = readLocalState();
    if (latest.accounts.some((a) => a.profile.phone === cleanPhone)) {
      return { ok: false, error: 'Ce numéro de téléphone est déjà utilisé' };
    }

    const generatedCode = 'MED' + Math.floor(100 + Math.random() * 900).toString();
    const userId = 'user-' + Date.now();
    const now = new Date().toISOString();

    const newProfile: UserProfile & { solde_ariary: number } = {
      user_id: userId,
      full_name: full_name.trim(),
      phone: cleanPhone,
      referral_code: generatedCode,
      referred_by: referral_code?.trim() || undefined,
      balance: 0,
      solde_ariary: 0,
      reserved_balance: 0,
      total_earned: 0,
      is_admin: false,
      is_suspended: false,
      created_at: now,
    };

    const nextAccounts = [...latest.accounts, { profile: newProfile, password }];
    setState({
      ...latest,
      isAuthenticated: true,
      isAdminMode: false,
      profile: newProfile,
      accounts: nextAccounts,
      allUsers: nextAccounts.map((a) => a.profile),
    });

    return { ok: true };
  };

  const loginAdmin = async (email: string, password: string): Promise<ActionResult> => {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail !== ROOT_ADMIN_EMAIL || password !== ROOT_ADMIN_PASS) {
      return { ok: false, error: 'Identifiants administrateur invalides' };
    }

    const latest = readLocalState();
    setState({
      ...latest,
      isAuthenticated: true,
      isAdminMode: true,
      allUsers: latest.accounts.map((a) => a.profile),
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
    });

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
    const txId = 'dep-' + Date.now();

    const newTx: TransactionRecord = {
      id: txId,
      userId: state.profile.user_id,
      user_id: state.profile.user_id,
      user_name: state.profile.full_name,
      telephone: payload.payer_number,
      type: 'DEPOT',
      operateur: 'Airtel Money',
      montant: payload.amount,
      amount: payload.amount,
      reference: payload.transaction_ref || '',
      statut: 'EN_ATTENTE',
      description: `Dépôt Airtel Money (${payload.payer_number})`,
      date: now,
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

    setState((prev) => {
      const nextTransactions = [newTx, ...prev.transactions];
      return {
        ...prev,
        transactions: nextTransactions,
        deposits: deriveDepositsFromTransactions(nextTransactions),
        notifications: [notif, ...prev.notifications],
      };
    });

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
      const newTx: TransactionRecord = {
        id: 'wit-' + Date.now(),
        userId: prev.profile.user_id,
        user_id: prev.profile.user_id,
        user_name: prev.profile.full_name,
        telephone: payload.beneficiary_number,
        type: 'RETRAIT',
        operateur: payload.payment_method,
        montant: payload.amount,
        amount: -payload.amount,
        frais: fee,
        montant_net: netAmount,
        beneficiary_name: payload.beneficiary_name,
        statut: 'EN_ATTENTE',
        description: `Retrait ${payload.payment_method} (${formatAR(netAmount)} net)`,
        date: now,
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
      const nextTransactions = [newTx, ...prev.transactions];
      return {
        ...prev,
        ...synced,
        transactions: nextTransactions,
        withdrawals: deriveWithdrawalsFromTransactions(nextTransactions),
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
        userId: prev.profile.user_id,
        user_id: prev.profile.user_id,
        type: 'investment',
        montant: plan.price,
        amount: -plan.price,
        statut: 'REUSSI',
        description: `Activation Portefeuille ${plan.name}`,
        date: now,
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
        userId: prev.profile.user_id,
        user_id: prev.profile.user_id,
        type: 'task_reward',
        montant: plan.daily_task_reward,
        amount: plan.daily_task_reward,
        statut: 'REUSSI',
        description: `Tâche de visionnage ${plan.name} (Note ${rating}/5)`,
        date: now,
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
      const target = prev.transactions.find(
        (t) => t.id === id && t.type === 'DEPOT' && t.statut === 'EN_ATTENTE'
      );
      if (!target) return prev;
      const now = new Date().toISOString();
      const amount = Number(target.montant ?? 0);
      const synced = syncAccountProfile(prev, target.userId, (p) => ({
        ...p,
        balance: p.balance + amount,
      }));
      const nextTransactions = prev.transactions.map((t) =>
        t.id === id ? { ...t, statut: 'REUSSI' as const } : t
      );
      return {
        ...prev,
        ...synced,
        transactions: nextTransactions,
        deposits: deriveDepositsFromTransactions(nextTransactions),
        notifications: [
          {
            id: 'notif-' + Date.now(),
            user_id: target.userId,
            title: 'Dépôt validé',
            message: `Votre dépôt de ${formatAR(amount)} a été crédité sur votre solde.`,
            is_read: false,
            created_at: now,
          },
          ...prev.notifications,
        ],
      };
    });
  };

  const rejectDeposit = async (id: string) => {
    setState((prev) => {
      const nextTransactions = prev.transactions.map((t) =>
        t.id === id && t.type === 'DEPOT' && t.statut === 'EN_ATTENTE'
          ? { ...t, statut: 'REFUSE' as const }
          : t
      );
      return {
        ...prev,
        transactions: nextTransactions,
        deposits: deriveDepositsFromTransactions(nextTransactions),
      };
    });
  };

  const approveWithdrawal = async (id: string) => {
    setState((prev) => {
      const target = prev.transactions.find(
        (t) => t.id === id && t.type === 'RETRAIT' && t.statut === 'EN_ATTENTE'
      );
      if (!target) return prev;
      const now = new Date().toISOString();
      const amount = Number(target.montant ?? 0);
      const netAmount = Number(target.montant_net ?? amount);
      const synced = syncAccountProfile(prev, target.userId, (p) => ({
        ...p,
        balance: Math.max(0, p.balance - amount),
        reserved_balance: Math.max(0, p.reserved_balance - amount),
      }));
      const nextTransactions = prev.transactions.map((t) =>
        t.id === id ? { ...t, statut: 'REUSSI' as const } : t
      );
      return {
        ...prev,
        ...synced,
        transactions: nextTransactions,
        withdrawals: deriveWithdrawalsFromTransactions(nextTransactions),
        notifications: [
          {
            id: 'notif-' + Date.now(),
            user_id: target.userId,
            title: 'Retrait approuvé',
            message: `Votre retrait de ${formatAR(netAmount)} net a été envoyé via ${target.operateur}.`,
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
      const target = prev.transactions.find(
        (t) => t.id === id && t.type === 'RETRAIT' && t.statut === 'EN_ATTENTE'
      );
      if (!target) return prev;
      const amount = Number(target.montant ?? 0);
      const synced = syncAccountProfile(prev, target.userId, (p) => ({
        ...p,
        reserved_balance: Math.max(0, p.reserved_balance - amount),
      }));
      const nextTransactions = prev.transactions.map((t) =>
        t.id === id ? { ...t, statut: 'REFUSE' as const } : t
      );
      return {
        ...prev,
        ...synced,
        transactions: nextTransactions,
        withdrawals: deriveWithdrawalsFromTransactions(nextTransactions),
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
        reloadFromStorage,
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
