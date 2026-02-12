import React, { useState } from 'react';
import axios from 'axios';
import { Upload, CheckCircle, AlertCircle, RefreshCw, Info, Table } from 'lucide-react';
import config from '../config';

const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const years = Array.from({ length: 10 }, (_, i) => 2024 + i);

const UploadPage = () => {
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [showFormat, setShowFormat] = useState(true);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls'))) {
            setFile(selectedFile);
            setStatus({ type: '', message: '' });
        } else {
            setStatus({ type: 'error', message: 'Please select a valid Excel file' });
            setFile(null);
        }
    };

    const handleUpload = async () => {
        if (!month || !year || !file) {
            setStatus({ type: 'error', message: 'Please select Month, Year and File' });
            return;
        }

        setLoading(true);
        setStatus({ type: '', message: '' });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('month', month);
        formData.append('year', year);

        try {
            const response = await axios.post(`${config.API_URL}/api/upload`, formData);
            setStatus({ type: 'success', message: response.data.message });
            setFile(null);
            document.getElementById('file-input').value = '';
        } catch (err) {
            setStatus({ type: 'error', message: err.response?.data?.error || 'Upload failed' });
        } finally {
            setLoading(false);
        }
    };

    const handleSyncSql = async () => {
        setLoading(true);
        setStatus({ type: '', message: '' });
        try {
            const response = await axios.post(`${config.API_URL}/api/sync-sql`);
            setStatus({ type: 'success', message: response.data.message });
        } catch (err) {
            setStatus({ type: 'error', message: err.response?.data?.error || 'Sync failed' });
        } finally {
            setLoading(false);
        }
    };

    const templateColumns = [
        'Plant', 'Customer', 'Customer Name', 'Material', 'Material Description', 'Plan'
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <h1 style={{ margin: 0 }}>Upload Data</h1>
                    <button
                        className="btn"
                        onClick={() => setShowFormat(!showFormat)}
                        style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <Table size={16} />
                        {showFormat ? 'Hide Format' : 'Show Format Info'}
                    </button>
                </div>

                {showFormat && (
                    <div style={{ background: '#f8fafc', borderRadius: 'var(--radius)', padding: '1.5rem', marginBottom: '2.5rem', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: 'var(--primary)' }}>
                            <Info size={18} />
                            <strong style={{ fontSize: '0.9rem' }}>Required Excel Format</strong>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ margin: 0, minWidth: '600px' }}>
                                <thead>
                                    <tr>
                                        {templateColumns.map(col => (
                                            <th key={col}>{col}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>1111</td>
                                        <td>21000001</td>
                                        <td>Ashok Leyland Ltd (Bhandara)</td>
                                        <td>SF1607911T2</td>
                                        <td>GEAR CNC TURNED</td>
                                        <td>103</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                            * Note: Columns name and sequence should accurately match the Required excel format
                        </p>
                    </div>
                )}

                {status.message && (
                    <div className={status.type === 'success' ? 'success-msg' : 'error-msg'}>
                        {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        <span style={{ marginLeft: '8px' }}>{status.message}</span>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                    <div className="input-group">
                        <label>Target Month</label>
                        <select value={month} onChange={(e) => setMonth(e.target.value)}>
                            <option value="">Select Month</option>
                            {months.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Target Year</label>
                        <select value={year} onChange={(e) => setYear(e.target.value)}>
                            <option value="">Select Year</option>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>

                <div
                    className="upload-area"
                    onClick={() => document.getElementById('file-input').click()}
                >
                    <Upload size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                    <p style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1.1rem' }}>
                        {file ? file.name : "Click to select Excel file"}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                        Drag and drop or click to browse
                    </p>
                    <input
                        id="file-input"
                        type="file"
                        hidden
                        onChange={handleFileChange}
                        accept=".xlsx, .xls"
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button
                        className="btn btn-primary"
                        onClick={handleUpload}
                        disabled={loading}
                        style={{ width: '100%', padding: '1rem' }}
                    >
                        {loading ? "Processing..." : "Upload & Replace Data"}
                    </button>

                    <button
                        className="btn"
                        onClick={handleSyncSql}
                        disabled={loading}
                        style={{ width: '100%', border: '1px solid var(--primary)', color: 'var(--primary)', display: 'flex', gap: '8px', alignItems: 'center', background: 'white' }}
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        Sync from SQL Server
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UploadPage;
