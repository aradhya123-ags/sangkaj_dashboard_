import React, { useState } from 'react';
import axios from 'axios';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';
import config from '../config';

const LoginPage = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!username || !password) return;

        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${config.API_URL}/api/login`, { username, password });
            if (res.data.success) {
                onLogin(res.data.user);
            } else {
                setError('Invalid username or password');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80vh'
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        background: 'var(--primary)',
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem'
                    }}>
                        <LogIn color="white" size={24} />
                    </div>
                    <h2 style={{ marginBottom: '0.5rem' }}>Portal Login</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Enter your credentials to continue</p>
                </div>

                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="xyz@sangkaj.com"
                            required
                        />
                    </div>
                    <div className="input-group" style={{ marginBottom: '2rem' }}>
                        <label>Password</label>
                        <input
                            type="password"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                background: 'white',
                                color: 'var(--text-main)',
                                fontSize: '1rem'
                            }}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <div className="error-msg" style={{ marginBottom: '1.5rem' }}>
                            <AlertCircle size={18} style={{ marginRight: '8px' }} />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" style={{ marginRight: '8px' }} />
                                Logging in...
                            </>
                        ) : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
