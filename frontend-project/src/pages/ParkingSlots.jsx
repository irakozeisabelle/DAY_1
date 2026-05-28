import { useState, useEffect } from 'react';
import api from '../api';

export default function ParkingSlots() {
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({ SlotNumber: '', SlotStatus: 'Available' });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const fetchSlots = async () => {
    try {
      const res = await api.get('/slots');
      setSlots(res.data);
    } catch { /* handled */ }
  };

  useEffect(() => { fetchSlots(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });
    setLoading(true);
    try {
      await api.post('/slots', form);
      setMsg({ text: 'Parking slot created successfully!', type: 'success' });
      setForm({ SlotNumber: '', SlotStatus: 'Available' });
      fetchSlots();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Error creating slot.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const available = slots.filter(s => s.SlotStatus === 'Available').length;
  const occupied  = slots.filter(s => s.SlotStatus === 'Occupied').length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-blue-800">🅿️ Parking Slots</h2>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-800 text-white rounded-xl p-4 text-center">
          <p className="text-3xl font-bold">{slots.length}</p>
          <p className="text-sm text-blue-200">Total Slots</p>
        </div>
        <div className="bg-green-600 text-white rounded-xl p-4 text-center">
          <p className="text-3xl font-bold">{available}</p>
          <p className="text-sm text-green-100">Available</p>
        </div>
        <div className="bg-red-500 text-white rounded-xl p-4 text-center">
          <p className="text-3xl font-bold">{occupied}</p>
          <p className="text-sm text-red-100">Occupied</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Add New Parking Slot</h3>
        {msg.text && (
          <div className={`rounded p-3 mb-4 text-sm border ${msg.type === 'success' ? 'bg-green-50 border-green-300 text-green-700' : 'bg-red-50 border-red-300 text-red-700'}`}>
            {msg.text}
          </div>
        )}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slot Number *</label>
            <input
              type="text"
              required
              value={form.SlotNumber}
              onChange={e => setForm({ ...form, SlotNumber: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. A1, B2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={form.SlotStatus}
              onChange={e => setForm({ ...form, SlotStatus: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-800 hover:bg-blue-900 text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? 'Saving...' : '+ Add Slot'}
            </button>
          </div>
        </form>
      </div>

      {/* Slot Grid */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Slot Overview</h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 mb-6">
          {slots.map(slot => (
            <div
              key={slot._id}
              className={`rounded-lg p-3 text-center text-sm font-bold border-2 ${
                slot.SlotStatus === 'Available'
                  ? 'bg-green-50 border-green-400 text-green-700'
                  : 'bg-red-50 border-red-400 text-red-700'
              }`}
            >
              <div>{slot.SlotNumber}</div>
              <div className="text-xs font-normal mt-1">{slot.SlotStatus === 'Available' ? '✅' : '🚗'}</div>
            </div>
          ))}
          {slots.length === 0 && <p className="col-span-8 text-gray-400 text-center py-4">No slots added yet.</p>}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-blue-800 text-white">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Slot Number</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Created At</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot, i) => (
                <tr key={slot._id} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold">{slot.SlotNumber}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      slot.SlotStatus === 'Available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {slot.SlotStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(slot.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
