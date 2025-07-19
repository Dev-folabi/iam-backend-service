import { DataSource } from 'typeorm';
import { User } from './src/entities/User';
import { RefreshToken } from './src/entities/RefreshToken';
import { AuthService } from './src/services/authService';

export const TestDataSource = new DataSource({
  type: 'sqlite',
  database: ':memory:',
  dropSchema: true,
  entities: [User, AuthService, RefreshToken],
  synchronize: true,
  logging: false,
});