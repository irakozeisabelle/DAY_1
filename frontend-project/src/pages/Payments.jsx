import { useState, useEffect } from 'react';
import api from '../api';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [bill, setBill] = useState(null);
  const [form, setForm] = useState({ ParkingRecordId: '', PlateNumber: '', AmountPaid: '', PaymentDate: '' });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    try {
      const [payRes, recRes] = await Promise.all([api.get('/payments'), api.get('/records')]);
      setPayments(payRes.data);
      // Only completed (exited) records without payment
      setRecords(recRes.data.filter(r => r.ExitTime));
    } catch { /* handled */ }
  };

  useEffect(() => { fetchAll(); }, []);

  const showMsg = (text, type) => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  const handleRecordSelect = async (recordId) => {
    if (!recordId) { setSelectedRecord(null); setBill(null); setForm({ ParkingRecordId: '', PlateNumber: '', AmountPaid: '', PaymentDate: '' }); return; }
    try {
      const res = await api.get(`/reports/bill/${recordId}`);
      const b = res.data;
      setBill(b);
      setSelectedRecord(recordId);
      const today = new Date().toISOString().slice(0, 16);
      setForm({
        ParkingRecordId: recordId,
        PlateNumber: b.PlateNumber,
        AmountPaid: b.AmountPaid,
        PaymentDate: today,
      });
    } catch (err) {
      showMsg(err.response?.data?.message || 'Error loading bill.', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/payments', form);
      showMsg('Payment recorded successfully!', 'success');
      setForm({ ParkingRecordId: '', PlateNumber: '', AmountPaid: '', PaymentDate: '' });
      setSelectedRecord(null);
      setBill(null);
      fetchAll();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Error recording payment.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (dt) => dt ? new Date(dt).toLocaleString() : '—';

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-blue-800">💳 Payments</h2>

      {msg.text && (
        <div className={`rounded p-3 text-sm border ${msg.type === 'success' ? 'bg-green-50 border-green-300 text-green-700' : 'bg-red-50 border-red-300 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      {/* Payment Form */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Record Payment</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Completed Parking Session *</label>
          <select
            value={selectedRecord || ''}
            onChange={e => handleRecordSelect(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select a parking record --</option>
            {records.map(r => (
              <option key={r._id} value={r._id}>
                {r.PlateNumber} | Slot {r.SlotNumber} | Entry: {new Date(r.EntryTime).toLocaleString()}
              </option>
            ))}
          </select>
        </div>

        {/* Bill Preview */}
        {bill && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-blue-800 mb-2">📄 Bill Preview</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <div><span className="text-gray-500">Plate:</span> <strong>{bill.PlateNumber}</strong></div>
              <div><span className="text-gray-500">Slot:</span> <strong>{bill.SlotNumber}</strong></div>
              <div><span className="text-gray-500">Entry:</span> <strong>{fmt(bill.EntryTime)}</strong></div>
              <div><span className="text-gray-500">Exit:</span> <strong>{fmt(bill.ExitTime)}</strong></div>
              <div><span className="text-gray-500">Duration:</span> <strong>{bill.Duration?.toFixed(2)} hrs</strong></div>
              <div><span className="text-gray-500">Billable Hours:</span> <strong>{bill.BillableHours} hrs</strong></div>
              <div><span className="text-gray-500">Rate:</span> <strong>500 Rwf/hr</strong></div>
              <div className="col-span-2 md:col-span-1">
                <span className="text-gray-500">Amount Due:</span>{' '}
                <strong className="text-green-700 text-lg">{bill.AmountPaid?.toLocaleString()} Rwf</strong>
              </div>
            </div>
          </div>
        )}

        {selectedRecord && (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plate Number</label>
              <input
                type="text"
                readOnly
                value={form.PlateNumber}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (Rwf) *</label>
              <input
                type="number"
                required
                min={0}
                value={form.AmountPaid}
                onChange={e => setForm({ ...form, AmountPaid: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date *</label>
              <input
                type="datetime-local"
                required
                value={form.PaymentDate}
                onChange={e => setForm({ ...form, PaymentDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-60"
              >
                {loading ? 'Processing...' : '✅ Confirm Payment'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Payment History ({payments.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-blue-800 text-white">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Plate Number</th>
                <th className="px-4 py-3 text-left">Amount Paid (Rwf)</th>
                <th className="px-4 py-3 text-left">Payment Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-6 text-gray-400">No payments recorded yet.</td></tr>
              ) : (
                payments.map((p, i) => (
                  <tr key={p._id} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-4 py-3">{i + 1}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-blue-800">{p.PlateNumber}</td>
                    <td className="px-4 py-3 font-semibold text-green-700">{p.AmountPaid.toLocaleString()} Rwf</td>
                    <td className="px-4 py-3 text-gray-500">{fmt(p.PaymentDate)}</td>
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
