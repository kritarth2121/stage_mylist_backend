import jwt from 'jsonwebtoken';

// Hardcoded mock user ID for validation
const MOCK_USER_ID = 'user_12345';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface DecodedToken {
  userId: string;
  iat: number;
  exp: number;
}

export const decodeAndValidateToken = (token: string): DecodedToken | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    
    if (decoded.userId !== MOCK_USER_ID) {
      console.log(`[AUTH] Token user ID ${decoded.userId} does not match mock user ${MOCK_USER_ID}`);
      return null;
    }

    console.log(`[AUTH] Token validated successfully for user: ${decoded.userId}`);
    return decoded;
  } catch (error) {
    console.error('[AUTH] Token validation failed:', error);
    return null;
  }
};

export const generateMockToken = (): string => {
  const payload = {
    userId: MOCK_USER_ID,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiration
  };

  return jwt.sign(payload, JWT_SECRET);
};
