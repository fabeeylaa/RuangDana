import request from "supertest";
import { expect, it } from "vitest";
import { makeTestApp } from "../../testing/helpers";

it("GET /api/health mengembalikan status ok", async () => {
  const res = await request(makeTestApp()).get("/api/health");
  expect(res.status).toBe(200);
  expect(res.body.status).toBe("ok");
});
