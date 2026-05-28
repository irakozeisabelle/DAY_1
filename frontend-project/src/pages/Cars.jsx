import { useState, useEffect } from 'react';
import api from '../api';

export default function Cars() {
  const [cars, setCars] = useState([]);
  const [form, setForm] = useState({ PlateNumber: '', DriverName: '', PhoneNumber: '' });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const fetchCars = async () => {
    try {
      const res = await api.get('/cars');
      setCars(res.data);
    } catch {
      // handled by interceptor
    }
  };

  useEffect(() => { fetchCars(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });
    setLoading(true);
    try {
      await api.post('/cars', form);
      setMsg({ text: 'Car registered successfully!', type: 'success' });
      setForm({ PlateNumber: '', DriverName: '', PhoneNumber: '' });
      fetchCars();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Error registering car.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-blue-800">🚗 Car Registration</h2>

      {/* Form */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Register New Car</h3>
        {msg.text && (
          <div className={`rounded p-3 mb-4 text-sm border ${msg.type === 'success' ? 'bg-green-50 border-green-300 text-green-700' : 'bg-red-50 border-red-300 text-red-700'}`}>
            {msg.text}
          </div>
        )}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name *</label>
            <input
              type="text"
              required
              value={form.DriverName}
              onChange={e => setForm({ ...form, DriverName: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
            <input
              type="tel"
              required
              value={form.PhoneNumber}
              onChange={e => setForm({ ...form, PhoneNumber: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 0788000000"
            />
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-800 hover:bg-blue-900 text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? 'Saving...' : '+ Register Car'}
            </button>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Registered Cars ({cars.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-blue-800 text-white">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Plate Number</th>
                <th className="px-4 py-3 text-left">Driver Name</th>
                <th className="px-4 py-3 text-left">Phone Number</th>
                <th className="px-4 py-3 text-left">Registered At</th>
              </tr>
            </thead>
            <tbody>
              {cars.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-6 text-gray-400">No cars registered yet.</td></tr>
              ) : (
                cars.map((car, i) => (
                  <tr key={car._id} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-4 py-3">{i + 1}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-blue-800">{car.PlateNumber}</td>
                    <td className="px-4 py-3">{car.DriverName}</td>
                    <td className="px-4 py-3">{car.PhoneNumber}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(car.createdAt).toLocaleString()}</td>
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
