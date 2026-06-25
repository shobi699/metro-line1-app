interface GlobalOtpStore {
  otps?: Map<string, { code: string; expiresAt: number; phone: string }>;
  resetTokens?: Map<string, { nationalId: string; expiresAt: number }>;
}

const globalForOtp = globalThis as unknown as GlobalOtpStore;

if (!globalForOtp.otps) {
  globalForOtp.otps = new Map();
}

if (!globalForOtp.resetTokens) {
  globalForOtp.resetTokens = new Map();
}

export const otps = globalForOtp.otps;
export const resetTokens = globalForOtp.resetTokens;
