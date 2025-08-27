import { User } from "@shared/schema";

const TOKEN_KEY = "myjantes_token";
const USER_KEY = "myjantes_user";

export class AuthService {
  static getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  static removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  static getUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  static setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  static getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}
