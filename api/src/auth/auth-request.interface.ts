export interface AuthRequest {
  user: {
    userId: string;
    email: string;
    displayName: string;
    role: 'TEACHER' | 'STUDENT';
  };
}
