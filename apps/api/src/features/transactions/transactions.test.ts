import { describe, expect, it } from "vitest";
import { makeTestApp, registerUser } from "../../testing/helpers";

type Agent = Awaited<ReturnType<typeof registerUser>>["agent"];

async function setup(email: string) {
  const app = makeTestApp();
  const { agent } = await registerUser(app, email);
  return { app, agent, ...(await seed(agent)) };
}

async function seed(agent: Agent) {
  const bank = (await agent.post("/api/accounts").send({ name: "Bank", type: "BANK", openingBalance: 1_000_000 })).body.account;
  const cash = (await agent.post("/api/accounts").send({ name: "Tunai", type: "CASH", openingBalance: 0 })).body.account;
  const cats = (await agent.get("/api/categories")).body.categories as Array<{ id: string; kind: string; name: string }>;
  const income = cats.find((c) => c.kind === "INCOME")!;
  const expense = cats.find((c) => c.kind === "EXPENSE")!;
  return { bank, cash, income, expense };
}

const today = new Date().toISOString().slice(0, 10);
const balanceOf = async (agent: Agent, id: string) =>
  ((await agent.get("/api/accounts")).body.accounts as Array<{ id: string; balance: number }>).find((a) => a.id === id)!.balance;
const totalAssets = async (agent: Agent) => (await agent.get("/api/dashboard")).body.totalAssets as number;

