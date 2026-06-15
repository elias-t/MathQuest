export interface AuthRequest {
  user: {
    userId: string;
    email: string;
    role: 'TEACHER' | 'STUDENT';
  };
}
