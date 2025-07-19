import { AuthService } from '../../src/services/authService';
import { PasswordUtils } from '../../src/utils/password';
import { TestDataSource } from '../../ormconfig.test';
import { User } from '../../src/entities/User';

describe('AuthService', () => {
  const authService = new AuthService();

  beforeAll(async () => {
    await TestDataSource.initialize();
  });

  beforeEach(async () => {
    const userRepo = TestDataSource.getRepository(User);
    const hashed = await PasswordUtils.hashPassword('Password123!');
    await userRepo.save(userRepo.create({
      email: 'testuser@example.com',
      username: 'testuser',
      passwordHash: hashed,
    }));
  });

  afterEach(async () => {
    const userRepo = TestDataSource.getRepository(User);
    await userRepo.clear();
  });

  afterAll(async () => {
    await TestDataSource.destroy();
  });

  it('logs in with correct credentials', async () => {
    const result = await authService.login({ username: 'testuser', password: 'Password123!' });
    expect(result.accessToken).toBeDefined();
    expect(result.user.username).toBe('testuser');
  });

  it('fails login with invalid password', async () => {
    await expect(
      authService.login({ username: 'testuser', password: 'wrongpass' })
    ).rejects.toThrow('Invalid credentials');
  });

  it('fails login with unknown username', async () => {
    await expect(
      authService.login({ username: 'nouser', password: 'Password123!' })
    ).rejects.toThrow('Invalid credentials');
  });
});
