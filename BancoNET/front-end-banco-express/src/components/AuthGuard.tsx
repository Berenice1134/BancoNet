import { Navigate } from 'react-router-dom';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = localStorage.getItem('token');
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

export default AuthGuard;