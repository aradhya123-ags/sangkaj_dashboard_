import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';
import { Search, Save, CheckCircle, AlertCircle, Loader2, Database, Plus, X } from 'lucide-react';

const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];
const years = Array.from({ length: 10 }, (_, i) => 2024 + i);

const ViewUpdatePage = () => {
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');
    const [data, setData] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [editedRows, setEditedRows] = useState({}); // { id: newQuantity }
    const [showAddForm, setShowAddForm] = useState(false);
    const [newRow, setNewRow] = useState({
        plant: '',
        customer_code: '',
        customer_name: '',
        material_code: '',
        material_name: '',
        quantity: ''
    });

    const fetchData = async () => {
        if (!month || !year) return;
        setLoading(true);
        setStatus({ type: '', message: '' });
        try {
            const response = await axios.get(`${config.API_URL}/api/demand?month=${month}&year=${year}`);
            setData(response.data);
            setEditedRows({});
        } catch (err) {
            setStatus({ type: 'error', message: 'Failed to fetch data' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [month, year]);

    const handleEdit = (id, value) => {
        setEditedRows(prev => ({
            ...prev,
            [id]: parseFloat(value) || 0
        }));
    };

    const handleInsert = async () => {
        if (!month || !year) {
            setStatus({ type: 'error', message: 'Please select Month and Year first' });
            return;
        }
        if (!newRow.plant || !newRow.material_code || !newRow.quantity) {
            setStatus({ type: 'error', message: 'Plant, Material, and Plan are mandatory' });
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${config.API_URL}/api/demand`, {
                ...newRow,
                month,
                year
            });
            setStatus({ type: 'success', message: 'New record inserted successfully!' });
            setNewRow({
                plant: '',
                customer_code: '',
                customer_name: '',
                material_code: '',
                material_name: '',
                quantity: ''
            });
            setShowAddForm(false);
            fetchData(); // Refresh list
        } catch (err) {
            setStatus({ type: 'error', message: 'Failed to insert record' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        const idsToUpdate = Object.keys(editedRows);
        if (idsToUpdate.length === 0) return;

        setLoading(true);
        let successCount = 0;
        try {
            for (const id of idsToUpdate) {
                const originalRow = data.find(r => r.id === parseInt(id));
                // Construct monthYear manually since it's no longer in the row data
                const monthMap = { 'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11 };
                const simulatedDate = new Date(Date.UTC(parseInt(year), monthMap[month], 1));

                await axios.patch(`${config.API_URL}/api/demand/${id}`, {
                    quantity: editedRows[id],
                    plant: originalRow.plant,
                    material_code: originalRow.material_code,
                    monthYear: simulatedDate.toISOString(),
                    customer_code: originalRow.customer_code
                });
                successCount++;
            }
            setStatus({ type: 'success', message: `Successfully updated ${successCount} row(s) in SQL Server` });

            // Refresh local data
            setData(prev => prev.map(row =>
                editedRows[row.id] !== undefined
                    ? { ...row, quantity: editedRows[row.id] }
                    : row
            ));
            setEditedRows({});
        } catch (err) {
            setStatus({ type: 'error', message: 'Some updates failed. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const filteredData = data.filter(row =>
        row.material_code?.toLowerCase().includes(search.toLowerCase()) ||
        row.material_name?.toLowerCase().includes(search.toLowerCase()) ||
        row.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        row.plant?.toLowerCase().includes(search.toLowerCase()) ||
        row.customer_code?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="card" style={{ maxWidth: '1600px', width: '100%' }}>
            <h1 style={{ marginBottom: '2.5rem' }}>Update Demand</h1>

            {status.message && (
                <div className={status.type === 'success' ? 'success-msg' : 'error-msg'}>
                    {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    <span style={{ marginLeft: '8px' }}>{status.message}</span>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                <div className="input-group">
                    <label>Filter Month</label>
                    <select value={month} onChange={(e) => setMonth(e.target.value)}>
                        <option value="">Select Month</option>
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                <div className="input-group">
                    <label>Filter Year</label>
                    <select value={year} onChange={(e) => setYear(e.target.value)}>
                        <option value="">Select Year</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search by Material, Customer, Plant..."
                        style={{ paddingLeft: '2.5rem' }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button
                    className="btn"
                    onClick={() => setShowAddForm(!showAddForm)}
                    style={{ gap: '8px', border: '1px solid var(--primary)', color: 'var(--primary)', background: 'white' }}
                >
                    {showAddForm ? <X size={18} /> : <Plus size={18} />}
                    {showAddForm ? 'Cancel' : 'Insert Row'}
                </button>
                <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={loading || Object.keys(editedRows).length === 0}
                    style={{ gap: '8px', minWidth: '180px' }}
                >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Save Changes
                </button>
            </div>

            {showAddForm && (
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: 'var(--radius)', marginBottom: '2rem', border: '1px solid var(--border)', animation: 'fadeIn 0.3s ease' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>Add New Record</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="input-group">
                            <label style={{ fontSize: '0.8rem' }}>Plant *</label>
                            <input type="text" value={newRow.plant} onChange={e => setNewRow({ ...newRow, plant: e.target.value })} placeholder="e.g. 1111" />
                        </div>
                        <div className="input-group">
                            <label style={{ fontSize: '0.8rem' }}>Customer Code *</label>
                            <input type="text" value={newRow.customer_code} onChange={e => setNewRow({ ...newRow, customer_code: e.target.value })} placeholder="e.g. 21000xxx" />
                        </div>
                        <div className="input-group">
                            <label style={{ fontSize: '0.8rem' }}>Customer Name</label>
                            <input type="text" value={newRow.customer_name} onChange={e => setNewRow({ ...newRow, customer_name: e.target.value })} placeholder="e.g. Acme Corp" />
                        </div>
                        <div className="input-group">
                            <label style={{ fontSize: '0.8rem' }}>Material Code *</label>
                            <input type="text" value={newRow.material_code} onChange={e => setNewRow({ ...newRow, material_code: e.target.value })} placeholder="e.g. MC001" />
                        </div>
                        <div className="input-group">
                            <label style={{ fontSize: '0.8rem' }}>Material Description</label>
                            <input type="text" value={newRow.material_name} onChange={e => setNewRow({ ...newRow, material_name: e.target.value })} placeholder="e.g. Steel Plate" />
                        </div>
                        <div className="input-group">
                            <label style={{ fontSize: '0.8rem' }}>Plan Qty *</label>
                            <input type="number" value={newRow.quantity} onChange={e => setNewRow({ ...newRow, quantity: e.target.value })} placeholder="0" />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button className="btn btn-primary" onClick={handleInsert} style={{ padding: '0.6rem 2rem' }}>
                            Add Record
                        </button>
                    </div>
                </div>
            )}

            {loading && data.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <Loader2 size={40} className="animate-spin" style={{ margin: '0 auto 1rem' }} />
                    <p>Fetching records...</p>
                </div>
            ) : data.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ minWidth: '1100px' }}>
                        <thead>
                            <tr>
                                <th>Plant</th>
                                <th>Customer</th>
                                <th>Customer Name</th>
                                <th>Material</th>
                                <th>Material Description</th>
                                <th style={{ textAlign: 'center' }}>Plan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map(row => (
                                <tr key={row.id}>
                                    <td>{row.plant}</td>
                                    <td>{row.customer_code}</td>
                                    <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.customer_name}>
                                        {row.customer_name}
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{row.material_code}</td>
                                    <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.material_name}>
                                        {row.material_name}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <input
                                            type="number"
                                            defaultValue={row.quantity}
                                            onChange={(e) => handleEdit(row.id, e.target.value)}
                                            style={{
                                                width: '90px',
                                                padding: '0.4rem',
                                                textAlign: 'center',
                                                borderRadius: '6px',
                                                border: editedRows[row.id] !== undefined ? '2px solid var(--primary)' : '1px solid var(--border)',
                                                background: editedRows[row.id] !== undefined ? 'rgba(37, 99, 235, 0.05)' : 'white'
                                            }}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredData.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            No entries matches your search: "<b>{search}</b>"
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '4rem', border: '2px dashed var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-muted)' }}>
                    <Database size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                    <p>Select Month and Year to load database records</p>
                </div>
            )}

            {/* Total Floating Badge */}
            {
                filteredData.length > 0 && (
                    <div style={{
                        position: 'fixed',
                        bottom: '30px',
                        right: '30px',
                        background: 'var(--primary)',
                        color: 'white',
                        padding: '1rem 2rem',
                        borderRadius: '50px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        zIndex: 100,
                        animation: 'slideUp 0.3s ease-out'
                    }}>
                        <span style={{ fontSize: '0.85rem', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1px' }}>Total Plan</span>
                        <strong style={{ fontSize: '1.5rem', lineHeight: '1.2' }}>
                            {filteredData.reduce((sum, row) => {
                                const val = editedRows[row.id] !== undefined ? editedRows[row.id] : row.quantity;
                                return sum + (parseFloat(val) || 0);
                            }, 0).toLocaleString()}
                        </strong>
                    </div>
                )
            }
        </div >
    );
};

export default ViewUpdatePage;
