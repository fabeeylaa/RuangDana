import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CategoryDto, CategoryKind, TransactionDto, TransactionListResponse, TransactionType } from "@ruangdana/shared";
import { api } from "@/lib/api";

export const typeLabel: Record<TransactionType, string> = { INCOME: "Pemasukan", EXPENSE: "Pengeluaran", TRANSFER: "Transfer" };

export interface TransactionFilters {
  search: string;
  type: "" | TransactionType;
  accountId: string;
  dateFrom: string;
  dateTo: string;
  page: number;
}

export interface TransactionInput {
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  accountId: string;
  toAccountId?: string;
  categoryId?: string;
}

export const PAGE_SIZE = 15;

function toQuery(f: TransactionFilters) {
  const p = new URLSearchParams();
  if (f.search.trim()) p.set("search", f.search.trim());
  if (f.type) p.set("type", f.type);
  if (f.accountId) p.set("accountId", f.accountId);
  if (f.dateFrom) p.set("dateFrom", f.dateFrom);
  if (f.dateTo) p.set("dateTo", f.dateTo);
  p.set("page", String(f.page));
  p.set("pageSize", String(PAGE_SIZE));
  return p.toString();
}

export function useTransactions(filters: TransactionFilters) {
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => api<TransactionListResponse>(`/transactions?${toQuery(filters)}`),
    placeholderData: keepPreviousData,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api<{ categories: CategoryDto[] }>("/categories")).categories,
    staleTime: 5 * 60 * 1000,
  });
}

export const categoriesOfKind = (all: CategoryDto[] | undefined, kind: CategoryKind) => (all ?? []).filter((c) => c.kind === kind);

export function useTransactionMutations() {
  const qc = useQueryClient();
  // Transaksi memengaruhi saldo akun dan angka dasbor, jadi semuanya disegarkan.
  const done = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["transactions"] }),
      qc.invalidateQueries({ queryKey: ["accounts"] }),
      qc.invalidateQueries({ queryKey: ["dashboard"] }),
    ]);
  return {
    create: useMutation({
      mutationFn: (b: TransactionInput) => api<{ transaction: TransactionDto }>("/transactions", { method: "POST", body: b }),
      onSuccess: done,
    }),
    update: useMutation({
      mutationFn: ({ id, ...b }: Partial<Omit<TransactionInput, "type">> & { id: string }) =>
        api<{ transaction: TransactionDto }>(`/transactions/${id}`, { method: "PATCH", body: b }),
      onSuccess: done,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api<void>(`/transactions/${id}`, { method: "DELETE" }),
      onSuccess: done,
    }),
  };
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<import("@ruangdana/shared").DashboardSummary>("/dashboard"),
  });
}
