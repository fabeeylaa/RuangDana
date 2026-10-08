import type { Rupiah } from "./money";

export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";
export type AccountType = "CASH" | "BANK" | "EWALLET" | "SAVINGS";
export type SavingsMethod = "VIRTUAL" | "EXTERNAL";

export interface HealthResponse {
  status: "ok";
  service: string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: Rupiah;
}

export interface Transaction {
  id: string;
  date: string; // ISO yyyy-mm-dd
  description: string;
  category: string;
  type: TransactionType;
  amount: Rupiah; // selalu positif; arah ditentukan oleh `type`
  accountId: string;
  toAccountId?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  method: SavingsMethod;
  target: Rupiah;
  saved: Rupiah;
  targetDate: string;
  note?: string;
}
