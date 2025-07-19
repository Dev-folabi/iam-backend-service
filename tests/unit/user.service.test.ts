import { UserService } from "../../src/services/userService";
import { TestDataSource } from "../../ormconfig.test";

beforeAll(async () => {
  await TestDataSource.initialize();
});

afterAll(async () => {
  await TestDataSource.destroy();
});

afterEach(async () => {
  const entities = TestDataSource.entityMetadatas;
  for (const entity of entities) {
    const repo = TestDataSource.getRepository(entity.name);
    await repo.clear();
  }
});

describe("UserService", () => {
  it("creates a user successfully", async () => {
    const userService = new UserService();
    const user = await userService.createUser({
      username: "Afolabi",
      email: "afolabi@example.com",
      password: "Password123!",
    });

    expect(user).toHaveProperty("id");
    expect(user.email).toBe("afolabi@example.com");
  });

  it("fails if email already exists", async () => {
    const userService = new UserService();
    await userService.createUser({
      username: "johndoe",
      email: "john.doe@example.com",
      password: "Password123!",
    });

    await expect(
      userService.createUser({
        username: "johndoe",
        email: "john.doe@example.com",
        password: "Password123!",
      })
    ).rejects.toThrow("Email already in use");
  });
});