describe("transaksi & saldo", () => {
  it("pemasukan dan pengeluaran mengubah saldo; transfer tidak mengubah total aset", async () => {
    const { agent, bank, cash, income, expense } = await setup("t1@example.com");
    expect((await agent.post("/api/transactions").send({ type: "INCOME", amount: 500_000, date: today, accountId: bank.id, categoryId: income.id })).status).toBe(201);
    expect((await agent.post("/api/transactions").send({ type: "EXPENSE", amount: 200_000, date: today, accountId: bank.id, categoryId: expense.id })).status).toBe(201);
    expect(await balanceOf(agent, bank.id)).toBe(1_300_000);
    expect(await totalAssets(agent)).toBe(1_300_000);

    const tr = await agent.post("/api/transactions").send({ type: "TRANSFER", amount: 300_000, date: today, accountId: bank.id, toAccountId: cash.id });
    expect(tr.status).toBe(201);
    expect(await balanceOf(agent, bank.id)).toBe(1_000_000);
    expect(await balanceOf(agent, cash.id)).toBe(300_000);
    expect(await totalAssets(agent)).toBe(1_300_000);

    const dash = (await agent.get("/api/dashboard")).body;
    expect(dash.monthIncome).toBe(500_000);
    expect(dash.monthExpense).toBe(200_000);
  });

  it("menolak pengeluaran/transfer yang membuat saldo negatif", async () => {
    const { agent, bank, cash, expense } = await setup("t2@example.com");
    const e = await agent.post("/api/transactions").send({ type: "EXPENSE", amount: 1_000_001, date: today, accountId: bank.id, categoryId: expense.id });
    expect(e.status).toBe(422);
    expect(e.body.code).toBe("INSUFFICIENT_BALANCE");
    const t = await agent.post("/api/transactions").send({ type: "TRANSFER", amount: 1_000_001, date: today, accountId: bank.id, toAccountId: cash.id });
    expect(t.status).toBe(422);
    expect(await balanceOf(agent, bank.id)).toBe(1_000_000);
    expect((await agent.get("/api/transactions")).body.total).toBe(0);
  });

  it("validasi input: desimal, nol, tanggal palsu, kategori salah jenis, transfer ke akun sama", async () => {
    const { agent, bank, income, expense } = await setup("t3@example.com");
    const base = { type: "EXPENSE", amount: 1000, date: today, accountId: bank.id, categoryId: expense.id };
    const bad: Array<Record<string, unknown>> = [
      { ...base, amount: 10.5 },
      { ...base, amount: 0 },
      { ...base, amount: -5 },
      { ...base, amount: "1000" },
      { ...base, amount: 2e12 },
      { ...base, date: "2026-02-31" },
      { ...base, date: "kemarin" },
      { ...base, type: "LAINNYA" },
      { ...base, categoryId: "bukan-uuid" },
    ];
    for (const body of bad) expect((await agent.post("/api/transactions").send(body)).status, JSON.stringify(body)).toBe(400);

    const wrongKind = await agent.post("/api/transactions").send({ ...base, categoryId: income.id });
    expect(wrongKind.status).toBeGreaterThanOrEqual(400);
    expect(wrongKind.status).toBeLessThan(500);
    const same = await agent.post("/api/transactions").send({ type: "TRANSFER", amount: 1000, date: today, accountId: bank.id, toAccountId: bank.id });
    expect(same.status).toBeGreaterThanOrEqual(400);
    expect(same.status).toBeLessThan(500);
    expect((await agent.get("/api/transactions")).body.total).toBe(0);
  });

  it("mengedit transaksi menghitung ulang saldo, dan jenis tidak bisa diubah", async () => {
    const { agent, bank, expense } = await setup("t4@example.com");
    const { body } = await agent.post("/api/transactions").send({ type: "EXPENSE", amount: 100_000, date: today, accountId: bank.id, categoryId: expense.id });
    const id = body.transaction.id;
    expect(await balanceOf(agent, bank.id)).toBe(900_000);

    const up = await agent.patch(`/api/transactions/${id}`).send({ amount: 400_000, description: "Revisi" });
    expect(up.status).toBe(200);
    expect(up.body.transaction).toMatchObject({ amount: 400_000, description: "Revisi" });
    expect(await balanceOf(agent, bank.id)).toBe(600_000);

    const over = await agent.patch(`/api/transactions/${id}`).send({ amount: 1_000_001 });
    expect(over.status).toBe(422);
    expect(await balanceOf(agent, bank.id)).toBe(600_000);

    expect((await agent.patch(`/api/transactions/${id}`).send({})).status).toBe(400);
    expect((await agent.patch(`/api/transactions/${id}`).send({ type: "INCOME" })).status).toBe(400);
  });

  it("hapus bersifat soft delete dan mengembalikan saldo", async () => {
    const { agent, bank, expense } = await setup("t5@example.com");
    const { body } = await agent.post("/api/transactions").send({ type: "EXPENSE", amount: 250_000, date: today, accountId: bank.id, categoryId: expense.id });
    expect((await agent.delete(`/api/transactions/${body.transaction.id}`)).status).toBe(204);
    expect(await balanceOf(agent, bank.id)).toBe(1_000_000);
    expect((await agent.get("/api/transactions")).body.total).toBe(0);
    expect((await agent.delete(`/api/transactions/${body.transaction.id}`)).status).toBe(404);
  });

  it("tidak boleh menghapus pemasukan yang uangnya sudah terpakai", async () => {
    const { agent, cash, income, expense } = await setup("t6@example.com");
    const inc = await agent.post("/api/transactions").send({ type: "INCOME", amount: 100_000, date: today, accountId: cash.id, categoryId: income.id });
    await agent.post("/api/transactions").send({ type: "EXPENSE", amount: 80_000, date: today, accountId: cash.id, categoryId: expense.id });
    const del = await agent.delete(`/api/transactions/${inc.body.transaction.id}`);
    expect(del.status).toBe(422);
    expect(del.body.code).toBe("BALANCE_WOULD_BE_NEGATIVE");
    expect(await balanceOf(agent, cash.id)).toBe(20_000);
  });

  it("akun diarsipkan: harus berisaldo nol, dan tidak bisa menerima transaksi", async () => {
    const { agent, bank, cash, expense } = await setup("t7@example.com");
    const withBalance = await agent.post(`/api/accounts/${bank.id}/archive`);
    expect(withBalance.status).toBe(422);
    expect(withBalance.body.code).toBe("ACCOUNT_HAS_BALANCE");

    expect((await agent.post(`/api/accounts/${cash.id}/archive`)).status).toBe(200);
    const toArchived = await agent.post("/api/transactions").send({ type: "TRANSFER", amount: 1000, date: today, accountId: bank.id, toAccountId: cash.id });
    expect(toArchived.status).toBeGreaterThanOrEqual(400);
    expect(toArchived.status).toBeLessThan(500);
    expect(await balanceOf(agent, bank.id)).toBe(1_000_000);
    void expense;
  });

  it("mengubah saldo awal tidak boleh membuat saldo negatif", async () => {
    const { agent, bank, expense } = await setup("t8@example.com");
    await agent.post("/api/transactions").send({ type: "EXPENSE", amount: 600_000, date: today, accountId: bank.id, categoryId: expense.id });
    const bad = await agent.patch(`/api/accounts/${bank.id}`).send({ name: "Bank", openingBalance: 500_000 });
    expect(bad.status).toBe(422);
    const ok = await agent.patch(`/api/accounts/${bank.id}`).send({ name: "Bank", openingBalance: 700_000 });
    expect(ok.status).toBe(200);
    expect(await balanceOf(agent, bank.id)).toBe(100_000);
  });

  it("filter dan paginasi", async () => {
    const { agent, bank, cash, income, expense } = await setup("t9@example.com");
    for (let i = 1; i <= 5; i++)
      await agent.post("/api/transactions").send({ type: "EXPENSE", amount: 1000 * i, date: `2026-03-0${i}`, description: i === 2 ? "Kopi pagi" : "Lain", accountId: bank.id, categoryId: expense.id });
    await agent.post("/api/transactions").send({ type: "INCOME", amount: 9000, date: "2026-03-10", accountId: cash.id, categoryId: income.id });

    expect((await agent.get("/api/transactions?type=INCOME")).body.total).toBe(1);
    expect((await agent.get(`/api/transactions?accountId=${cash.id}`)).body.total).toBe(1);
    expect((await agent.get("/api/transactions?search=kopi")).body.total).toBe(1);
    expect((await agent.get("/api/transactions?dateFrom=2026-03-02&dateTo=2026-03-04")).body.total).toBe(3);

    const p1 = (await agent.get("/api/transactions?pageSize=4&page=1")).body;
    const p2 = (await agent.get("/api/transactions?pageSize=4&page=2")).body;
    expect(p1.total).toBe(6);
    expect(p1.transactions).toHaveLength(4);
    expect(p2.transactions).toHaveLength(2);
    expect(p1.transactions[0].date >= p1.transactions[3].date).toBe(true);
    expect((await agent.get("/api/transactions?pageSize=1000")).status).toBe(400);
  });

  it("ISOLASI: pengguna lain tidak bisa membaca/ubah/hapus atau memakai akun & kategori milikmu", async () => {
    const { app, agent: alice, bank, expense } = await setup("alice-t@example.com");
    const { agent: mallory } = await registerUser(app, "mallory-t@example.com");
    const mine = await seed(mallory);
    const tx = (await alice.post("/api/transactions").send({ type: "EXPENSE", amount: 5000, date: today, accountId: bank.id, categoryId: expense.id })).body.transaction;

    expect((await mallory.get("/api/transactions")).body.total).toBe(0);
    expect((await mallory.patch(`/api/transactions/${tx.id}`).send({ amount: 1 })).status).toBe(404);
    expect((await mallory.delete(`/api/transactions/${tx.id}`)).status).toBe(404);

    // memakai akun Alice atau kategori Alice dari akun Mallory
    const a = await mallory.post("/api/transactions").send({ type: "EXPENSE", amount: 1000, date: today, accountId: bank.id, categoryId: mine.expense.id });
    expect([400, 404, 422]).toContain(a.status);
    const c = await mallory.post("/api/transactions").send({ type: "EXPENSE", amount: 1000, date: today, accountId: mine.bank.id, categoryId: expense.id });
    expect([400, 404, 422]).toContain(c.status);
    const t = await mallory.post("/api/transactions").send({ type: "TRANSFER", amount: 1000, date: today, accountId: mine.bank.id, toAccountId: bank.id });
    expect([400, 404, 422]).toContain(t.status);

    expect(await balanceOf(alice, bank.id)).toBe(995_000);
    expect(await balanceOf(mallory, mine.bank.id)).toBe(1_000_000);
    expect((await mallory.get(`/api/transactions?accountId=${bank.id}`)).body.total).toBe(0);
  });

  it("konkurensi: dua pengeluaran serentak, hanya satu yang boleh lolos", async () => {
    const { agent, bank, expense } = await setup("t10@example.com");
    const send = () => agent.post("/api/transactions").send({ type: "EXPENSE", amount: 700_000, date: today, accountId: bank.id, categoryId: expense.id });
    const results = await Promise.all([send(), send()]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 422]);
    expect(await balanceOf(agent, bank.id)).toBe(300_000);
  });

  it("memerlukan login", async () => {
    const app = makeTestApp();
    const { agentFor } = await import("../../testing/helpers");
    const anon = agentFor(app);
    expect((await anon.get("/api/transactions")).status).toBe(401);
    expect((await anon.get("/api/dashboard")).status).toBe(401);
    expect((await anon.get("/api/categories")).status).toBe(401);
  });
});

