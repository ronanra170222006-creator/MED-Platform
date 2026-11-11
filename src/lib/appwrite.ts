import { Account, Client, Databases, ID, Query } from 'appwrite';

export const APPWRITE_CONFIG = {
  endpoint: 'https://appwrite.io',
  projectId: 'storage',
  databaseId: 'med_db',
  usersCollectionId: 'users',
  transactionsCollectionId: 'transactions',
} as const;

const client = new Client()
  .setEndpoint(APPWRITE_CONFIG.endpoint)
  .setProject(APPWRITE_CONFIG.projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export { ID, Query };

export function phoneToAuthEmail(phone: string): string {
  const clean = phone.replace(/[^0-9]/g, '');
  return `${clean}@med-invest.mg`;
}
