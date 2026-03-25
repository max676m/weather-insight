const authMiddleware = require('../middleware/authMiddleware');
const admin = require('../firebaseAdmin');

// Mock Firebase Admin
jest.mock('../firebaseAdmin', () => ({
  auth: jest.fn().mockReturnValue({
    verifyIdToken: jest.fn()
  })
}));

describe('Auth Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = { headers: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('fails with 401 if Authorization header is missing', async () => {
    await authMiddleware(mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized: No token provided.' });
  });

  it('fails with 401 if Authorization format is invalid (no Bearer)', async () => {
    mockReq.headers.authorization = 'InvalidFormatToken123';
    await authMiddleware(mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized: No token provided.' });
  });

  it('fails with 403 if token verification fails', async () => {
    mockReq.headers.authorization = 'Bearer BadToken';
    const verifyIdTokenMock = jest.fn().mockRejectedValue(new Error('Invalid token'));
    admin.auth.mockReturnValue({ verifyIdToken: verifyIdTokenMock });

    await authMiddleware(mockReq, mockRes, mockNext);
    expect(verifyIdTokenMock).toHaveBeenCalledWith('BadToken');
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Forbidden: Invalid or expired token.' });
  });

  it('calls next() and sets req.uid on successful verification', async () => {
    mockReq.headers.authorization = 'Bearer GoodToken';
    const verifyIdTokenMock = jest.fn().mockResolvedValue({ uid: 'test-uid-123', email: 'test@example.com' });
    admin.auth.mockReturnValue({ verifyIdToken: verifyIdTokenMock });

    await authMiddleware(mockReq, mockRes, mockNext);
    expect(verifyIdTokenMock).toHaveBeenCalledWith('GoodToken');
    expect(mockReq.uid).toBe('test-uid-123');
    expect(mockReq.userEmail).toBe('test@example.com');
    expect(mockNext).toHaveBeenCalled();
  });
});
