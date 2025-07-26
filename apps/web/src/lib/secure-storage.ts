// Secure Token Storage for Frontend
// Implements secure storage with encryption for sensitive data

interface SecureStorageConfig {
  encryptionKey?: string;
  storageType: 'localStorage' | 'sessionStorage' | 'memory';
  expirationTime?: number; // in milliseconds
}

interface StoredItem {
  value: string;
  encrypted: boolean;
  expiresAt?: number;
  timestamp: number;
}

class SecureTokenStorage {
  private config: SecureStorageConfig;
  private memoryStorage: Map<string, StoredItem> = new Map();
  private encryptionKey: string;

  constructor(config: Partial<SecureStorageConfig> = {}) {
    this.config = {
      storageType: 'localStorage',
      expirationTime: 24 * 60 * 60 * 1000, // 24 hours default
      ...config,
    };

    // Generate or use provided encryption key
    this.encryptionKey = config.encryptionKey || this.generateEncryptionKey();
  }

  // ========== ENCRYPTION UTILITIES ==========

  private generateEncryptionKey(): string {
    // Generate a simple key based on browser fingerprint
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Secure storage key', 2, 2);
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
    ].join('|');

    return btoa(fingerprint).slice(0, 32);
  }

  private encrypt(text: string): string {
    try {
      // Simple XOR encryption with the key
      let encrypted = '';
      for (let i = 0; i < text.length; i++) {
        const keyChar = this.encryptionKey.charCodeAt(i % this.encryptionKey.length);
        const textChar = text.charCodeAt(i);
        encrypted += String.fromCharCode(textChar ^ keyChar);
      }
      return btoa(encrypted);
    } catch (error) {
      console.warn('Encryption failed, storing as plain text:', error);
      return text;
    }
  }

  private decrypt(encryptedText: string): string {
    try {
      const encrypted = atob(encryptedText);
      let decrypted = '';
      for (let i = 0; i < encrypted.length; i++) {
        const keyChar = this.encryptionKey.charCodeAt(i % this.encryptionKey.length);
        const encryptedChar = encrypted.charCodeAt(i);
        decrypted += String.fromCharCode(encryptedChar ^ keyChar);
      }
      return decrypted;
    } catch (error) {
      console.warn('Decryption failed, returning as is:', error);
      return encryptedText;
    }
  }

  // ========== STORAGE OPERATIONS ==========

  private getStorage(): Storage | null {
    try {
      switch (this.config.storageType) {
        case 'localStorage':
          return localStorage;
        case 'sessionStorage':
          return sessionStorage;
        case 'memory':
          return null; // Use memory storage
        default:
          return localStorage;
      }
    } catch (error) {
      console.warn('Storage not available, falling back to memory storage');
      return null;
    }
  }

  setItem(key: string, value: string, options: { encrypt?: boolean; expirationTime?: number } = {}): void {
    const { encrypt = true, expirationTime } = options;
    
    const storedItem: StoredItem = {
      value: encrypt ? this.encrypt(value) : value,
      encrypted: encrypt,
      timestamp: Date.now(),
      expiresAt: expirationTime ? Date.now() + expirationTime : 
                 this.config.expirationTime ? Date.now() + this.config.expirationTime : undefined,
    };

    const storage = this.getStorage();
    
    if (storage) {
      try {
        storage.setItem(key, JSON.stringify(storedItem));
      } catch (error) {
        console.warn('Failed to store in browser storage, using memory:', error);
        this.memoryStorage.set(key, storedItem);
      }
    } else {
      this.memoryStorage.set(key, storedItem);
    }
  }

  getItem(key: string): string | null {
    const storage = this.getStorage();
    let storedItemStr: string | null = null;

    // Try to get from browser storage first
    if (storage) {
      try {
        storedItemStr = storage.getItem(key);
      } catch (error) {
        console.warn('Failed to read from browser storage:', error);
      }
    }

    // Fallback to memory storage
    if (!storedItemStr) {
      const memoryItem = this.memoryStorage.get(key);
      if (memoryItem) {
        storedItemStr = JSON.stringify(memoryItem);
      }
    }

    if (!storedItemStr) {
      return null;
    }

    try {
      const storedItem: StoredItem = JSON.parse(storedItemStr);
      
      // Check expiration
      if (storedItem.expiresAt && Date.now() > storedItem.expiresAt) {
        this.removeItem(key);
        return null;
      }

      // Decrypt if necessary
      return storedItem.encrypted ? this.decrypt(storedItem.value) : storedItem.value;
    } catch (error) {
      console.warn('Failed to parse stored item:', error);
      this.removeItem(key);
      return null;
    }
  }

  removeItem(key: string): void {
    const storage = this.getStorage();
    
    if (storage) {
      try {
        storage.removeItem(key);
      } catch (error) {
        console.warn('Failed to remove from browser storage:', error);
      }
    }
    
    this.memoryStorage.delete(key);
  }

  clear(): void {
    const storage = this.getStorage();
    
    if (storage) {
      try {
        // Only clear items that we stored (with our prefix or pattern)
        const keys = Object.keys(storage);
        keys.forEach(key => {
          try {
            const item = storage.getItem(key);
            if (item) {
              const parsed = JSON.parse(item);
              if (parsed && typeof parsed === 'object' && parsed.encrypted !== undefined) {
                storage.removeItem(key);
              }
            }
          } catch {
            // Skip items that aren't ours
          }
        });
      } catch (error) {
        console.warn('Failed to clear browser storage:', error);
      }
    }
    
    this.memoryStorage.clear();
  }

  // ========== TOKEN-SPECIFIC METHODS ==========

  setAccessToken(token: string): void {
    this.setItem('access_token', token, {
      encrypt: true,
      expirationTime: 15 * 60 * 1000, // 15 minutes
    });
  }

  getAccessToken(): string | null {
    return this.getItem('access_token');
  }

  setRefreshToken(token: string): void {
    this.setItem('refresh_token', token, {
      encrypt: true,
      expirationTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  getRefreshToken(): string | null {
    return this.getItem('refresh_token');
  }

  setUserData(userData: any): void {
    this.setItem('user_data', JSON.stringify(userData), {
      encrypt: true,
      expirationTime: 24 * 60 * 60 * 1000, // 24 hours
    });
  }

  getUserData(): any | null {
    const userData = this.getItem('user_data');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.warn('Failed to parse user data:', error);
        this.removeItem('user_data');
        return null;
      }
    }
    return null;
  }

  clearTokens(): void {
    this.removeItem('access_token');
    this.removeItem('refresh_token');
    this.removeItem('user_data');
  }

  // ========== SESSION MANAGEMENT ==========

  isTokenValid(): boolean {
    const token = this.getAccessToken();
    return !!token;
  }

  getTokenExpiration(): number | null {
    const storage = this.getStorage();
    let storedItemStr: string | null = null;

    if (storage) {
      try {
        storedItemStr = storage.getItem('access_token');
      } catch (error) {
        console.warn('Failed to read token expiration:', error);
      }
    }

    if (!storedItemStr) {
      const memoryItem = this.memoryStorage.get('access_token');
      if (memoryItem) {
        return memoryItem.expiresAt || null;
      }
    }

    if (storedItemStr) {
      try {
        const storedItem: StoredItem = JSON.parse(storedItemStr);
        return storedItem.expiresAt || null;
      } catch {
        return null;
      }
    }

    return null;
  }

  // ========== AUTO-LOGOUT FUNCTIONALITY ==========

  private inactivityTimer: NodeJS.Timeout | null = null;
  private inactivityTimeout = 30 * 60 * 1000; // 30 minutes default

  setupAutoLogout(timeoutMs: number = this.inactivityTimeout, onLogout?: () => void): void {
    this.inactivityTimeout = timeoutMs;
    
    const resetTimer = () => {
      if (this.inactivityTimer) {
        clearTimeout(this.inactivityTimer);
      }
      
      this.inactivityTimer = setTimeout(() => {
        this.clearTokens();
        if (onLogout) {
          onLogout();
        } else {
          // Default logout behavior
          window.location.href = '/login';
        }
      }, this.inactivityTimeout);
    };

    // Events that reset the inactivity timer
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    // Start the timer
    resetTimer();
  }

  clearAutoLogout(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  // ========== SECURITY UTILITIES ==========

  validateStorageSecurity(): {
    isSecure: boolean;
    warnings: string[];
    recommendations: string[];
  } {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check if running over HTTPS
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      warnings.push('Application is not running over HTTPS');
      recommendations.push('Deploy application over HTTPS for enhanced security');
    }

    // Check if localStorage is available
    try {
      localStorage.setItem('__test__', 'test');
      localStorage.removeItem('__test__');
    } catch {
      warnings.push('localStorage is not available');
      recommendations.push('Ensure browser supports localStorage or use memory storage');
    }

    // Check for common security headers (if available)
    if (typeof window !== 'undefined' && window.performance) {
      try {
        // This is a simplified check - in a real app you'd check actual headers
        recommendations.push('Implement CSP headers for additional security');
        recommendations.push('Consider implementing token rotation');
      } catch {
        // Headers not accessible from client side
      }
    }

    return {
      isSecure: warnings.length === 0,
      warnings,
      recommendations,
    };
  }
}

// Export singleton instance with default config
export const secureStorage = new SecureTokenStorage();

// Export class for custom instances
export { SecureTokenStorage };

// Export helper functions for direct use
export const tokenStorage = {
  setAccessToken: (token: string) => secureStorage.setAccessToken(token),
  getAccessToken: () => secureStorage.getAccessToken(),
  setRefreshToken: (token: string) => secureStorage.setRefreshToken(token),
  getRefreshToken: () => secureStorage.getRefreshToken(),
  setUserData: (data: any) => secureStorage.setUserData(data),
  getUserData: () => secureStorage.getUserData(),
  clearTokens: () => secureStorage.clearTokens(),
  isTokenValid: () => secureStorage.isTokenValid(),
  setupAutoLogout: (timeoutMs?: number, onLogout?: () => void) => 
    secureStorage.setupAutoLogout(timeoutMs, onLogout),
  clearAutoLogout: () => secureStorage.clearAutoLogout(),
};