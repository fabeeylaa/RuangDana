import request from "supertest";
import { describe, expect, it } from "vitest";
import { agentFor, makeTestApp, ORIGIN, registerUser } from "../../testing/helpers";

describe("auth", () => {
  it("register membuat sesi httpOnly dan tidak membocorkan hash", async () => {
    const app = makeTestApp();
    const { agent, res } = await registerUser(app, "Budi@Example.com");
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: "budi@example.com", onboarded: false });
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|argon2/);

    const cookie = String(res.headers["set-cookie"]);
    expect(cookie).toMatch(/rd_session=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);

    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe("budi@example.com");
  });

  it("menolak email ganda (tanpa peduli huruf besar/kecil)", async () => {
    const app = makeTestApp();
    await registerUser(app, "a@example.com");
    const dup = await registerUser(app, "A@EXAMPLE.COM");
    expect(dup.res.status).toBe(409);
    expect(dup.res.body.code).toBe("EMAIL_TAKEN");
  });

  it("validasi input mengembalikan pesan per kolom", async () => {
    const app = makeTestApp();
    const res = await agentFor(app).post("/api/auth/register").send({ name: "A", email: "bukan-email", password: "pendek" });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.fields).sort()).toEqual(["email", "name", "password"]);
  });

  it("login: kata sandi salah dan email tak dikenal memberi pesan yang sama", async () => {
    const app = makeTestApp();
    await registerUser(app, "c@example.com");
    const wrong = await agentFor(app).post("/api/auth/login").send({ email: "c@example.com", password: "salah-salah" });
    const unknown = await agentFor(app).post("/api/auth/login").send({ email: "tidak-ada@example.com", password: "salah-salah" });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.error).toBe(unknown.body.error);

    const ok = await agentFor(app).post("/api/auth/login").send({ email: "c@example.com", password: "kata-sandi-aman-1" });
    expect(ok.status).toBe(200);
  });

  it("endpoint terlindungi menolak permintaan tanpa sesi", async () => {
    const app = makeTestApp();
    expect((await agentFor(app).get("/api/auth/me")).status).toBe(401);
    expect((await agentFor(app).get("/api/accounts")).status).toBe(401);
  });

  it("logout mencabut sesi di server, bukan hanya menghapus cookie", async () => {
    const app = makeTestApp();
    const { agent, res } = await registerUser(app, "d@example.com");
    const stolen = String(res.headers["set-cookie"]).split(";")[0]!;
    expect((await agent.post("/api/auth/logout")).status).toBe(204);
    expect((await agent.get("/api/auth/me")).status).toBe(401);
    // token yang sama tidak berlaku lagi walau dikirim manual
    const replay = await request(app).get("/api/auth/me").set("Cookie", stolen);
    expect(replay.status).toBe(401);
  });

  it("sesi kedaluwarsa ditolak", async () => {
    const app = makeTestApp({ sessionTtlMs: -1000 });
    const { agent } = await registerUser(app, "e@example.com");
    expect((await agent.get("/api/auth/me")).status).toBe(401);
  });

  it("origin asing ditolak pada permintaan yang mengubah data", async () => {
    const app = makeTestApp();
    const res = await request(app)
      .post("/api/auth/login")
      .set("Origin", "https://situs-jahat.example")
      .send({ email: "x@example.com", password: "apa-saja-123" });
    expect(res.status).toBe(403);
    // GET aman tetap diproses (dan di sini ditolak karena belum login, bukan karena origin)
    const get = await request(app).get("/api/auth/me").set("Origin", "https://situs-jahat.example");
    expect(get.status).toBe(401);
  });

  it("JSON rusak menghasilkan 400, bukan 500", async () => {
    const app = makeTestApp();
    const res = await request(app).post("/api/auth/login").set("Origin", ORIGIN).set("Content-Type", "application/json").send("{rusak");
    expect(res.status).toBe(400);
  });

  it("rate limit membatasi percobaan login berulang", async () => {
    const app = makeTestApp({ rateLimit: true });
    let last = 0;
    for (let i = 0; i < 12; i++) {
      last = (await agentFor(app).post("/api/auth/login").send({ email: "z@example.com", password: "salah-salah" })).status;
    }
    expect(last).toBe(429);
  });
});

describe("profil", () => {
  it("mengubah nama dan menandai onboarding selesai", async () => {
    const app = makeTestApp();
    const { agent } = await registerUser(app, "f@example.com");
    const renamed = await agent.patch("/api/profile").send({ name: "Nama Baru" });
    expect(renamed.body.user.name).toBe("Nama Baru");
    const done = await agent.post("/api/profile/onboarded");
    expect(done.body.user.onboarded).toBe(true);
  });

  it("ganti kata sandi: wajib kata sandi lama, sesi lain dicabut, sesi ini tetap", async () => {
    const app = makeTestApp();
    const { agent: laptop } = await registerUser(app, "g@example.com");
    const phone = agentFor(app);
    await phone.post("/api/auth/login").send({ email: "g@example.com", password: "kata-sandi-aman-1" });

    const bad = await laptop.post("/api/profile/password").send({ currentPassword: "bukan-ini-12", newPassword: "sandi-baru-aman-2" });
    expect(bad.status).toBe(401);

    const ok = await laptop.post("/api/profile/password").send({ currentPassword: "kata-sandi-aman-1", newPassword: "sandi-baru-aman-2" });
    expect(ok.status).toBe(204);
    expect((await laptop.get("/api/auth/me")).status).toBe(200);
    expect((await phone.get("/api/auth/me")).status).toBe(401);

    const old = await agentFor(app).post("/api/auth/login").send({ email: "g@example.com", password: "kata-sandi-aman-1" });
    expect(old.status).toBe(401);
    const fresh = await agentFor(app).post("/api/auth/login").send({ email: "g@example.com", password: "sandi-baru-aman-2" });
    expect(fresh.status).toBe(200);
  });
});
