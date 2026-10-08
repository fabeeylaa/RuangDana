import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AccountDto, AccountType } from "@ruangdana/shared";
import { api } from "@/lib/api";

export const accountTypeLabel: Record<AccountType, string> = {
  CASH: "Tunai",
  BANK: "Rekening bank",
  EWALLET: "E-wallet",
  SAVINGS: "Rekening tabungan",
};

export interface AccountInput {
  name: string;
  type: AccountType;
  openingBalance: number;
}

export function useAccounts(includeArchived: boolean) {
  return useQuery({
    queryKey: ["accounts", { includeArchived }],
    queryFn: async () => (await api<{ accounts: AccountDto[] }>(`/accounts${includeArchived ? "?archived=true" : ""}`)).accounts,
  });
}

export function useAccountMutations() {
  const qc = useQueryClient();
  const done = () => qc.invalidateQueries({ queryKey: ["accounts"] });
  return {
    create: useMutation({ mutationFn: (b: AccountInput) => api<{ account: AccountDto }>("/accounts", { method: "POST", body: b }), onSuccess: done }),
    update: useMutation({
      mutationFn: ({ id, ...b }: Partial<AccountInput> & { id: string }) => api<{ account: AccountDto }>(`/accounts/${id}`, { method: "PATCH", body: b }),
      onSuccess: done,
    }),
    setArchived: useMutation({
      mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
        api<{ account: AccountDto }>(`/accounts/${id}/${archived ? "archive" : "unarchive"}`, { method: "POST" }),
      onSuccess: done,
    }),
  };
}
