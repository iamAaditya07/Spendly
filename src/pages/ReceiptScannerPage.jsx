import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { DEFAULT_CATEGORIES } from '../utils/constants';
import {
  scanReceiptImage,
  checkDuplicateTransaction,
  confirmAndSaveReceipt,
  getReceiptScansHistory
} from '../services/receiptService';
import {
  Camera,
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ShoppingBag,
  Trash2,
  Plus,
  ArrowRight,
  ShieldCheck,
  Receipt,
  Clock,
  Layers,
  ChevronRight
} from 'lucide-react';

// Pre-packaged realistic campus receipt presets for 1-click testing
const SAMPLE_CAMPUS_RECEIPTS = [
  {
    id: 'sample_canteen',
    title: 'Campus Food Court Bill',
    merchant: 'Amul & Canteen Kiosk',
    amount: 195.00,
    category: 'canteen',
    date: new Date().toISOString().split('T')[0],
    items: [
      { name: 'Paneer Butter Thali', price: 130, qty: 1 },
      { name: 'Sweet Lassi', price: 40, qty: 1 },
      { name: 'Extra Butter Naan', price: 25, qty: 1 }
    ],
    rawText: 'AMUL & CANTEEN KIOSK\nNORTH CAMPUS\nGSTIN: 07AABCU9603R1ZM\n1. Paneer Butter Thali  130.00\n2. Sweet Lassi          40.00\n3. Extra Butter Naan    25.00\n------------------------------\nTOTAL AMOUNT:         Rs 195.00\nPAID VIA UPI / GPAY\nTHANK YOU FOR VISITING!'
  },
  {
    id: 'sample_books',
    title: 'University Book House',
    merchant: 'Sapna Book House (Campus)',
    amount: 540.00,
    category: 'books',
    date: new Date().toISOString().split('T')[0],
    items: [
      { name: 'Engineering Mathematics Vol 2', price: 420, qty: 1 },
      { name: 'Classmate Spiral Register (300 pgs)', price: 120, qty: 1 }
    ],
    rawText: 'SAPNA BOOK HOUSE\nCOLLEGE ROAD BRANCH\nINVOICE #BK-2026-9041\nEngg Mathematics Vol 2  420.00\nClassmate Spiral Reg    120.00\n------------------------------\nGRAND TOTAL:           INR 540.00\nPAYMENT: CASH RECEIVED\nGOOD LUCK WITH YOUR EXAMS!'
  },
  {
    id: 'sample_xerox',
    title: 'Campus Xerox & Print Shop',
    merchant: 'Student Xerox & Binding Centre',
    amount: 85.00,
    category: 'books',
    date: new Date().toISOString().split('T')[0],
    items: [
      { name: 'Lab Manual B&W Print (40 pgs)', price: 40, qty: 1 },
      { name: 'Hard Spiral Binding', price: 45, qty: 1 }
    ],
    rawText: 'STUDENT XEROX & BINDING\nLIBRARY BASEMENT\nLab Manual B&W Print    40.00\nHard Spiral Binding     45.00\n------------------------------\nNET AMOUNT:             Rs 85.00\nPAID VIA PHONEPE'
  }
];

