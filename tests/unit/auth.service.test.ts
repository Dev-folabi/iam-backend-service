import { AuthService } from "../../src/services/authService";
import { TestDataSource } from "../../src/test.datasource";

describe("AuthService", () => {
  let authService: AuthService;

  beforeAll(() => {
    authService = new AuthService(TestDataSource);
  });

  it("fails login with invalid password", async () => {
    await expect(
      authService.login({ username: "testuser", password: "wrongpass" })
    ).rejects.toThrow("Invalid credentials");
  });

  it("fails login with unknown username", async () => {
    await expect(
      authService.login({ username: "nouser", password: "Password123!" })
    ).rejects.toThrow("Invalid credentials");
  });

  it("registers a new user successfully", async () => {
    const result = await authService.register({
      username: "newuser",
      email: "newuser@example.com",
      password: "Password123!",
    });
    expect(result).toHaveProperty("id");
    expect(result.email).toBe("newuser@example.com");
  });

  it("fails to refresh with invalid token", async () => {
    await expect(
      authService.refreshAccessToken("invalid_token")
    ).rejects.toThrow("Invalid refresh token");
  });
});
