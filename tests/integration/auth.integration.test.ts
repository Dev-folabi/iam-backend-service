import request from "supertest";
import { createApp } from "../../src/app";
import { TestDataSource } from "../../ormconfig.test";

let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  await TestDataSource.initialize();
  app = createApp();
});

afterEach(async () => {
  const entities = TestDataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = TestDataSource.getRepository(entity.name);
    await repository.clear();
  }
});

afterAll(async () => {
  await TestDataSource.destroy();
});

describe("Auth Integration", () => {
  it("POST /api/auth/signup - create a new user", async () => {
    const res = await request(app).post("/api/auth/signup").send({
      username: "Charlie",
      email: "charlie@example.com",
      password: "Password123!",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.user.email).toBe("charlie@example.com");
  });

  it("POST /api/auth/login - return JWT on success", async () => {
    const res = await request(app).post("/api/auth/login").send({
      username: "Charlie",
      password: "Password123!",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe("charlie@example.com");
  });
});
