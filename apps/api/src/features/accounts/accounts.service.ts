import { formatRupiah, MAX_BALANCE, type AccountDto } from "@ruangdana/shared";
import type { AccountRecord, Repos } from "../../db/types";
import { conflict, notFound, unprocessable, UniqueViolation } from "../../lib/errors";

export function toAccountDto(a: AccountRecord, balance: number): AccountDto {
  return {
    id: a.id,
    name: a.name,
    type: a.type,
    openingBalance: a.openingBalance,
    balance,
    archived: a.archivedAt !== null,
    createdAt: a.createdAt.toISOString(),
  };
}

const nameTaken = () => conflict("Kamu sudah punya akun dengan nama itu.", "ACCOUNT_NAME_TAKEN");

export function createAccountsService(repos: Repos) {
  async function mustOwn(userId: string, id: string) {
    const account = await repos.accounts.findOwned(userId, id);
    // Akun milik pengguna lain dan akun yang tidak ada menghasilkan respons yang sama (404).
    if (!account) throw notFound("Akun tidak ditemukan.");
    return account;
  }

  async function dtoFor(userId: string, id: string) {
    const [account, balances] = await Promise.all([mustOwn(userId, id), repos.ledger.balances(userId)]);
    return toAccountDto(account, balances[id] ?? account.openingBalance);
  }

  return {
    async list(userId: string, includeArchived: boolean) {
      const [accounts, balances] = await Promise.all([
        repos.accounts.listByUser(userId, includeArchived),
        repos.ledger.balances(userId),
      ]);
      return accounts.map((a) => toAccountDto(a, balances[a.id] ?? a.openingBalance));
    },

    async create(userId: string, input: { name: string; type: AccountRecord["type"]; openingBalance: number }) {
      try {
        const created = await repos.accounts.create({ userId, ...input });
        return toAccountDto(created, created.openingBalance);
      } catch (err) {
        if (err instanceof UniqueViolation) throw nameTaken();
        throw err;
      }
    },

    async update(
      userId: string,
      id: string,
      input: { name?: string; type?: AccountRecord["type"]; openingBalance?: number },
    ) {
      const account = await mustOwn(userId, id);

      // Saldo awal memengaruhi saldo berjalan, jadi diubah secara atomik dengan akun dikunci.
      if (input.openingBalance !== undefined && input.openingBalance !== account.openingBalance) {
        const newOpening = input.openingBalance;
        await repos.ledger.atomically(userId, [id], async (tx) => {
          const acc = await tx.findAccount(id);
          if (!acc) throw notFound("Akun tidak ditemukan.");
          if (acc.archived) {
            throw unprocessable("Pulihkan akun terlebih dahulu sebelum mengubah saldo awalnya.", "ACCOUNT_ARCHIVED");
          }
          const next = (await tx.balanceOf(id)) - acc.openingBalance + newOpening;
          if (next < 0) {
            throw unprocessable(
              `Saldo awal ini membuat saldo akun menjadi negatif (${formatRupiah(next)}) karena sudah ada transaksi.`,
              "INSUFFICIENT_BALANCE",
            );
          }
          if (next > MAX_BALANCE) throw unprocessable("Saldo akun melebihi batas yang didukung.", "BALANCE_LIMIT");
          await tx.setOpeningBalance(id, newOpening);
        });
      }

      if (input.name !== undefined || input.type !== undefined) {
        try {
          const updated = await repos.accounts.update(userId, id, { name: input.name, type: input.type });
          if (!updated) throw notFound("Akun tidak ditemukan.");
        } catch (err) {
          if (err instanceof UniqueViolation) throw nameTaken();
          throw err;
        }
      }
      return dtoFor(userId, id);
    },

    /**
     * Akun diarsipkan, tidak dihapus, agar riwayat transaksi tetap utuh (aturan #12).
     * Akun yang masih bersaldo tidak boleh diarsipkan supaya uang tidak "hilang" dari total aset.
     */
    async setArchived(userId: string, id: string, archived: boolean) {
      await mustOwn(userId, id);
      await repos.ledger.atomically(userId, [id], async (tx) => {
        const acc = await tx.findAccount(id);
        if (!acc) throw notFound("Akun tidak ditemukan.");
        if (archived && (await tx.balanceOf(id)) !== 0) {
          throw unprocessable(
            "Akun masih memiliki saldo. Pindahkan saldonya ke akun lain (transfer) sebelum mengarsipkan.",
            "ACCOUNT_HAS_BALANCE",
          );
        }
        await tx.setArchived(id, archived ? new Date() : null);
      });
      return dtoFor(userId, id);
    },
  };
}

export type AccountsService = ReturnType<typeof createAccountsService>;
