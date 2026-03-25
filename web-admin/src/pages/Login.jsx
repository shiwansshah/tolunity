import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ShieldAlert, LogIn } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { Card, Button } from '../components/UI';
import { appConfig } from '../config/appConfig';
import { getApiErrorMessage } from '../services/apiError';
import './Login.css';

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      setError('Please fill in both fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      setError(getApiErrorMessage(error, 'Failed to login'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-backdrop" />

      <Card className="login-card fade-in">
        <div className="login-header">
          <div className="logo-circle">
            <ShieldAlert size={32} color="white" />
          </div>
          <h2>Admin Access</h2>
          <p className="text-muted mt-1">Authenticate to manage {appConfig.appName}</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form flex flex-col gap-4">
          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@tolunity.com"
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <Button type="submit" isLoading={loading} className="w-full mt-1">
            <LogIn size={18} />
            Sign In to Dashboard
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Login;