describe("kategori & dasbor", () => {
  it("kategori bawaan dibuat per pengguna dan bisa ditambah", async () => {
    const { agent } = await setup("c1@example.com");
    const list = (await agent.get("/api/categories")).body.categories;
    expect(list.length).toBeGreaterThanOrEqual(10);
    const created = await agent.post("/api/categories").send({ name: "Hobi", kind: "EXPENSE" });
    expect(created.status).toBe(201);
    expect((await agent.post("/api/categories").send({ name: "Hobi", kind: "EXPENSE" })).status).toBe(409);
    expect((await agent.post("/api/categories").send({ name: "", kind: "EXPENSE" })).status).toBe(400);
  });

  it("dasbor: rincian pengeluaran per kategori dan tren 6 bulan", async () => {
    const { agent, bank, expense } = await setup("d1@example.com");
    await agent.post("/api/transactions").send({ type: "EXPENSE", amount: 30_000, date: today, accountId: bank.id, categoryId: expense.id });
    const d = (await agent.get("/api/dashboard")).body;
    expect(d.trend).toHaveLength(6);
    expect(d.expenseByCategory[0]).toMatchObject({ name: expense.name, value: 30_000 });
    expect(d.recent).toHaveLength(1);
    expect((await agent.get("/api/dashboard?month=2026-13")).status).toBe(400);
  });
});
