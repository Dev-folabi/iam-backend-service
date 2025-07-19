import { UserService } from "../../src/services/userService";
import { TestDataSource } from "../../src/test.datasource";

describe("UserService", () => {
  let userService: UserService;

  beforeAll(() => {
    userService = new UserService(TestDataSource);
  });

  it("creates a user successfully", async () => {
    const user = await userService.createUser({
      username: "Afolabi2",
      email: "afolabi2@example.com",
      password: "Password123!",
    });

    expect(user).toHaveProperty("id");
    expect(user.email).toBe("afolabi2@example.com");
  });

  it("fails if email already exists", async () => {
    await userService.createUser({
      username: "johndoe",
      email: "john.doe@example.com",
      password: "Password123!",
    });

    await expect(
      userService.createUser({
        username: "johndoe2",
        email: "john.doe@example.com",
        password: "Password123!",
      })
    ).rejects.toThrow("Username or email already exists");
  });
});
