const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// ─── MongoDB Connection ───────────────────────────────────────────────────────
mongoose.connect('mongodb://127.0.0.1:27017/PSSMS')
  .then(() => console.log('✅ Connected to MongoDB — PSSMS database'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ─── JWT Secret ───────────────────────────────────────────────────────────────
const JWT_SECRET = 'SmartPark@PSSMS#2025!SecureKey';

// ─── Middleware: Verify Token ─────────────────────────────────────────────────
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODELS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── User Model ───────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.model('User', userSchema);

// ─── ParkingSlot Model ────────────────────────────────────────────────────────
const parkingSlotSchema = new mongoose.Schema({
  SlotNumber: { type: String, required: true, unique: true, trim: true },
  SlotStatus: { type: String, enum: ['Available', 'Occupied'], default: 'Available' },
}, { timestamps: true });

const ParkingSlot = mongoose.model('ParkingSlot', parkingSlotSchema);

// ─── Car Model ────────────────────────────────────────────────────────────────
const carSchema = new mongoose.Schema({
  PlateNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
  DriverName:  { type: String, required: true, trim: true },
  PhoneNumber: { type: String, required: true, trim: true },
}, { timestamps: true });

const Car = mongoose.model('Car', carSchema);

// ─── ParkingRecord Model ──────────────────────────────────────────────────────
const parkingRecordSchema = new mongoose.Schema({
  PlateNumber: { type: String, required: true, trim: true, uppercase: true },
  SlotNumber:  { type: String, required: true, trim: true },
  EntryTime:   { type: Date, required: true },
  ExitTime:    { type: Date, default: null },
  Duration:    { type: Number, default: 0 }, // hours (decimal)
}, { timestamps: true });

const ParkingRecord = mongoose.model('ParkingRecord', parkingRecordSchema);

// ─── Payment Model ────────────────────────────────────────────────────────────
const paymentSchema = new mongoose.Schema({
  ParkingRecordId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'ParkingRecord' },
  PlateNumber:     { type: String, required: true, trim: true, uppercase: true },
  AmountPaid:      { type: Number, required: true },
  PaymentDate:     { type: Date, default: Date.now },
}, { timestamps: true });

const Payment = mongoose.model('Payment', paymentSchema);

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

// Calculate duration in hours and fee (500 Rwf/hour, minimum 1 hour)
const calculateFee = (entryTime, exitTime) => {
  const diffMs = new Date(exitTime) - new Date(entryTime);
  const diffHours = diffMs / (1000 * 60 * 60);
  const billableHours = diffHours < 1 ? 1 : Math.ceil(diffHours);
  const duration = Math.round(diffHours * 100) / 100;
  const amount = billableHours * 500;
  return { duration, billableHours, amount };
};

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES — AUTH
// ═══════════════════════════════════════════════════════════════════════════════

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'Username and password are required.' });
    if (await User.findOne({ username }))
      return res.status(409).json({ message: 'Username already exists.' });
    await new User({ username, password }).save();
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'Username and password are required.' });
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid credentials.' });
    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES — PARKING SLOTS
// ═══════════════════════════════════════════════════════════════════════════════

