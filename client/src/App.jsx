import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import ViewUpdatePage from './pages/ViewUpdatePage';
import LoginPage from './pages/LoginPage';
import { Upload, Database, LogOut } from 'lucide-react';
import config from './config';

const AppStatus = () => {
    const [stats, setStats] = React.useState(null);

    React.useEffect(() => {
        let isMounted = true;
        const fetchStats = async () => {
            try {
                const res = await fetch(`${config.API_URL}/api/stats`);
                if (!res.ok) return;
                const data = await res.json();
                if (isMounted) setStats(data);
            } catch (err) {
                console.error('Stats fail:', err);
            }
        };
        fetchStats();
        // Removed polling to prevent server overload
        return () => { isMounted = false; };
    }, []);

    if (!stats || !Array.isArray(stats.breakdowns)) return <div style={{ marginTop: '2rem', color: 'var(--text-muted)' }}>Connecting to database...</div>;

    return (
        <div className="card" style={{ marginTop: '3rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={18} color="var(--primary)" /> Database Knowledge
            </h3>
            <div style={{ fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Knowledge Base:</span>
                <strong style={{ marginLeft: '8px', color: 'var(--primary)', fontSize: '1.1rem' }}>{stats.total?.toLocaleString()} rows</strong>
            </div>
        </div>
    );
};

function App() {
    const [user, setUser] = React.useState(() => {
        const saved = localStorage.getItem('bi_user');
        return saved ? JSON.parse(saved) : null;
    });

    const handleLogin = (userData) => {
        setUser(userData);
        localStorage.setItem('bi_user', JSON.stringify(userData));
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('bi_user');
    };

    if (!user) {
        return <div className="app-container"><LoginPage onLogin={handleLogin} /></div>;
    }

    return (
        <Router>
            <div className="app-container">
                <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <NavLink to="/upload" className={({ isActive }) => isActive ? 'active' : ''}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Upload size={18} />
                                Upload
                            </div>
                        </NavLink>
                        <NavLink to="/view" className={({ isActive }) => isActive ? 'active' : ''}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Database size={18} />
                                View & Update
                            </div>
                        </NavLink>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{user.username}</span>
                        <button onClick={handleLogout} className="btn" style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.4rem 0.8rem', fontSize: '0.8rem', border: 'none', cursor: 'pointer', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                            <LogOut size={16} style={{ marginRight: '6px' }} />
                            Logout
                        </button>
                    </div>
                </nav>

                <Routes>
                    <Route path="/" element={<Navigate to="/upload" replace />} />
                    <Route path="/upload" element={<UploadPage />} />
                    <Route path="/view" element={<ViewUpdatePage />} />
                    <Route path="*" element={<Navigate to="/upload" replace />} />
                </Routes>

                <AppStatus />
            </div>
        </Router>
    );
}

export default App;
