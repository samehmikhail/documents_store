export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

export interface Token {
  id: string;
  token: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithToken extends User {
  token?: Token;
}