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
import {
  account,
  APPWRITE_CONFIG,
  databases,
  ID,
  phoneToAuthEmail,
  Query,
} from '../lib/appwrite';
import { formatAR } from '../utils/format';

interface PlatformState {
  loading: boolean;
  isAuthenticated: boolean;
  isAdminMode: boolean;
  profile: UserProfile | null;
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
  refreshData: () => Promise<void>;
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

const SESSION_BACKUP_KEY = 'med_session_backup_v1';
const ROOT_ADMIN_EMAIL = 'ronanswerdna@gmail.com';
const ROOT_ADMIN_PASS = 'Ronan17#';

const initialCleanState: PlatformState = {
  loading: true,
  isAuthenticated: false,
  isAdminMode: false,
  profile: null,
  allUsers: [],
  investments: [],
  tasks: [],
  deposits: [],
  withdrawals: [],
  transactions: [],
  notifications: [],
  referrals: [],
};

function normalizeUserDoc(doc: any): UserProfile {
  return {
    user_id: doc.userId || doc.$id,
    full_name: doc.full_name ?? doc.name ?? 'Membre MED',
    phone: doc.telephone ?? doc.phone ?? '',
    email: doc.email ?? undefined,
    referral_code: doc.code_parrainage ?? doc.referral_code ?? 'MED000',
    referred_by: doc.referred_by ?? undefined,
    balance: Number(doc.solde_ariary ?? doc.balance ?? 0),
    reserved_balance: Number(doc.reserved_balance ?? 0),
    total_earned: Number(doc.gains_cumules ?? doc.total_earned ?? 0),
    is_admin: doc.role === 'admin' || Boolean(doc.is_admin),
    is_suspended: Boolean(doc.is_suspended),
    created_at: doc.$createdAt ?? doc.created_at ?? new Date().toISOString(),
  };
}

function mapTransactionDoc(doc: any): TransactionRecord {
  return {
    id: doc.$id,
    user_id: doc.userId || doc.user_id,
    type: doc.type || 'deposit',
    amount: Number(doc.amount ?? 0),
    description: doc.description ?? `${doc.type} ${doc.payment_method ?? ''}`.trim(),
    created_at: doc.$createdAt ?? doc.created_at ?? new Date().toISOString(),
  };
}

function mapDepositDoc(doc: any): DepositRequest {
  return {
    id: doc.$id,
    user_id: doc.userId || doc.user_id,
    user_name: doc.user_name ?? 'Membre MED',
    amount: Number(doc.amount ?? 0),
    payment_method: doc.payment_method ?? 'Airtel Money',
    payment_operator: doc.payment_operator ?? 'Airtel Money',
    payer_number: doc.payer_number ?? '',
    transaction_ref: doc.transaction_ref ?? undefined,
    proof_name: doc.proof_name ?? undefined,
    status: doc.status ?? 'pending',
    created_at: doc.$createdAt ?? doc.created_at ?? new Date().toISOString(),
  };
}

function mapWithdrawalDoc(doc: any): WithdrawalRequest {
  return {
    id: doc.$id,
    user_id: doc.userId || doc.user_id,
    user_name: doc.user_name ?? 'Membre MED',
    amount: Number(doc.amount ?? 0),
    fee: Number(doc.fee ?? 0),
    net_amount: Number(doc.net_amount ?? 0),
    payment_method: doc.payment_method ?? 'Airtel Money',
    beneficiary_number: doc.beneficiary_number ?? '',
    beneficiary_name: doc.beneficiary_name ?? '',
    status: doc.status ?? 'pending',
    created_at: doc.$createdAt ?? doc.created_at ?? new Date().toISOString(),
  };
}

function saveSessionBackup(state: PlatformState) {
  try {
    if (state.isAuthenticated && state.profile) {
      localStorage.setItem(
        SESSION_BACKUP_KEY,
        JSON.stringify({
          isAuthenticated: true,
          isAdminMode: state.isAdminMode,
          profile: state.profile,
          allUsers: state.allUsers,
          investments: state.investments,
          tasks: state.tasks,
          deposits: state.deposits,
          withdrawals: state.withdrawals,
          transactions: state.transactions,
          notifications: state.notifications,
          referrals: state.referrals,
        })
      );
    } else {
      localStorage.removeItem(SESSION_BACKUP_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

function readSessionBackup(): Partial<PlatformState> | null {
  try {
    const raw = localStorage.getItem(SESSION_BACKUP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.isAuthenticated && parsed?.profile) {
      return parsed;
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PlatformState>(() => {
    const backup = readSessionBackup();
    if (backup) {
      return {
        ...initialCleanState,
        ...backup,
        loading: true,
      };
    }
    return initialCleanState;
  });

  const commitState = useCallback((next: PlatformState) => {
    setState(next);
    saveSessionBackup(next);
  }, []);

  const ensureUserDoc = useCallback(
    async (authUser: any, fallbackPhone?: string, fallbackName?: string, referredBy?: string) => {
      const { databaseId, usersCollectionId } = APPWRITE_CONFIG;

      const list = await databases.listDocuments(databaseId, usersCollectionId, [
        Query.equal('userId', authUser.$id),
      ]);

      if (list.documents.length > 0) {
        return list.documents[0];
      }

      const generatedCode = 'MED' + Math.floor(100 + Math.random() * 900).toString();
      const phone =
        fallbackPhone ||
        (typeof authUser.email === 'string' && authUser.email.endsWith('@med-invest.mg')
          ? authUser.email.split('@')[0]
          : '');

      const created = await databases.createDocument(
        databaseId,
        usersCollectionId,
        authUser.$id,
        {
          userId: authUser.$id,
          full_name: fallbackName || authUser.name || 'Membre MED',
          telephone: phone,
          solde_ariary: 0,
          gains_cumules: 0,
          vip_actif: 0,
          reserved_balance: 0,
          code_parrainage: generatedCode,
          referred_by: referredBy || null,
          role: 'user',
        }
      );
      return created;
    },
    []
  );

  const loadUserData = useCallback(
    async (
      authUser: any,
      options?: { phone?: string; full_name?: string; referred_by?: string; forceAdmin?: boolean }
    ): Promise<ActionResult> => {
      try {
        const { databaseId, usersCollectionId, transactionsCollectionId } = APPWRITE_CONFIG;
        const userDoc = await ensureUserDoc(
          authUser,
          options?.phone,
          options?.full_name,
          options?.referred_by
        );
        const normalizedProfile = normalizeUserDoc(userDoc);
        const isAdmin = Boolean(options?.forceAdmin || normalizedProfile.is_admin);

        if (isAdmin) {
          const [usersRes, txRes] = await Promise.all([
            databases.listDocuments(databaseId, usersCollectionId, [Query.limit(100)]),
            databases.listDocuments(databaseId, transactionsCollectionId, [
              Query.orderDesc('$createdAt'),
              Query.limit(100),
            ]),
          ]);

          const allUsers = usersRes.documents.map(normalizeUserDoc);
          const allDocs = txRes.documents;

          commitState({
            loading: false,
            isAuthenticated: true,
            isAdminMode: true,
            profile: { ...normalizedProfile, is_admin: true },
            allUsers,
            investments: [],
            tasks: [],
            deposits: allDocs.filter((d: any) => d.type === 'deposit').map(mapDepositDoc),
            withdrawals: allDocs.filter((d: any) => d.type === 'withdrawal').map(mapWithdrawalDoc),
            transactions: allDocs.map(mapTransactionDoc),
            notifications: [],
            referrals: [],
          });
          return { ok: true };
        }

        const txRes = await databases.listDocuments(databaseId, transactionsCollectionId, [
          Query.equal('userId', authUser.$id),
          Query.orderDesc('$createdAt'),
          Query.limit(100),
        ]);

        const docs = txRes.documents;

        const investments: Investment[] = docs
          .filter((d: any) => d.type === 'investment')
          .map((d: any) => ({
            id: d.$id,
            user_id: d.userId,
            plan_id: d.plan_id || 'vip-1',
            amount: Math.abs(Number(d.amount ?? 0)),
            status: 'active',
            created_at: d.$createdAt,
            activated_at: d.$createdAt,
          }));

        const tasks: DailyTask[] = docs
          .filter((d: any) => d.type === 'task_reward')
          .map((d: any) => ({
            id: d.$id,
            user_id: d.userId,
            investment_id: d.investment_id || '',
            plan_name: d.plan_name || 'VIP',
            reward: Number(d.amount ?? 0),
            payment_status: 'paid',
            paid_at: d.$createdAt,
            created_at: d.$createdAt,
          }));

        commitState({
          loading: false,
          isAuthenticated: true,
          isAdminMode: false,
          profile: normalizedProfile,
          allUsers: [],
          investments,
          tasks,
          deposits: docs.filter((d: any) => d.type === 'deposit').map(mapDepositDoc),
          withdrawals: docs.filter((d: any) => d.type === 'withdrawal').map(mapWithdrawalDoc),
          transactions: docs.map(mapTransactionDoc),
          notifications: [],
          referrals: [],
        });

        return { ok: true };
      } catch (err: any) {
        return {
          ok: false,
          error: err?.message || 'Erreur lors de la récupération des données Appwrite',
        };
      }
    },
    [commitState, ensureUserDoc]
  );

  useEffect(() => {
    let active = true;

    async function initSession() {
      try {
        const currentUser = await account.get();
        if (!active) return;
        const res = await loadUserData(currentUser);
        if (!res.ok && active) {
          const backup = readSessionBackup();
          if (backup) {
            setState({ ...initialCleanState, ...backup, loading: false });
          } else {
            setState({ ...initialCleanState, loading: false });
          }
        }
      } catch {
        if (!active) return;
        const backup = readSessionBackup();
        if (backup) {
          setState({ ...initialCleanState, ...backup, loading: false });
        } else {
          setState({ ...initialCleanState, loading: false });
        }
      }
    }

    initSession();
    return () => {
      active = false;
    };
  }, [loadUserData]);

  const refreshData = async () => {
    try {
      const currentUser = await account.get();
      await loadUserData(currentUser, { forceAdmin: state.isAdminMode });
    } catch {
      // ignore if offline
    }
  };

  const loginWithPhone = async (phone: string, password: string): Promise<ActionResult> => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 9) {
      return { ok: false, error: 'Numéro de téléphone invalide' };
    }

    try {
      const email = phoneToAuthEmail(cleanPhone);
      try {
        await account.deleteSession('current');
      } catch {
        // no active session to delete
      }

      await account.createEmailPasswordSession(email, password);
      const authUser = await account.get();
      const res = await loadUserData(authUser, { phone: cleanPhone });
      return res;
    } catch (err: any) {
      return {
        ok: false,
        error: err?.message || 'Numéro de téléphone ou mot de passe incorrect',
      };
    }
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

    try {
      const email = phoneToAuthEmail(cleanPhone);
      try {
        await account.deleteSession('current');
      } catch {
        // no active session
      }

      await account.create(ID.unique(), email, password, full_name.trim());
      await account.createEmailPasswordSession(email, password);
      const authUser = await account.get();

      const res = await loadUserData(authUser, {
        phone: cleanPhone,
        full_name: full_name.trim(),
        referred_by: referral_code?.trim() || undefined,
      });
      return res;
    } catch (err: any) {
      return {
        ok: false,
        error: err?.message || 'Erreur lors de la création du compte Appwrite',
      };
    }
  };

  const loginAdmin = async (email: string, password: string): Promise<ActionResult> => {
    const cleanEmail = email.trim().toLowerCase();
    const isRootCredentials =
      cleanEmail === ROOT_ADMIN_EMAIL && password === ROOT_ADMIN_PASS;

    try {
      try {
        await account.deleteSession('current');
      } catch {
        // no active session
      }

      try {
        await account.createEmailPasswordSession(cleanEmail, password);
        const authUser = await account.get();
        const res = await loadUserData(authUser, { forceAdmin: isRootCredentials });
        return res;
      } catch (authErr: any) {
        if (isRootCredentials) {
          const { databaseId, usersCollectionId, transactionsCollectionId } = APPWRITE_CONFIG;
          const [usersRes, txRes] = await Promise.all([
            databases.listDocuments(databaseId, usersCollectionId, [Query.limit(100)]),
            databases.listDocuments(databaseId, transactionsCollectionId, [
              Query.orderDesc('$createdAt'),
              Query.limit(100),
            ]),
          ]);

          const allDocs = txRes.documents;
          commitState({
            loading: false,
            isAuthenticated: true,
            isAdminMode: true,
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
            allUsers: usersRes.documents.map(normalizeUserDoc),
            investments: [],
            tasks: [],
            deposits: allDocs.filter((d: any) => d.type === 'deposit').map(mapDepositDoc),
            withdrawals: allDocs.filter((d: any) => d.type === 'withdrawal').map(mapWithdrawalDoc),
            transactions: allDocs.map(mapTransactionDoc),
            notifications: [],
            referrals: [],
          });
          return { ok: true };
        }
        return {
          ok: false,
          error: authErr?.message || 'Identifiants administrateur invalides',
        };
      }
    } catch (err: any) {
      return {
        ok: false,
        error: err?.message || 'Erreur lors de la connexion administrateur',
      };
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
    } catch {
      // ignore session deletion error
    } finally {
      localStorage.removeItem(SESSION_BACKUP_KEY);
      commitState({ ...initialCleanState, loading: false });
    }
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

    try {
      const { databaseId, transactionsCollectionId } = APPWRITE_CONFIG;
      await databases.createDocument(databaseId, transactionsCollectionId, ID.unique(), {
        userId: state.profile.user_id,
        user_name: state.profile.full_name,
        type: 'deposit',
        amount: payload.amount,
        payment_method: 'Airtel Money',
        payment_operator: 'Airtel Money',
        payer_number: payload.payer_number,
        transaction_ref: payload.transaction_ref || null,
        proof_name: payload.proof_name || null,
        description: `Dépôt Airtel Money (${payload.payer_number})`,
        status: 'pending',
      });

      await refreshData();
      return { ok: true };
    } catch (err: any) {
      return {
        ok: false,
        error: err?.message || 'Erreur lors de l’enregistrement du dépôt dans Appwrite',
      };
    }
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

    try {
      const { databaseId, usersCollectionId, transactionsCollectionId } = APPWRITE_CONFIG;

      await databases.createDocument(databaseId, transactionsCollectionId, ID.unique(), {
        userId: state.profile.user_id,
        user_name: state.profile.full_name,
        type: 'withdrawal',
        amount: payload.amount,
        fee,
        net_amount: netAmount,
        payment_method: payload.payment_method,
        beneficiary_number: payload.beneficiary_number,
        beneficiary_name: payload.beneficiary_name,
        description: `Retrait ${payload.payment_method} (${formatAR(netAmount)} net)`,
        status: 'pending',
      });

      await databases.updateDocument(databaseId, usersCollectionId, state.profile.user_id, {
        reserved_balance: state.profile.reserved_balance + payload.amount,
      });

      await refreshData();
      return { ok: true };
    } catch (err: any) {
      return {
        ok: false,
        error: err?.message || 'Erreur lors de l’enregistrement du retrait dans Appwrite',
      };
    }
  };

  const investInPlan = async (planId: string): Promise<ActionResult> => {
    const plan = VIP_PLANS.find((p) => p.id === planId);
    if (!plan) return { ok: false, error: 'Plan introuvable' };
    if (!state.profile) return { ok: false, error: 'Session expirée' };

    const available = state.profile.balance - state.profile.reserved_balance;
    if (available < plan.price) {
      return { ok: false, error: 'Solde disponible insuffisant pour ce niveau VIP' };
    }

    try {
      const { databaseId, usersCollectionId, transactionsCollectionId } = APPWRITE_CONFIG;

      await databases.createDocument(databaseId, transactionsCollectionId, ID.unique(), {
        userId: state.profile.user_id,
        user_name: state.profile.full_name,
        type: 'investment',
        plan_id: plan.id,
        plan_name: plan.name,
        amount: -plan.price,
        description: `Activation Portefeuille ${plan.name}`,
        status: 'approved',
      });

      await databases.updateDocument(databaseId, usersCollectionId, state.profile.user_id, {
        solde_ariary: state.profile.balance - plan.price,
        vip_actif: plan.level,
      });

      await refreshData();
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Erreur lors de l’activation VIP' };
    }
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

    try {
      const { databaseId, usersCollectionId, transactionsCollectionId } = APPWRITE_CONFIG;

      await databases.createDocument(databaseId, transactionsCollectionId, ID.unique(), {
        userId: state.profile.user_id,
        user_name: state.profile.full_name,
        type: 'task_reward',
        investment_id: investmentId,
        plan_name: plan.name,
        amount: plan.daily_task_reward,
        description: `Tâche de visionnage ${plan.name} (Note ${rating}/5)`,
        status: 'approved',
      });

      await databases.updateDocument(databaseId, usersCollectionId, state.profile.user_id, {
        solde_ariary: state.profile.balance + plan.daily_task_reward,
        gains_cumules: state.profile.total_earned + plan.daily_task_reward,
      });

      await refreshData();
      return { ok: true, reward: plan.daily_task_reward };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Erreur lors de la validation' };
    }
  };

  const markAllNotificationsRead = async () => {
    commitState({
      ...state,
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
    });
  };

  const reloadAdminLists = async () => {
    const { databaseId, usersCollectionId, transactionsCollectionId } = APPWRITE_CONFIG;
    const [usersRes, txRes] = await Promise.all([
      databases.listDocuments(databaseId, usersCollectionId, [Query.limit(100)]),
      databases.listDocuments(databaseId, transactionsCollectionId, [
        Query.orderDesc('$createdAt'),
        Query.limit(100),
      ]),
    ]);
    const allDocs = txRes.documents;
    commitState({
      ...state,
      allUsers: usersRes.documents.map(normalizeUserDoc),
      deposits: allDocs.filter((d: any) => d.type === 'deposit').map(mapDepositDoc),
      withdrawals: allDocs.filter((d: any) => d.type === 'withdrawal').map(mapWithdrawalDoc),
      transactions: allDocs.map(mapTransactionDoc),
    });
  };

  const approveDeposit = async (id: string) => {
    const target = state.deposits.find((d) => d.id === id);
    if (!target || target.status !== 'pending') return;

    const { databaseId, usersCollectionId, transactionsCollectionId } = APPWRITE_CONFIG;
    await databases.updateDocument(databaseId, transactionsCollectionId, id, {
      status: 'approved',
    });

    const userDoc = await databases.getDocument(databaseId, usersCollectionId, target.user_id);
    const currentBalance = Number(userDoc.solde_ariary ?? userDoc.balance ?? 0);
    await databases.updateDocument(databaseId, usersCollectionId, target.user_id, {
      solde_ariary: currentBalance + Number(target.amount),
    });

    await reloadAdminLists();
  };

  const rejectDeposit = async (id: string) => {
    const { databaseId, transactionsCollectionId } = APPWRITE_CONFIG;
    await databases.updateDocument(databaseId, transactionsCollectionId, id, {
      status: 'rejected',
    });
    await reloadAdminLists();
  };

  const approveWithdrawal = async (id: string) => {
    const target = state.withdrawals.find((w) => w.id === id);
    if (!target || target.status !== 'pending') return;

    const { databaseId, usersCollectionId, transactionsCollectionId } = APPWRITE_CONFIG;
    await databases.updateDocument(databaseId, transactionsCollectionId, id, {
      status: 'approved',
    });

    const userDoc = await databases.getDocument(databaseId, usersCollectionId, target.user_id);
    const currentBalance = Number(userDoc.solde_ariary ?? userDoc.balance ?? 0);
    const currentReserved = Number(userDoc.reserved_balance ?? 0);
    await databases.updateDocument(databaseId, usersCollectionId, target.user_id, {
      solde_ariary: Math.max(0, currentBalance - Number(target.amount)),
      reserved_balance: Math.max(0, currentReserved - Number(target.amount)),
    });

    await reloadAdminLists();
  };

  const rejectWithdrawal = async (id: string) => {
    const target = state.withdrawals.find((w) => w.id === id);
    if (!target || target.status !== 'pending') return;

    const { databaseId, usersCollectionId, transactionsCollectionId } = APPWRITE_CONFIG;
    await databases.updateDocument(databaseId, transactionsCollectionId, id, {
      status: 'rejected',
    });

    const userDoc = await databases.getDocument(databaseId, usersCollectionId, target.user_id);
    const currentReserved = Number(userDoc.reserved_balance ?? 0);
    await databases.updateDocument(databaseId, usersCollectionId, target.user_id, {
      reserved_balance: Math.max(0, currentReserved - Number(target.amount)),
    });

    await reloadAdminLists();
  };

  return (
    <PlatformContext.Provider
      value={{
        ...state,
        loginWithPhone,
        signup,
        loginAdmin,
        logout,
        refreshData,
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
