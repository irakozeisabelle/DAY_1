import { useState } from 'react';
import api from '../api';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('bill');

  // Bill state
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState('');
  const [bill, setBill] = useState(null);
  const [billLoading, setBillLoading] = useState(false);
  const [billError, setBillError] = useState('');

  // Daily report state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyReport, setDailyReport] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyError, setDailyError] = useState('');

  const loadRecords = async () => {
    try {
      const res = await api.get('/records');
      setRecords(res.data.filter(r => r.ExitTime));
    } catch { /* handled */ }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'bill' && records.length === 0) loadRecords();
  };

  const fetchBill = async () => {
    if (!selectedRecord) return;
    setBillLoading(true);
    setBillError('');
    setBill(null);
    try {
      const res = await api.get(`/reports/bill/${selectedRecord}`);
      setBill(res.data);
    } catch (err) {
      setBillError(err.response?.data?.message || 'Error loading bill.');
    } finally {
      setBillLoading(false);
    }
  };

  const fetchDailyReport = async () => {
    setDailyLoading(true);
    setDailyError('');
    setDailyReport(null);
    try {
      const res = await api.get(`/reports/daily?date=${date}`);
      setDailyReport(res.data);
    } catch (err) {
      setDailyError(err.response?.data?.message || 'Error loading report.');
    } finally {
      setDailyLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const fmt = (dt) => dt ? new Date(dt).toLocaleString() : '—';

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-blue-800">📊 Reports</h2>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => handleTabChange('bill')}
          className={`px-5 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'bill' ? 'bg-blue-800 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          🧾 Invoice / Bill
        </button>
        <button
          onClick={() => handleTabChange('daily')}
          className={`px-5 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'daily' ? 'bg-blue-800 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          📅 Daily Report
        </button>
      </div>

      {/* ── BILL TAB ── */}
      {activeTab === 'bill' && (
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Generate Invoice / Bill</h3>
          <div className="flex gap-3 flex-wrap">
            <select
              value={selectedRecord}
              onChange={e => setSelectedRecord(e.target.value)}
              className="flex-1 min-w-[250px] border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select a completed parking session --</option>
              {records.map(r => (
                <option key={r._id} value={r._id}>
                  {r.PlateNumber} | Slot {r.SlotNumber} | {new Date(r.EntryTime).toLocaleString()}
                </option>
              ))}
            </select>
            <button
              onClick={fetchBill}
              disabled={!selectedRecord || billLoading}
              className="bg-blue-800 hover:bg-blue-900 text-white font-semibold px-5 py-2 rounded-lg transition-colors disabled:opacity-60"
            >
              {billLoading ? 'Loading...' : 'Generate Bill'}
            </button>
          </div>

          {billError && <div className="bg-red-50 border border-red-300 text-red-700 rounded p-3 text-sm">{billError}</div>}

          {bill && (
            <div id="bill-print" className="border-2 border-blue-800 rounded-xl p-6 max-w-lg mx-auto">
              {/* Header */}
              <div className="text-center mb-4 border-b pb-4">
                <div className="text-3xl mb-1">🅿</div>
                <h2 className="text-xl font-bold text-blue-800">SmartPark PSSMS</h2>
                <p className="text-gray-500 text-sm">Rubavu District, Western Province, Rwanda</p>
                <p className="text-gray-400 text-xs mt-1">PARKING INVOICE</p>
              </div>

              {/* Bill Details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b py-2">
                  <span className="text-gray-500">Plate Number</span>
                  <span className="font-bold font-mono text-blue-800">{bill.PlateNumber}</span>
                </div>
                <div className="flex justify-between border-b py-2">
                  <span className="text-gray-500">Slot Number</span>
                  <span className="font-semibold">{bill.SlotNumber}</span>
                </div>
                <div className="flex justify-between border-b py-2">
                  <span className="text-gray-500">Entry Time</span>
                  <span className="font-semibold">{fmt(bill.EntryTime)}</span>
                </div>
                <div className="flex justify-between border-b py-2">
                  <span className="text-gray-500">Exit Time</span>
                  <span className="font-semibold">{fmt(bill.ExitTime)}</span>
                </div>
                <div className="flex justify-between border-b py-2">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-semibold">{bill.Duration?.toFixed(2)} hours</span>
                </div>
                <div className="flex justify-between border-b py-2">
                  <span className="text-gray-500">Billable Hours</span>
                  <span className="font-semibold">{bill.BillableHours} hour(s)</span>
                </div>
                <div className="flex justify-between border-b py-2">
                  <span className="text-gray-500">Rate</span>
                  <span className="font-semibold">500 Rwf / hour</span>
                </div>
                <div className="flex justify-between border-b py-2">
                  <span className="text-gray-500">Payment Date</span>
                  <span className="font-semibold">{bill.PaymentDate ? fmt(bill.PaymentDate) : 'Not yet paid'}</span>
                </div>
                <div className="flex justify-between py-3 bg-blue-50 rounded-lg px-3 mt-2">
                  <span className="font-bold text-blue-800 text-base">TOTAL AMOUNT</span>
                  <span className="font-bold text-green-700 text-xl">{bill.AmountPaid?.toLocaleString()} Rwf</span>
                </div>
              </div>

              <p className="text-center text-gray-400 text-xs mt-4">Thank you for using SmartPark!</p>

              <div className="text-center mt-4 print:hidden">
                <button
                  onClick={handlePrint}
                  className="bg-blue-800 hover:bg-blue-900 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                >
                  🖨️ Print Invoice
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── DAILY REPORT TAB ── */}
      {activeTab === 'daily' && (
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Daily Parking Payment Report</h3>
          <div className="flex gap-3 flex-wrap">
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={fetchDailyReport}
              disabled={dailyLoading}
              className="bg-blue-800 hover:bg-blue-900 text-white font-semibold px-5 py-2 rounded-lg transition-colors disabled:opacity-60"
            >
              {dailyLoading ? 'Loading...' : 'Generate Report'}
            </button>
          </div>

          {dailyError && <div className="bg-red-50 border border-red-300 text-red-700 rounded p-3 text-sm">{dailyError}</div>}

          {dailyReport && (
            <div>
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-800 text-white rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold">{dailyReport.count}</p>
                  <p className="text-sm text-blue-200">Total Transactions</p>
                </div>
                <div className="bg-green-600 text-white rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold">{dailyReport.totalAmount?.toLocaleString()}</p>
                  <p className="text-sm text-green-100">Total Revenue (Rwf)</p>
                </div>
                <div className="bg-gray-700 text-white rounded-xl p-4 text-center">
                  <p className="text-lg font-bold">{dailyReport.date}</p>
                  <p className="text-sm text-gray-300">Report Date</p>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-blue-800 text-white">
                      <th className="px-4 py-3 text-left">#</th>
                      <th className="px-4 py-3 text-left">Plate Number</th>
                      <th className="px-4 py-3 text-left">Entry Time</th>
                      <th className="px-4 py-3 text-left">Exit Time</th>
                      <th className="px-4 py-3 text-left">Duration (hrs)</th>
                      <th className="px-4 py-3 text-left">Amount Paid (Rwf)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyReport.report.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-6 text-gray-400">No payments found for this date.</td></tr>
                    ) : (
                      dailyReport.report.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="px-4 py-3">{i + 1}</td>
                          <td className="px-4 py-3 font-mono font-semibold text-blue-800">{row.PlateNumber}</td>
                          <td className="px-4 py-3">{fmt(row.EntryTime)}</td>
                          <td className="px-4 py-3">{fmt(row.ExitTime)}</td>
                          <td className="px-4 py-3">{row.Duration?.toFixed(2)}</td>
                          <td className="px-4 py-3 font-semibold text-green-700">{row.AmountPaid?.toLocaleString()} Rwf</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {dailyReport.report.length > 0 && (
                    <tfoot>
                      <tr className="bg-blue-50 font-bold">
                        <td colSpan={5} className="px-4 py-3 text-right text-blue-800">TOTAL REVENUE:</td>
                        <td className="px-4 py-3 text-green-700 text-base">{dailyReport.totalAmount?.toLocaleString()} Rwf</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              <div className="text-center mt-4 print:hidden">
                <button
                  onClick={handlePrint}
                  className="bg-blue-800 hover:bg-blue-900 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                >
                  🖨️ Print Report
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
