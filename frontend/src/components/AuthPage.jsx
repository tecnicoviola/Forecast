import React, { useState } from 'react';
import { Flame, Lock, Mail, User, ArrowLeft, ArrowRight, Shield, Sun, Moon } from 'lucide-react';

export default function AuthPage({ onLoginSuccess, onBackToLanding, theme, onToggleTheme }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organization, setOrganization] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    const userProfile = {
      name: name || (isSignUp ? 'Climate Researcher' : email.split('@')[0]),
      email: email,
      organization: organization || 'Dygnify Research Lab',
      role: 'Climate Data Analyst'
    };

    localStorage.setItem('climate_user', JSON.stringify(userProfile));
    onLoginSuccess(userProfile);
  };

  const handleDemoLogin = () => {
    const demoUser = {
      name: 'Guest Researcher',
      email: 'guest.analyst@dygnify.com',
      organization: 'Dygnify Ventures Evaluation Team',
      role: 'Lead Climate Researcher'
    };
    localStorage.setItem('climate_user', JSON.stringify(demoUser));
    onLoginSuccess(demoUser);
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button
            onClick={onBackToLanding}
            className="button-secondary"
            style={{ border: 'none', background: 'transparent', padding: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={16} />
            Back to Home
          </button>

          <button
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            style={{ width: 32, height: 32 }}
          >
            {theme === 'dark' ? <Sun size={15} color="var(--palette-cream)" /> : <Moon size={15} color="var(--palette-mauve)" />}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div className="brand-icon" style={{ width: 38, height: 38 }}>
            <Flame size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {isSignUp ? 'Create Researcher Account' : 'Welcome to Aetheria'}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {isSignUp ? 'Join the climate analytics workspace' : 'Sign in to access your saved regions & reports'}
            </p>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(214, 143, 132, 0.15)',
            border: '1px solid var(--palette-terracotta)',
            color: 'var(--palette-terracotta)',
            padding: '0.65rem 0.85rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <>
              <div className="control-group">
                <label className="control-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '2.4rem' }}
                    placeholder="e.g. Dr. Alex Mercer"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="control-group">
                <label className="control-label">Organization / University</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Dygnify Climate Lab"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="control-group">
            <label className="control-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                required
                className="form-input"
                style={{ paddingLeft: '2.4rem' }}
                placeholder="analyst@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="control-group">
            <label className="control-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                required
                className="form-input"
                style={{ paddingLeft: '2.4rem' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="button-primary" style={{ width: '100%', marginTop: '0.5rem', marginBottom: '1rem' }}>
            <span>{isSignUp ? 'Register & Continue' : 'Sign In to Workspace'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ textAlign: 'center', margin: '0.75rem 0', position: 'relative' }}>
          <div style={{ height: '1px', background: 'var(--border-subtle)', position: 'absolute', left: 0, right: 0, top: '50%' }} />
          <span style={{ position: 'relative', background: 'var(--bg-card)', padding: '0 0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            OR 1-CLICK INSTANT ACCESS
          </span>
        </div>

        <button
          type="button"
          onClick={handleDemoLogin}
          className="button-secondary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: '1.25rem', borderColor: 'var(--palette-mauve)' }}
        >
          <Shield size={16} color="var(--palette-mauve)" />
          Quick Demo Login (Evaluator Access)
        </button>

        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {isSignUp ? (
            <>
              Already have an account?{' '}
              <span onClick={() => setIsSignUp(false)} style={{ color: 'var(--palette-mauve)', cursor: 'pointer', fontWeight: 600 }}>
                Sign In
              </span>
            </>
          ) : (
            <>
              Need a researcher account?{' '}
              <span onClick={() => setIsSignUp(true)} style={{ color: 'var(--palette-mauve)', cursor: 'pointer', fontWeight: 600 }}>
                Create one now
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
