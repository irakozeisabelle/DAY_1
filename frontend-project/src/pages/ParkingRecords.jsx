import { useState, useEffect } from 'react';
import api from '../api';

export default function ParkingRecords() {
  const [records, setRecords] = useState([]);
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({ PlateNumber: '', SlotNumber: '', EntryTime: '' });
  const [editRecord, setEditRecord] = useState(null);
  const [exitTime, setExitTime] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    try {
      const [recRes, slotRes] = await Promise.all([api.get('/records'), api.get('/slots/available')]);
      setRecords(recRes.data);
      setSlots(slotRes.data);
    } catch { /* handled */ }
  };

  useEffect(() => { fetchAll(); }, []);

  const showMsg = (text, type) => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  // CREATE — car entry
  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/records', form);
      showMsg('Parking record created successfully!', 'success');
      setForm({ PlateNumber: '', SlotNumber: '', EntryTime: '' });
      fetchAll();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Error creating record.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // UPDATE — car exit
  const handleExit = async (e) => {
    e.preventDefault();
    if (!exitTime) return showMsg('Please enter exit time.', 'error');
    setLoading(true);
    try {
      await api.put(`/records/${editRecord._id}`, { ExitTime: exitTime });
      showMsg('Exit recorded successfully!', 'success');
      setEditRecord(null);
      setExitTime('');
      fetchAll();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Error updating record.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // DELETE
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this parking record?')) return;
    try {
      await api.delete(`/records/${id}`);
      showMsg('Record deleted.', 'success');
      fetchAll();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Error deleting record.', 'error');
    }
  };

  const fmt = (dt) => dt ? new Date(dt).toLocaleString() : '—';

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-blue-800">📋 Parking Records</h2>

      {msg.text && (
        <div className={`rounded p-3 text-sm border ${msg.type === 'success' ? 'bg-green-50 border-green-300 text-green-700' : 'bg-red-50 border-red-300 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      {/* Entry Form */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Record Car Entry</h3>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plate Number *</label>
            <input
              type="text"
              required
              value={form.PlateNumber}
              onChange={e => setForm({ ...form, PlateNumber: e.target.value.toUpperCase() })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              placeholder="e.g. RAB 123 A"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slot Number *</label>
            <select
              required
              value={form.SlotNumber}
              onChange={e => setForm({ ...form, SlotNumber: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Available Slot --</option>
              {slots.map(s => (
                <option key={s._id} value={s.SlotNumber}>{s.SlotNumber}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entry Time *</label>
            <input
              type="datetime-local"
              required
              value={form.EntryTime}
              onChange={e => setForm({ ...form, EntryTime: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-800 hover:bg-blue-900 text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? 'Saving...' : '+ Record Entry'}
            </button>
          </div>
        </form>
      </div>

      {/* Exit Modal */}
      {editRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Record Car Exit</h3>
            <p className="text-sm text-gray-600 mb-1">Plate: <strong>{editRecord.PlateNumber}</strong></p>
            <p className="text-sm text-gray-600 mb-4">Entry: <strong>{fmt(editRecord.EntryTime)}</strong></p>
            <form onSubmit={handleExit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exit Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={exitTime}
                  onChange={e => setExitTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-60"
                >
                  {loading ? 'Saving...' : 'Confirm Exit'}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditRecord(null); setExitTime(''); }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Records Table */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">All Parking Records ({records.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-blue-800 text-white">
                <th className="px-3 py-3 text-left">#</th>
                <th className="px-3 py-3 text-left">Plate</th>
                <th className="px-3 py-3 text-left">Slot</th>
                <th className="px-3 py-3 text-left">Entry Time</th>
                <th className="px-3 py-3 text-left">Exit Time</th>
                <th className="px-3 py-3 text-left">Duration (hrs)</th>
                <th className="px-3 py-3 text-left">Status</th>
                <th className="px-3 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-6 text-gray-400">No records found.</td></tr>
              ) : (
                records.map((r, i) => (
                  <tr key={r._id} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-3 py-3">{i + 1}</td>
                    <td className="px-3 py-3 font-mono font-semibold text-blue-800">{r.PlateNumber}</td>
                    <td className="px-3 py-3">{r.SlotNumber}</td>
                    <td className="px-3 py-3">{fmt(r.EntryTime)}</td>
                    <td className="px-3 py-3">{fmt(r.ExitTime)}</td>
                    <td className="px-3 py-3">{r.ExitTime ? r.Duration.toFixed(2) : '—'}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${r.ExitTime ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'}`}>
                        {r.ExitTime ? 'Completed' : 'Parked'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        {!r.ExitTime && (
                          <button
                            onClick={() => { setEditRecord(r); setExitTime(''); }}
                            className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 rounded transition-colors"
                          >
                            Exit
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(r._id)}
                          className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