// GET all slots
app.get('/api/slots', verifyToken, async (req, res) => {
  try {
    const slots = await ParkingSlot.find().sort({ SlotNumber: 1 });
    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// GET available slots
app.get('/api/slots/available', verifyToken, async (req, res) => {
  try {
    const slots = await ParkingSlot.find({ SlotStatus: 'Available' }).sort({ SlotNumber: 1 });
    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// POST create slot
app.post('/api/slots', verifyToken, async (req, res) => {
  try {
    const { SlotNumber, SlotStatus } = req.body;
    if (!SlotNumber)
      return res.status(400).json({ message: 'Slot number is required.' });
    const slot = await new ParkingSlot({ SlotNumber, SlotStatus: SlotStatus || 'Available' }).save();
    res.status(201).json({ message: 'Parking slot created successfully.', slot });
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ message: 'Slot number already exists.' });
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES — CARS
// ═══════════════════════════════════════════════════════════════════════════════

// GET all cars
app.get('/api/cars', verifyToken, async (req, res) => {
  try {
    const cars = await Car.find().sort({ createdAt: -1 });
    res.json(cars);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// GET single car by plate
app.get('/api/cars/:plateNumber', verifyToken, async (req, res) => {
  try {
    const car = await Car.findOne({ PlateNumber: req.params.plateNumber.toUpperCase() });
    if (!car) return res.status(404).json({ message: 'Car not found.' });
    res.json(car);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// POST create car
app.post('/api/cars', verifyToken, async (req, res) => {
  try {
    const { PlateNumber, DriverName, PhoneNumber } = req.body;
    if (!PlateNumber || !DriverName || !PhoneNumber)
      return res.status(400).json({ message: 'All fields are required.' });
    const car = await new Car({ PlateNumber, DriverName, PhoneNumber }).save();
    res.status(201).json({ message: 'Car registered successfully.', car });
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ message: 'Plate number already exists.' });
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES — PARKING RECORDS
// ═══════════════════════════════════════════════════════════════════════════════

// GET all records
app.get('/api/records', verifyToken, async (req, res) => {
  try {
    const records = await ParkingRecord.find().sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// GET single record
app.get('/api/records/:id', verifyToken, async (req, res) => {
  try {
    const record = await ParkingRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found.' });
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// POST create record (car entry)
app.post('/api/records', verifyToken, async (req, res) => {
  try {
    const { PlateNumber, SlotNumber, EntryTime } = req.body;
    if (!PlateNumber || !SlotNumber || !EntryTime)
      return res.status(400).json({ message: 'PlateNumber, SlotNumber and EntryTime are required.' });

    // Check car exists
    const car = await Car.findOne({ PlateNumber: PlateNumber.toUpperCase() });
    if (!car) return res.status(404).json({ message: 'Car not found. Register the car first.' });

    // Check slot exists and is available
    const slot = await ParkingSlot.findOne({ SlotNumber });
    if (!slot) return res.status(404).json({ message: 'Slot not found.' });
    if (slot.SlotStatus === 'Occupied')
      return res.status(400).json({ message: 'Slot is already occupied.' });

    // Mark slot as occupied
    slot.SlotStatus = 'Occupied';
    await slot.save();

    const record = await new ParkingRecord({ PlateNumber, SlotNumber, EntryTime }).save();
    res.status(201).json({ message: 'Parking record created successfully.', record });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// PUT update record (car exit — sets ExitTime, calculates Duration)
app.put('/api/records/:id', verifyToken, async (req, res) => {
  try {
    const record = await ParkingRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found.' });

    const { ExitTime } = req.body;
    if (!ExitTime) return res.status(400).json({ message: 'ExitTime is required.' });
    if (record.ExitTime) return res.status(400).json({ message: 'Car has already exited.' });

    const { duration } = calculateFee(record.EntryTime, ExitTime);

    record.ExitTime = new Date(ExitTime);
    record.Duration = duration;
    await record.save();

    // Free the slot
    await ParkingSlot.findOneAndUpdate({ SlotNumber: record.SlotNumber }, { SlotStatus: 'Available' });

    res.json({ message: 'Exit recorded successfully.', record });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// DELETE record
app.delete('/api/records/:id', verifyToken, async (req, res) => {
  try {
    const record = await ParkingRecord.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found.' });

    // Free the slot if still occupied
    await ParkingSlot.findOneAndUpdate({ SlotNumber: record.SlotNumber }, { SlotStatus: 'Available' });

    res.json({ message: 'Record deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES — PAYMENTS
// ═══════════════════════════════════════════════════════════════════════════════

// GET all payments
app.get('/api/payments', verifyToken, async (req, res) => {
  try {
    const payments = await Payment.find().sort({ PaymentDate: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// GET single payment (bill) by ParkingRecordId
app.get('/api/payments/record/:recordId', verifyToken, async (req, res) => {
  try {
    const payment = await Payment.findOne({ ParkingRecordId: req.params.recordId });
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// POST create payment
app.post('/api/payments', verifyToken, async (req, res) => {
  try {
    const { ParkingRecordId, PlateNumber, AmountPaid, PaymentDate } = req.body;
    if (!ParkingRecordId || !PlateNumber || AmountPaid === undefined)
      return res.status(400).json({ message: 'ParkingRecordId, PlateNumber and AmountPaid are required.' });

    const record = await ParkingRecord.findById(ParkingRecordId);
    if (!record) return res.status(404).json({ message: 'Parking record not found.' });
    if (!record.ExitTime) return res.status(400).json({ message: 'Car has not exited yet.' });

    const existing = await Payment.findOne({ ParkingRecordId });
    if (existing) return res.status(409).json({ message: 'Payment already recorded for this session.' });

    const payment = await new Payment({
      ParkingRecordId,
      PlateNumber,
      AmountPaid,
      PaymentDate: PaymentDate || Date.now(),
    }).save();

    res.status(201).json({ message: 'Payment recorded successfully.', payment });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES — REPORTS
// ═══════════════════════════════════════════════════════════════════════════════

// GET bill for a parking record
app.get('/api/reports/bill/:recordId', verifyToken, async (req, res) => {
  try {
    const record = await ParkingRecord.findById(req.params.recordId);
    if (!record) return res.status(404).json({ message: 'Record not found.' });
    if (!record.ExitTime) return res.status(400).json({ message: 'Car has not exited yet.' });

    const { amount, billableHours } = calculateFee(record.EntryTime, record.ExitTime);
    const payment = await Payment.findOne({ ParkingRecordId: record._id });

    res.json({
      PlateNumber:  record.PlateNumber,
      SlotNumber:   record.SlotNumber,
      EntryTime:    record.EntryTime,
      ExitTime:     record.ExitTime,
      Duration:     record.Duration,
      BillableHours: billableHours,
      AmountPaid:   payment ? payment.AmountPaid : amount,
      PaymentDate:  payment ? payment.PaymentDate : null,
      RatePerHour:  500,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// GET daily parking payment report
app.get('/api/reports/daily', verifyToken, async (req, res) => {
  try {
    // Optional ?date=YYYY-MM-DD query param; defaults to today
    const dateParam = req.query.date;
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    const payments = await Payment.find({
      PaymentDate: { $gte: start, $lte: end },
    }).sort({ PaymentDate: 1 });

    const report = await Promise.all(payments.map(async (p) => {
      const record = await ParkingRecord.findById(p.ParkingRecordId);
      return {
        PlateNumber: p.PlateNumber,
        EntryTime:   record ? record.EntryTime : null,
        ExitTime:    record ? record.ExitTime  : null,
        Duration:    record ? record.Duration  : null,
        AmountPaid:  p.AmountPaid,
        PaymentDate: p.PaymentDate,
      };
    }));

    const totalAmount = report.reduce((sum, r) => sum + r.AmountPaid, 0);
    res.json({ date: targetDate.toISOString().split('T')[0], totalAmount, count: report.length, report });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════════════════════
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚗 SmartPark PSSMS backend running on http://localhost:${PORT}`);
});
