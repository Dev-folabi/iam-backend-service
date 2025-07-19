import request from "supertest";
import { createApp } from "../../src/app";
import { TestDataSource } from "../../src/test.datasource";

let app: ReturnType<typeof createApp>;

describe("Auth Integration", () => {
  beforeAll(() => {
    app = createApp(TestDataSource);
  });

  it("POST /api/v1/auth/register - create a new user", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      username: "Charlie",
      email: "charlie@example.com",
      password: "Password123!",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.user.email).toBe("charlie@example.com");
  });

  it("POST /api/v1/auth/login - return JWT on success", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      username: "Charlie",
      password: "Password123!",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe("charlie@example.com");
  });

  it("GET /api/v1/users/:id - retrieves user after authentication", async () => {
    await request(app).post("/api/v1/auth/register").send({
      username: "testuser2",
      email: "testuser2@example.com",
      password: "Password123!",
    });
    const loginRes = await request(app).post("/api/v1/auth/login").send({
      username: "testuser2",
      password: "Password123!",
    });
    const token = loginRes.body.data.accessToken;

    const userId = loginRes.body.data.user.id;
    const res = await request(app)
      .get(`/api/v1/users/${userId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.email).toBe("testuser2@example.com");
  });
});
