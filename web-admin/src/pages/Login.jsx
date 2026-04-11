import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Banner, Button, Field, inputClass } from '../components/UI';
import { useAuth } from '../context/useAuth';
import { appConfig } from '../config/appConfig';
import { getApiErrorMessage } from '../services/apiError';

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
      setError('Please fill in both fields.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(email, password);
      navigate('/dashboard');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Failed to login'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 text-[13px] text-slate-700">
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <div className="w-full max-w-[400px] rounded-lg border border-slate-200 bg-white px-6 py-7 shadow-sm sm:px-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
              <img src="/logo.png" alt="TolUnity" className="h-6 w-6 object-contain" />
            </div>
            <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">TolUnity</div>
            <h1 className="mt-1.5 text-[18px] font-semibold tracking-[-0.01em] text-slate-900">
              {appConfig.appName} Admin
            </h1>
          </div>

          {error && <Banner className="mx-0 mt-6">{error}</Banner>}

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <Field label="Email">
              <input
                className={inputClass}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </Field>

            <Field label="Password">
              <input
                className={inputClass}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </Field>

            <Button type="submit" isLoading={loading} className="w-full justify-center">
              Login
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Login;
