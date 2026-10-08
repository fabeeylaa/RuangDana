import { describe, expect, it } from "vitest";
import { makeTestApp, registerUser } from "../../testing/helpers";

describe("akun keuangan", () => {
  it("membuat dan mendaftar akun dengan saldo bilangan bulat", async () => {
    const app = makeTestApp();
    const { agent } = await registerUser(app, "a@example.com");
    const created = await agent.post("/api/accounts").send({ name: "Bank Utama", type: "BANK", openingBalance: 1_500_000 });
    expect(created.status).toBe(201);
    expect(created.body.account).toMatchObject({ name: "Bank Utama", openingBalance: 1_500_000, balance: 1_500_000, archived: false });

    const list = await agent.get("/api/accounts");
    expect(list.body.accounts).toHaveLength(1);
  });

  it("menolak saldo desimal, negatif, di luar batas, dan jenis tak dikenal", async () => {
    const app = makeTestApp();
    const { agent } = await registerUser(app, "b@example.com");
    const bad = [
      { name: "X", type: "BANK", openingBalance: 10.5 },
      { name: "X", type: "BANK", openingBalance: -1 },
      { name: "X", type: "BANK", openingBalance: 2e15 },
      { name: "X", type: "BANK", openingBalance: "1000" },
      { name: "X", type: "KRIPTO", openingBalance: 0 },
      { name: "  ", type: "CASH", openingBalance: 0 },
    ];
    for (const body of bad) expect((await agent.post("/api/accounts").send(body)).status).toBe(400);
    expect((await agent.get("/api/accounts")).body.accounts).toHaveLength(0);
  });

  it("nama akun unik per pengguna, tetapi boleh sama antar pengguna", async () => {
    const app = makeTestApp();
    const { agent: a } = await registerUser(app, "c@example.com");
    const { agent: b } = await registerUser(app, "d@example.com");
    expect((await a.post("/api/accounts").send({ name: "Tunai", type: "CASH" })).status).toBe(201);
    const dup = await a.post("/api/accounts").send({ name: "Tunai", type: "CASH" });
    expect(dup.status).toBe(409);
    expect(dup.body.code).toBe("ACCOUNT_NAME_TAKEN");
    expect((await b.post("/api/accounts").send({ name: "Tunai", type: "CASH" })).status).toBe(201);
  });

  it("memperbarui akun milik sendiri", async () => {
    const app = makeTestApp();
    const { agent } = await registerUser(app, "e@example.com");
    const { body } = await agent.post("/api/accounts").send({ name: "Dompet", type: "CASH", openingBalance: 100_000 });
    const res = await agent.patch(`/api/accounts/${body.account.id}`).send({ name: "Dompet Utama", openingBalance: 250_000 });
    expect(res.body.account).toMatchObject({ name: "Dompet Utama", openingBalance: 250_000 });
    expect((await agent.patch(`/api/accounts/${body.account.id}`).send({})).status).toBe(400);
  });

  it("mengarsipkan (bukan menghapus) dan bisa dipulihkan", async () => {
    const app = makeTestApp();
    const { agent } = await registerUser(app, "f@example.com");
    const { body } = await agent.post("/api/accounts").send({ name: "E-Wallet", type: "EWALLET" });
    const id = body.account.id;

    expect((await agent.post(`/api/accounts/${id}/archive`)).body.account.archived).toBe(true);
    expect((await agent.get("/api/accounts")).body.accounts).toHaveLength(0);
    expect((await agent.get("/api/accounts?archived=true")).body.accounts).toHaveLength(1);

    expect((await agent.post(`/api/accounts/${id}/unarchive`)).body.account.archived).toBe(false);
    expect((await agent.get("/api/accounts")).body.accounts).toHaveLength(1);
  });

  it("ISOLASI: pengguna lain tidak bisa melihat, mengubah, atau mengarsipkan akun milikmu", async () => {
    const app = makeTestApp();
    const { agent: alice } = await registerUser(app, "alice@example.com");
    const { agent: mallory } = await registerUser(app, "mallory@example.com");
    const { body } = await alice.post("/api/accounts").send({ name: "Tabungan Alice", type: "SAVINGS", openingBalance: 9_000_000 });
    const id = body.account.id;

    expect((await mallory.get("/api/accounts")).body.accounts).toHaveLength(0);
    expect((await mallory.patch(`/api/accounts/${id}`).send({ name: "Dibajak", openingBalance: 0 })).status).toBe(404);
    expect((await mallory.post(`/api/accounts/${id}/archive`)).status).toBe(404);
    expect((await mallory.post(`/api/accounts/${id}/unarchive`)).status).toBe(404);

    // data Alice tidak berubah
    const intact = (await alice.get("/api/accounts")).body.accounts[0];
    expect(intact).toMatchObject({ name: "Tabungan Alice", openingBalance: 9_000_000, archived: false });
  });

  it("ID bukan UUID ditolak dengan 400", async () => {
    const app = makeTestApp();
    const { agent } = await registerUser(app, "g@example.com");
    expect((await agent.patch("/api/accounts/bukan-uuid").send({ name: "X" })).status).toBe(400);
  });
});