export default function ReceiptScannerPage() {
  const { user } = useAuth();
  const { setCurrentPage } = useApp();
  const fileInputRef = useRef(null);

  // Upload & Scanning state
  const [imagePreview, setImagePreview] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusText, setScanStatusText] = useState('');
  const [scanComplete, setScanComplete] = useState(false);
  const [scanErrorNotice, setScanErrorNotice] = useState(null);

  // Extracted and Editable Form State
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('canteen');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);
  const [isCampusExpense, setIsCampusExpense] = useState(true);

  // Duplicate warning state
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [savingTransaction, setSavingTransaction] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(null);

  // Recent scans
  const [recentScans, setRecentScans] = useState([]);

  useEffect(() => {
    if (user?.id) {
      loadHistory();
    }
  }, [user?.id]);

  const loadHistory = async () => {
    try {
      const history = await getReceiptScansHistory(user?.id);
      setRecentScans(history);
    } catch (e) {
      console.error('Error loading scans history:', e);
    }
  };

  // Handle file select (JPG, JPEG, PNG)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      alert('Please upload a valid JPG, JPEG, or PNG image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);
      executeScan(event.target.result, file.name);
    };
    reader.readAsDataURL(file);
  };

  // Execute OCR Scan
  const executeScan = async (imgSource, filename = 'receipt.png') => {
    setIsScanning(true);
    setScanProgress(5);
    setScanStatusText('Initializing OCR Engine...');
    setScanComplete(false);
    setScanErrorNotice(null);
    setDuplicateWarning(null);
    setSaveSuccess(null);

    try {
      const result = await scanReceiptImage(imgSource, (progressObj) => {
        setScanProgress(progressObj.progress);
        setScanStatusText(progressObj.status);
      });

      if (result.success && result.data) {
        const d = result.data;
        setMerchant(d.merchant);
        setAmount(d.amount ? String(d.amount) : '');
        setDate(d.date || new Date().toISOString().split('T')[0]);
        setCategoryId(d.category || 'canteen');
        setItems(d.items || []);
        setNotes(d.items.length > 0 ? `Scanned: ${d.items.map(i => i.name).join(', ')}` : 'Scanned receipt');
        setScanComplete(true);
        if (result.errorNotice) {
          setScanErrorNotice(result.errorNotice);
        }

        // Check for duplicate in database
        checkDuplicate(d.amount, d.date, d.merchant);
      }
    } catch (err) {
      console.error('Scan error:', err);
      setScanErrorNotice('OCR could not read text clearly. You can enter details manually.');
      setScanComplete(true);
    } finally {
      setIsScanning(false);
    }
  };

  // 1-Click Sample Receipt Loader
  const loadSampleReceipt = (sample) => {
    setImagePreview(null);
    setIsScanning(true);
    setScanProgress(20);
    setScanStatusText('Loading preset campus receipt...');
    setScanErrorNotice(null);
    setDuplicateWarning(null);
    setSaveSuccess(null);

    setTimeout(() => {
      setScanProgress(80);
      setScanStatusText('Parsing line items and totals...');
      setTimeout(() => {
        setMerchant(sample.merchant);
        setAmount(String(sample.amount));
        setDate(sample.date);
        setCategoryId(sample.category);
        setItems(sample.items);
        setNotes(sample.items.map(i => i.name).join(', '));
        setScanProgress(100);
        setIsScanning(false);
        setScanComplete(true);
        checkDuplicate(sample.amount, sample.date, sample.merchant);
      }, 400);
    }, 500);
  };

  const checkDuplicate = async (amt, dte, desc) => {
    if (!amt || !user?.id) return;
    const dup = await checkDuplicateTransaction(user.id, {
      amount: amt,
      date: dte,
      description: desc
    });
    setDuplicateWarning(dup);
  };

  // Item Management inside Review Form
  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = field === 'price' ? parseFloat(value) || 0 : value;
    setItems(updated);

    // Auto update total amount if items are present
    const newTotal = updated.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
    if (newTotal > 0) {
      setAmount(String(newTotal.toFixed(2)));
    }
  };

  const addItemRow = () => {
    setItems([...items, { name: '', price: 0, qty: 1 }]);
  };

  const removeItemRow = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    if (updated.length > 0) {
      const newTotal = updated.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
      setAmount(String(newTotal.toFixed(2)));
    }
  };

  // Confirm and Save to Transactions
  const handleConfirmAndSave = async (overrideDuplicate = false) => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (!merchant.trim()) {
      alert('Please enter a merchant or store name.');
      return;
    }

    if (duplicateWarning && !overrideDuplicate) {
      return; // wait for user confirmation
    }

    setSavingTransaction(true);
    try {
      const res = await confirmAndSaveReceipt({
        userId: user?.id,
        merchant: merchant.trim(),
        amount: parseFloat(amount),
        date,
        categoryId,
        paymentMethod,
        notes,
        items,
        receiptImage: imagePreview,
        isCampusExpense
      });

      setSaveSuccess(res.transaction);
      setDuplicateWarning(null);
      loadHistory();
    } catch (e) {
      console.error('Failed to save receipt transaction:', e);
      alert('Failed to save transaction: ' + e.message);
    } finally {
      setSavingTransaction(false);
    }
  };

  const resetForm = () => {
    setImagePreview(null);
    setScanComplete(false);
    setMerchant('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setCategoryId('canteen');
    setItems([]);
    setNotes('');
    setDuplicateWarning(null);
    setSaveSuccess(null);
    setScanErrorNotice(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const expenseCategories = DEFAULT_CATEGORIES.filter((c) => c.type === 'expense');

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Camera className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Smart Receipt Scanner
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Upload campus canteen slips, book invoices, or xerox bills. AI parses the store, items, and totals for 1-click confirmation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage('transactions')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all shadow-sm"
          >
            <Receipt className="w-4 h-4 text-brand-500" />
            View All Transactions
          </button>
        </div>
      </div>

      {/* Main Grid: Upload Zone vs Review Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Upload & Image Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-brand-600" />
                Upload Receipt Image
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                JPG, PNG, JPEG
              </span>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Drag & Drop Box */}
            {!imagePreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 rounded-2xl p-8 text-center transition-all bg-slate-50/50 dark:bg-slate-800/20 hover:bg-brand-50/20 dark:hover:bg-brand-950/20 flex flex-col items-center justify-center min-h-[240px]"
              >
                <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-inner">
                  <Camera className="w-7 h-7" />
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Click to Browse or Drag Receipt
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[200px]">
                  Canteen bill, xerox receipt, or cafe token slip
                </p>
                <button
                  type="button"
                  className="mt-4 px-4 py-2 text-xs font-bold rounded-xl bg-brand-600 text-white shadow-md shadow-brand-500/20 group-hover:bg-brand-500 transition-colors"
                >
                  Choose File
                </button>
              </div>
            ) : (
              /* Image Thumbnail & Rescan Controls */
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950/5 max-h-[320px] flex items-center justify-center group">
                  <img
                    src={imagePreview}
                    alt="Receipt preview"
                    className="object-contain w-full max-h-[300px] rounded-xl"
                  />
                  {/* Scan Laser Overlay animation when scanning */}
                  {isScanning && (
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/20 to-transparent animate-pulse pointer-events-none border-b-2 border-brand-500" />
                  )}
                  <button
                    onClick={resetForm}
                    className="absolute top-3 right-3 p-2 bg-slate-900/70 hover:bg-red-600 text-white rounded-xl backdrop-blur-md transition-colors"
                    title="Remove and upload another"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isScanning}
                    className="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload Different Photo
                  </button>
                  <button
                    onClick={() => executeScan(imagePreview)}
                    disabled={isScanning}
                    className="px-3 py-2 text-xs font-semibold rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 hover:bg-brand-100 transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                    Re-scan
                  </button>
                </div>
              </div>
            )}

            {/* Scanning Progress Bar */}
            {isScanning && (
              <div className="p-4 rounded-xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200/60 dark:border-brand-900/60 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-brand-900 dark:text-brand-300">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-brand-600 animate-spin" />
                    {scanStatusText}
                  </span>
                  <span>{scanProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-brand-200 dark:bg-brand-900 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-600 to-campus-cyan rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error or Fallback Warning */}
            {scanErrorNotice && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/80 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{scanErrorNotice}</span>
              </div>
            )}

            {/* 1-Click Sample Receipts */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Or Try A Sample Campus Bill:
              </p>
              <div className="grid grid-cols-1 gap-2">
                {SAMPLE_CAMPUS_RECEIPTS.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => loadSampleReceipt(sample)}
                    disabled={isScanning}
                    className="w-full text-left p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-600 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {sample.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {sample.merchant} • {formatCurrency(sample.amount)}
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                      Load <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Preview & Confirmation Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-600" />
                  Extracted Receipt Details
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Review and make any necessary corrections before saving into your official ledger.
                </p>
              </div>

              {scanComplete && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Ready to Review
                </span>
              )}
            </div>

            {/* Saved Success Banner */}
            {saveSuccess && (
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                      Transaction Confirmed & Recorded!
                    </h4>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300">
                      Saved {formatCurrency(saveSuccess.amount)} for "{saveSuccess.description}" to your expense ledger.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setCurrentPage('transactions')}
                    className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-1.5 transition-colors"
                  >
                    View in Transactions Ledger
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 transition-colors"
                  >
                    Scan Another Receipt
                  </button>
                </div>
              </div>
            )}

            {/* Duplicate Warning Alert */}
            {duplicateWarning && !saveSuccess && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 space-y-2">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wider">
                      Potential Duplicate Detected
                    </h4>
                    <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                      You already have a recorded transaction of{' '}
                      <strong>{formatCurrency(duplicateWarning.amount)}</strong> on{' '}
                      <strong>{formatDate(duplicateWarning.date)}</strong> ("{duplicateWarning.description}").
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 justify-end">
                  <button
                    onClick={() => setDuplicateWarning(null)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 hover:bg-amber-200 transition-colors"
                  >
                    Dismiss Warning
                  </button>
                  <button
                    onClick={() => handleConfirmAndSave(true)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition-colors"
                  >
                    Save Anyway
                  </button>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Merchant Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Merchant / Store Name *
                  </label>
                  <input
                    type="text"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    placeholder="e.g. Campus Canteen, Sapna Books"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                  />
                </div>

                {/* Total Amount */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Total Amount (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3.5 py-2.5 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                  />
                </div>

                {/* Category with Auto-detection badge */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center justify-between">
                    <span>Category</span>
                    {scanComplete && (
                      <span className="text-[10px] text-brand-600 dark:text-brand-400 lowercase font-medium flex items-center gap-0.5">
                        <Sparkles className="w-3 h-3" /> auto-suggested
                      </span>
                    )}
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                  >
                    {expenseCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                  >
                    <option value="UPI">UPI (GPay/PhonePe/Paytm)</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="NetBanking">Net Banking</option>
                  </select>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-brand-500" />
                    Individual Purchased Items ({items.length})
                  </label>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Item
                  </button>
                </div>

                {items.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                    No individual line items parsed. Total will be recorded as a single expense.
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-3"
                      >
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                          placeholder="Item name"
                          className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                        <div className="w-28 relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                            ₹
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                            placeholder="Price"
                            className="w-full pl-6 pr-2 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Campus Expense Checkbox & Notes */}
              <div className="pt-2 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isCampusExpense}
                    onChange={(e) => setIsCampusExpense(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 dark:bg-slate-800 dark:border-slate-700"
                  />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Include in Campus Monthly Expense Analytics
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional context or roommate split tag..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => handleConfirmAndSave(false)}
                disabled={savingTransaction || isScanning || !amount}
                className="w-full sm:w-auto flex-1 py-3 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-brand-600 via-indigo-600 to-campus-cyan hover:opacity-95 text-white shadow-lg shadow-brand-500/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {savingTransaction ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Recording Transaction...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Confirm & Save to Ledger
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="w-full sm:w-auto px-5 py-3 rounded-xl font-semibold text-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scanned Receipts History Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Scanned Receipts ({recentScans.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">Audited OCR Submissions</span>
        </div>

        {recentScans.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            No scanned receipts yet. Upload your first campus bill above!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-x-auto">
            {recentScans.map((scan) => (
              <div
                key={scan.id}
                className="py-3.5 flex items-center justify-between gap-4 text-sm hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {scan.merchant_name || 'Scanned Receipt'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDate(scan.detected_date || scan.created_at)} •{' '}
                      {scan.items?.length || 0} line item(s)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {formatCurrency(scan.total_amount)}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 uppercase tracking-wider">
                    {scan.status || 'Confirmed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
