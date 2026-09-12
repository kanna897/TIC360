'use client';

import React, { useState, useMemo } from 'react';
import {
  HeartHandshake,
  Search,
  Download,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Building,
  Calendar,
  DollarSign,
  Filter,
  Check,
  Eye,
  Edit2,
  Users,
  Phone,
  Mail,
  MapPin,
  FileText,
  UserCheck,
  UploadCloud,
  Upload,
  FileSpreadsheet,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useStore } from '@/lib/store';
import { Student, BlossomPaymentStatus } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatCurrency, formatDate, exportToCSV, exportToExcel, formatMonthName } from '@/lib/utils';
import { SRI_LANKA_BANKS, getBankByName } from '@/lib/sriLankaBanks';

export default function BlossomPaymentsPage() {
  const {
    students,
    blossomPayments,
    monthlyAttendance,
    updatePaymentStatus,
    updateStudent,
    recalculateMonthlyPayments,
    bulkImportBlossomStudents,
    settings,
    currentRole,
    attendanceSessions,
    attendanceMarks,
  } = useStore();

  // Active Tab: 'details' (Blossom Trust Student Details Table) | 'monthly' (Monthly Disbursement Ledger)
  const [activeTab, setActiveTab] = useState<'details' | 'monthly'>('details');

  // Year & Month for Monthly Disbursement Ledger
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonthOnly, setSelectedMonthOnly] = useState<string>('08'); // August
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Student for View Modal
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Editing Student for Bank Details Modal
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Excel Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [parsedExcelRows, setParsedExcelRows] = useState<any[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [importSummary, setImportSummary] = useState<{ updatedCount: number; createdCount: number } | null>(null);

  // Pagination State for Blossom Students Table
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const selectedMonthString = `${selectedYear}-${selectedMonthOnly}`; // '2026-08'

  // Only Blossom Trust Students (or all students with search & district filtering)
  const blossomStudents = useMemo(() => {
    return students.filter((s) => {
      const isBlossom = s.isBlossomTrust;
      const matchesSearch =
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.utNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone.includes(searchQuery) ||
        (s.bankDetails?.bankName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.bankDetails?.accountNumber || '').includes(searchQuery);

      const matchesDistrict = districtFilter === 'all' || s.district === districtFilter;

      return isBlossom && matchesSearch && matchesDistrict;
    });
  }, [students, searchQuery, districtFilter]);

  // Unique Districts for Filter
  const uniqueDistricts = useMemo(() => {
    return Array.from(new Set(students.map((s) => s.district).filter(Boolean)));
  }, [students]);

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, districtFilter, students]);

  const totalPages = Math.ceil(blossomStudents.length / itemsPerPage);
  const paginatedBlossomStudents = useMemo(() => {
    return blossomStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [blossomStudents, currentPage]);

  // Payments for this month
  const currentMonthPayments = useMemo(() => {
    return blossomPayments.filter((p) => p.month === selectedMonthString);
  }, [blossomPayments, selectedMonthString]);

  // Filtered monthly payments list
  const filteredPayments = useMemo(() => {
    return currentMonthPayments.filter((p) => {
      const matchesSearch =
        p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.utNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [currentMonthPayments, searchQuery, statusFilter]);

  // Monthly Calculations
  const eligibleCount = currentMonthPayments.filter((p) => p.isEligible).length;
  const paidCount = currentMonthPayments.filter((p) => p.status === 'Paid').length;
  const notEligibleCount = currentMonthPayments.filter((p) => !p.isEligible).length;
  const totalPayableAmount = currentMonthPayments
    .filter((p) => p.isEligible)
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPaidAmount = currentMonthPayments
    .filter((p) => p.status === 'Paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const handleBatchMarkPaid = () => {
    const ref = `BTR-${selectedMonthString.replace('-', '')}-${Math.floor(100 + Math.random() * 900)}`;
    currentMonthPayments.forEach((p) => {
      if (p.isEligible && p.status !== 'Paid') {
        updatePaymentStatus(p.id, 'Paid', ref, 'Bank transfer executed');
      }
    });
  };

  // Export Blossom Trust Beneficiary Student Details (Exact 11 Columns)
  const handleExportBlossomStudentDetailsExcel = () => {
    const exportData = blossomStudents.map((s, idx) => ({
      'NO': idx + 1,
      'UT NO': s.utNumber,
      'NAME': s.fullName,
      'PHONE NO': s.phone.replace('+94 ', '0').replace(/ /g, ''),
      'DISTRICT': s.district,
      'BENEFICIARY NAME': s.bankDetails?.beneficiaryName || s.fullName,
      'BLOSSOM TRUST AMT': s.isBlossomTrust ? 'LKR 15,000' : 'LKR 0',
      'BANK': s.bankDetails?.bankName || 'N/A',
      'BRANCH NAME': s.bankDetails?.branchName || 'N/A',
      'BR. CODE': s.bankDetails?.branchCode || '1',
      'ACCOUNT NO': s.bankDetails?.accountNumber || 'N/A',
    }));

    exportToExcel('TIC360_Blossom_Trust_Student_Details', [
      { sheetName: 'Blossom Trust Details', data: exportData },
    ]);
  };

  const handleExportBlossomStudentDetailsCSV = () => {
    const exportData = blossomStudents.map((s, idx) => ({
      'NO': idx + 1,
      'UT NO': s.utNumber,
      'NAME': s.fullName,
      'PHONE NO': s.phone.replace('+94 ', '0').replace(/ /g, ''),
      'DISTRICT': s.district,
      'BENEFICIARY NAME': s.bankDetails?.beneficiaryName || s.fullName,
      'BLOSSOM TRUST AMT': s.isBlossomTrust ? 'LKR 15,000' : 'LKR 0',
      'BANK': s.bankDetails?.bankName || 'N/A',
      'BRANCH NAME': s.bankDetails?.branchName || 'N/A',
      'BR. CODE': s.bankDetails?.branchCode || '1',
      'ACCOUNT NO': s.bankDetails?.accountNumber || 'N/A',
    }));

    exportToCSV('TIC360_Blossom_Trust_Student_Details', exportData);
  };

  const handleExportBankTransferExcel = () => {
    const exportData = filteredPayments
      .filter((p) => p.isEligible)
      .map((p, idx) => {
        const student = students.find((s) => s.id === p.studentId);
        return {
          'NO': idx + 1,
          'UT NO': p.utNumber,
          'NAME': p.studentName,
          'BENEFICIARY NAME': student?.bankDetails?.beneficiaryName || p.studentName,
          'BANK': student?.bankDetails?.bankName || 'N/A',
          'BRANCH NAME': student?.bankDetails?.branchName || 'N/A',
          'BR. CODE': student?.bankDetails?.branchCode || '1',
          'ACCOUNT NO': student?.bankDetails?.accountNumber || 'N/A',
          'BLOSSOM TRUST AMT': `LKR ${p.amount.toLocaleString()}`,
          'MONTH': p.month,
          'PAYMENT STATUS': p.status,
          'REFERENCE NO': p.referenceNo || 'Pending',
        };
      });

    exportToExcel(`TIC360_Bank_Disbursement_${selectedMonthString}`, [
      { sheetName: 'Bank Transfer List', data: exportData },
    ]);
  };

  const handleExportMonthlyCSV = () => {
    const exportData = filteredPayments.map((p, idx) => ({
      'NO': idx + 1,
      'UT NO': p.utNumber,
      'NAME': p.studentName,
      'MONTH': p.month,
      'ATTENDANCE %': p.attendancePercentage,
      'ELIGIBILITY': p.isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE',
      'BLOSSOM TRUST AMT': p.amount,
      'PAYMENT STATUS': p.status,
      'INELIGIBILITY REASON': p.ineligibilityReason || '',
      'REFERENCE NO': p.referenceNo || '',
    }));

    exportToCSV(`TIC360_Blossom_Payments_${selectedMonthString}`, exportData);
  };

  // Handle Excel/CSV File Upload & Parsing
  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadFile(file);
    setIsParsing(true);
    setImportSummary(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const parsed = json
          .map((row) => {
            const getVal = (...keys: string[]) => {
              for (const k of keys) {
                const foundKey = Object.keys(row).find(
                  (rk) => rk.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === k.toLowerCase().replace(/[^a-z0-9]/g, '')
                );
                if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && String(row[foundKey]).trim() !== '') {
                  return String(row[foundKey]).trim();
                }
              }
              return '';
            };

            const utNumber = getVal('ut no', 'ut number', 'ut_no', 'utno', 'ut');
            const fullName = getVal('name', 'full name', 'student name', 'beneficiary name');
            const phone = getVal('phone no', 'phone', 'mobile', 'telephone', 'contact');
            const district = getVal('district', 'location', 'city');
            const beneficiaryName = getVal('beneficiary name', 'beneficiary', 'payee name', 'account name');
            const getAmountVal = () => {
              const exact = getVal('blossom trust amt', 'blossom amt', 'amount', 'stipend', 'blossom trust amount', 'payment', 'payment amount', 'pay amount', 'pay', 'amt', 'value', 'scholarship', 'total', 'monthly payment', 'allowance', 'grant');
              if (exact) return exact;

              // Fallback to substring match for anything containing amount/pay/blossom/lkr
              const foundKey = Object.keys(row).find(rk => {
                const lrk = rk.toLowerCase();
                return lrk.includes('amount') || lrk.includes('amt') || lrk.includes('pay') || lrk.includes('blossom') || lrk.includes('stipend') || lrk.includes('lkr') || lrk.includes('rs');
              });
              if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && String(row[foundKey]).trim() !== '') {
                return String(row[foundKey]).trim();
              }
              return '';
            };

            const amount = getAmountVal();
            const bankName = getVal('bank', 'bank name', 'bank name (sri lanka)');
            const branchName = getVal('branch name', 'branch');
            const branchCode = getVal('br code', 'branch code', 'br. code', 'brcode', 'code');
            const accountNumber = getVal('account no', 'account number', 'acc no', 'acc number', 'account');

            return {
              utNumber,
              fullName: fullName || (utNumber ? `Scholar ${utNumber}` : ''),
              phone: phone ? (String(phone).startsWith('0') || String(phone).startsWith('+') ? String(phone) : `0${phone}`) : '',
              district: district || '',
              beneficiaryName: beneficiaryName || fullName,
              amount: amount, // Extracted directly from excel, no hardcoded fallback
              bankName: bankName || 'Bank of Ceylon (BOC)',
              branchName: branchName || 'Main Branch',
              branchCode: branchCode ? String(branchCode).padStart(3, '0') : '001',
              accountNumber: String(accountNumber),
            };
          })
          .filter((r) => r.fullName || r.utNumber);

        // Check for duplicates in the Excel file itself
        const seenUt = new Set<string>();
        let duplicateInFile = '';

        for (const row of parsed) {
          if (row.utNumber) {
            const cleanUt = row.utNumber.toLowerCase().trim();
            if (seenUt.has(cleanUt)) {
              duplicateInFile = row.utNumber;
              break;
            }
            seenUt.add(cleanUt);
          }
        }

        if (duplicateInFile) {
          alert(`Error: Duplicate UT Number (${duplicateInFile}) found inside the uploaded Excel file. Upload aborted.`);
          setParsedExcelRows([]);
          setIsParsing(false);
          return;
        }

        setParsedExcelRows(parsed);
      } catch (err) {
        console.error('Error reading Blossom Excel file:', err);
        alert('Failed to read Excel file. Please ensure it is a valid .xlsx or .csv file.');
      } finally {
        setIsParsing(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDownloadBlossomTemplate = () => {
    const sampleData = [
      {
        'NO': 1,
        'UT NO': 'UT-2026-001',
        'NAME': 'Karthik Sivakumar',
        'PHONE NO': '0774521180',
        'DISTRICT': 'Jaffna',
        'BENEFICIARY NAME': 'Karthik Sivakumar',
        'BLOSSOM TRUST AMT': 'LKR 15,000',
        'BANK': 'Commercial Bank of Ceylon',
        'BRANCH NAME': 'Jaffna Main Branch',
        'BR. CODE': '045',
        'ACCOUNT NO': '8004529103',
      },
      {
        'NO': 2,
        'UT NO': 'UT-2026-002',
        'NAME': 'Ananya Tharmalingam',
        'PHONE NO': '0718849231',
        'DISTRICT': 'Jaffna',
        'BENEFICIARY NAME': 'Ananya Tharmalingam',
        'BLOSSOM TRUST AMT': 'LKR 15,000',
        'BANK': 'Bank of Ceylon (BOC)',
        'BRANCH NAME': 'Chavakachcheri Branch',
        'BR. CODE': '018',
        'ACCOUNT NO': '7341908221',
      },
      {
        'NO': 3,
        'UT NO': 'UT-2026-004',
        'NAME': 'Piratheepan Mohan',
        'PHONE NO': '0703341199',
        'DISTRICT': 'Jaffna',
        'BENEFICIARY NAME': 'Piratheepan Mohan',
        'BLOSSOM TRUST AMT': 'LKR 15,000',
        'BANK': 'National Savings Bank (NSB)',
        'BRANCH NAME': 'Chunnakam Branch',
        'BR. CODE': '118',
        'ACCOUNT NO': '20098174591',
      },
      {
        'NO': 4,
        'UT NO': 'UT-2026-005',
        'NAME': 'Raveendran Sarujan',
        'PHONE NO': '0776654432',
        'DISTRICT': 'Kilinochchi',
        'BENEFICIARY NAME': 'Raveendran Sarujan',
        'BLOSSOM TRUST AMT': 'LKR 15,000',
        'BANK': "People's Bank",
        'BRANCH NAME': 'Kilinochchi Branch',
        'BR. CODE': '156',
        'ACCOUNT NO': '089200194819',
      },
      {
        'NO': 5,
        'UT NO': 'UT-2026-006',
        'NAME': 'Abinaya Kuganesan',
        'PHONE NO': '0769987712',
        'DISTRICT': 'Vavuniya',
        'BENEFICIARY NAME': 'Abinaya Kuganesan',
        'BLOSSOM TRUST AMT': 'LKR 15,000',
        'BANK': 'Hatton National Bank (HNB)',
        'BRANCH NAME': 'Vavuniya Branch',
        'BR. CODE': '382',
        'ACCOUNT NO': '071020098412',
      },
    ];
    exportToExcel('TIC360_Blossom_Trust_Student_Import_Template', [
      { sheetName: 'Blossom Import Template', data: sampleData },
    ]);
  };

  const handleExecuteImport = () => {
    if (parsedExcelRows.length === 0) return;
    const res = bulkImportBlossomStudents(parsedExcelRows);
    recalculateMonthlyPayments(selectedMonthString);
    setImportSummary(res);
    setTimeout(() => {
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setParsedExcelRows([]);
      setImportSummary(null);
    }, 2000);
  };

  const handleUpdateStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    updateStudent(editingStudent.id, editingStudent);
    setEditingStudent(null);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <HeartHandshake className="w-6 h-6 text-emerald-400" />
              <span>Blossom Trust Section & Student Details</span>
            </h1>
            <Badge variant="emerald">{blossomStudents.length} Beneficiaries</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Complete Blossom Trust beneficiary directory, verified bank coordinates, and monthly stipend disbursements (LKR 15,000 / Scholar)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {currentRole !== 'Student' && (
            <Button
              variant="success"
              size="sm"
              onClick={() => setIsUploadModalOpen(true)}
              leftIcon={<UploadCloud className="w-4 h-4 text-emerald-300" />}
            >
              Upload Excel / CSV
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={activeTab === 'details' ? handleExportBlossomStudentDetailsExcel : handleExportBankTransferExcel}
            leftIcon={<Download className="w-4 h-4 text-emerald-400" />}
          >
            Export Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={activeTab === 'details' ? handleExportBlossomStudentDetailsCSV : handleExportMonthlyCSV}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
          {activeTab === 'monthly' && currentRole !== 'Student' && (
            <Button
              variant="success"
              size="sm"
              onClick={handleBatchMarkPaid}
              leftIcon={<Check className="w-4 h-4" />}
            >
              Mark All Eligible as Paid
            </Button>
          )}
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'details'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>🌸 Blossom Trust Student Beneficiary Details (Bank & Amount)</span>
          </button>

          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'monthly'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>💳 Monthly Disbursement Ledger & Attendance (80% Rule)</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400 hidden sm:inline">
          {activeTab === 'details'
            ? 'Viewing exact Blossom Trust Beneficiary Bank Master Register'
            : 'Monthly stipend eligibility calculation & bank transfer records'}
        </span>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EXACT BLOSSOM TRUST STUDENT DETAILS (BANK & AMOUNT)               */}
      {/* ========================================================================= */}
      {activeTab === 'details' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Filter and Search Bar for Beneficiary List */}
          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by UT number, student name, phone, bank name, or account number..."
                    className="w-full rounded-xl bg-slate-950/70 border border-slate-800 pl-10 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="w-full md:w-48">
                  <Select
                    value={districtFilter}
                    onChange={(e) => setDistrictFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'All Districts' },
                      ...uniqueDistricts.map((d) => ({ value: d, label: d })),
                    ]}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* EXACT BLOSSOM TRUST STUDENT DETAILS TABLE AS IN USER'S SCREENSHOT (ENLARGED & FULL VIEW) */}
          <div className="rounded-2xl border-2 border-lime-500/60 bg-slate-950/95 shadow-2xl overflow-hidden animate-fadeIn">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] uppercase tracking-wider font-extrabold text-slate-300 select-none">
                    <th className="py-2.5 px-1.5 text-center w-8 text-slate-400">NO</th>
                    <th className="py-2.5 px-1.5 text-white whitespace-nowrap">UT NO</th>
                    <th className="py-2.5 px-1.5 text-slate-100 whitespace-nowrap">NAME</th>
                    <th className="py-2.5 px-1.5 text-slate-200 whitespace-nowrap">PHONE NO</th>
                    <th className="py-2.5 px-1.5 text-slate-200 whitespace-nowrap">DISTRICT</th>
                    <th className="py-2.5 px-1.5 text-slate-100 whitespace-nowrap">BENEFICIARY NAME</th>
                    <th className="py-2.5 px-1.5 text-indigo-400 font-black whitespace-nowrap text-center">BLOSSOM TRUST AMT</th>
                    <th className="py-2.5 px-1.5 text-slate-200 whitespace-nowrap">BANK</th>
                    <th className="py-2.5 px-1.5 text-slate-200 whitespace-nowrap">BRANCH NAME</th>
                    <th className="py-2.5 px-1.5 text-center text-slate-200 whitespace-nowrap">BR. CODE</th>
                    <th className="py-2.5 px-1.5 text-slate-100 whitespace-nowrap">ACCOUNT NO</th>
                    <th className="py-2.5 px-1.5 text-center text-slate-400 whitespace-nowrap">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-sm">
                  {paginatedBlossomStudents.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-14 text-center text-sm text-slate-400">
                        No Blossom Trust beneficiary records found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedBlossomStudents.map((stu, index) => {
                      const isDropout = stu.currentStatus === 'Dropout';

                      // Live attendance calculation (same logic as Student Directory)
                      const isFrontend = stu.courseName === 'Frontend Developer' || stu.courseId === 'Frontend Developer';
                      const mySessions = attendanceSessions.filter(ses =>
                        ses.group === 'All' ||
                        (!isFrontend && (ses.group === 'Group A' || ses.group === 'Group B') && (ses.group === stu.group || (ses.group === 'Group A' && stu.group === 'A') || (ses.group === 'Group B' && stu.group === 'B'))) ||
                        (isFrontend && ses.group === 'Frontend Developer')
                      );
                      let presentCount = 0;
                      const totalCount = mySessions.length;
                      mySessions.forEach(ses => {
                        const mark = attendanceMarks[ses.id]?.[stu.id];
                        if (mark === 'P' || mark === 'L' || !mark) presentCount++;
                      });
                      const livePercentage = totalCount > 0 ? (presentCount / totalCount) * 100 : 100;
                      const isLowAttendance = !isDropout && livePercentage < settings.attendanceGoodThreshold;

                      let rowClass = "hover:bg-slate-900/80 transition-colors group border-b border-slate-800/60";
                      if (isDropout) {
                        rowClass = "bg-red-950/40 hover:bg-red-900/40 border-b border-red-900/50 transition-colors group";
                      } else if (isLowAttendance) {
                        rowClass = "bg-amber-950/20 hover:bg-amber-900/30 border-b border-amber-900/50 transition-colors group";
                      }

                      return (
                      <tr
                        key={stu.id}
                        className={rowClass}
                      >
                        {/* NO */}
                        <td className="py-3 px-1.5 text-center font-bold text-slate-300 text-xs">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>

                        {/* UT NO */}
                        <td className="py-3 px-1.5 font-extrabold text-white font-mono text-xs tracking-wide whitespace-nowrap">
                          {stu.utNumber}
                        </td>

                        {/* NAME */}
                        <td className="py-3 px-1.5 font-bold text-slate-100 group-hover:text-blue-400 transition-colors text-xs whitespace-nowrap">
                          {stu.fullName}
                        </td>

                        {/* PHONE NO */}
                        <td className="py-3 px-1.5 font-mono font-bold text-slate-200 text-xs whitespace-nowrap">
                          {stu.phone.replace('+94 ', '0').replace(/ /g, '')}
                        </td>

                        {/* DISTRICT */}
                        <td className="py-3 px-1.5 text-slate-300 font-semibold text-xs whitespace-nowrap">
                          {stu.district}
                        </td>

                        {/* BENEFICIARY NAME */}
                        <td className="py-3 px-1.5 text-slate-100 font-bold text-xs whitespace-nowrap">
                          {stu.bankDetails?.beneficiaryName || stu.fullName}
                        </td>

                        {/* BLOSSOM TRUST AMT */}
                        <td className="py-3 px-1.5 font-extrabold text-indigo-400 font-mono tracking-wide text-xs whitespace-nowrap text-center">
                          {stu.isBlossomTrust ? (stu.blossomAmount !== undefined ? `LKR ${stu.blossomAmount.toLocaleString()}` : 'LKR 15,000') : 'LKR 0'}
                        </td>

                        {/* BANK */}
                        <td className="py-3 px-1.5 text-slate-200 font-bold text-xs whitespace-nowrap">
                          {stu.bankDetails?.bankName || 'N/A'}
                        </td>

                        {/* BRANCH NAME */}
                        <td className="py-3 px-1.5 text-slate-200 font-semibold text-xs whitespace-nowrap">
                          {stu.bankDetails?.branchName || 'N/A'}
                        </td>

                        {/* BR. CODE */}
                        <td className="py-3 px-1.5 text-center font-mono font-extrabold text-slate-200 text-xs whitespace-nowrap">
                          {stu.bankDetails?.branchCode || '1'}
                        </td>

                        {/* ACCOUNT NO */}
                        <td className="py-3 px-1.5 font-mono font-extrabold text-white tracking-wider text-xs whitespace-nowrap">
                          {stu.bankDetails?.accountNumber || 'N/A'}
                        </td>

                        {/* ACTIONS */}
                        <td className="py-2.5 px-1.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setSelectedStudent(stu)}
                              className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                              title="View Full Scholar Profile"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {currentRole !== 'Student' && (
                              <button
                                onClick={() => setEditingStudent(stu)}
                                className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                                title="Edit Bank Details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between p-3 border-t border-slate-800/80 bg-slate-900/60 gap-3">
                <div className="text-xs text-slate-400">
                  Showing <span className="font-bold text-slate-200">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-200">{Math.min(currentPage * itemsPerPage, blossomStudents.length)}</span> of <span className="font-bold text-slate-200">{blossomStudents.length}</span> students
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs px-3"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="px-2 text-xs font-semibold text-slate-300">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs px-3"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MONTHLY DISBURSEMENT LEDGER & ATTENDANCE 80% RULE                   */}
      {/* ========================================================================= */}
      {activeTab === 'monthly' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Month Selector & Filter */}
          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-center">
                <Select
                  label="Academic Year"
                  value={String(selectedYear)}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  options={[
                    { value: '2026', label: '2026 Fiscal' },
                    { value: '2027', label: '2027 Fiscal' },
                  ]}
                />

                <Select
                  label="Disbursement Month"
                  value={selectedMonthOnly}
                  onChange={(e) => setSelectedMonthOnly(e.target.value)}
                  options={[
                    { value: '01', label: 'January' },
                    { value: '02', label: 'February' },
                    { value: '03', label: 'March' },
                    { value: '04', label: 'April' },
                    { value: '05', label: 'May' },
                    { value: '06', label: 'June' },
                    { value: '07', label: 'July' },
                    { value: '08', label: 'August' },
                    { value: '09', label: 'September' },
                    { value: '10', label: 'October' },
                    { value: '11', label: 'November' },
                    { value: '12', label: 'December' },
                  ]}
                />

                <Select
                  label="Payment Status Filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'Eligible', label: 'Eligible' },
                    { value: 'Not Eligible', label: 'Not Eligible (LKR 0)' },
                    { value: 'Paid', label: 'Paid' },
                    { value: 'Pending', label: 'Pending' },
                  ]}
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Search Scholar
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name or UT#..."
                    className="w-full rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPI Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Card className="p-4 border-emerald-500/30">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Payable</span>
              <p className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-1">
                {formatCurrency(totalPayableAmount)}
              </p>
              <span className="text-[10px] text-slate-400">{eligibleCount} Eligible Scholars</span>
            </Card>

            <Card className="p-4 border-blue-500/30">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Disbursed (Paid)</span>
              <p className="text-xl sm:text-2xl font-extrabold text-blue-400 mt-1">
                {formatCurrency(totalPaidAmount)}
              </p>
              <span className="text-[10px] text-slate-400">{paidCount} Completed Transfers</span>
            </Card>

            <Card className="p-4 border-rose-500/30">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Forfeited (LKR 0)</span>
              <p className="text-xl sm:text-2xl font-extrabold text-rose-400 mt-1">
                {notEligibleCount} Scholars
              </p>
              <span className="text-[10px] text-slate-400">Attendance &lt;80% / Dropout</span>
            </Card>

            <Card className="p-4 border-amber-500/30">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Monthly Rule</span>
              <p className="text-sm font-bold text-amber-300 mt-1">Threshold: 80.0%</p>
              <span className="text-[10px] text-slate-400">Low attendance = LKR 0 for month</span>
            </Card>
          </div>

          {/* Monthly Payment Ledger Table */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle>Disbursement Ledger: {formatMonthName(selectedMonthString)}</CardTitle>
              <CardDescription>
                Individual scholar eligibility, calculated support amount, bank coordinates, and payment status
              </CardDescription>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                    <th className="py-3 px-4 sm:px-6">Blossom Scholar</th>
                    <th className="py-3 px-4">Attendance %</th>
                    <th className="py-3 px-4">Bank Account</th>
                    <th className="py-3 px-4">Eligibility & Rule</th>
                    <th className="py-3 px-4">Calculated Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No Blossom Trust payment records for this month.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((pay) => {
                      const student = students.find((s) => s.id === pay.studentId);
                      return (
                        <tr key={pay.id} className="hover:bg-slate-900/40 transition-colors">
                          {/* Scholar */}
                          <td className="py-3.5 px-4 sm:px-6">
                            <p className="font-bold text-slate-100">{pay.studentName}</p>
                            <p className="text-[11px] font-mono text-slate-400">{pay.utNumber}</p>
                          </td>

                          {/* Attendance */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-mono font-bold ${
                                  pay.attendancePercentage >= 80 ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {pay.attendancePercentage.toFixed(1)}%
                              </span>
                              {pay.attendancePercentage < 80 && (
                                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                              )}
                            </div>
                          </td>

                          {/* Bank Details */}
                          <td className="py-3.5 px-4">
                            {student?.bankDetails ? (
                              <div className="space-y-0.5">
                                <p className="font-mono text-slate-200 font-semibold">
                                  {student.bankDetails.accountNumber}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate max-w-[140px]">
                                  {student.bankDetails.bankName}
                                </p>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">No bank set</span>
                            )}
                          </td>

                          {/* Eligibility & Rule */}
                          <td className="py-3.5 px-4">
                            {pay.isEligible ? (
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Eligible (&gt;=80%)
                              </span>
                            ) : (
                              <div className="space-y-0.5">
                                <span className="text-rose-400 font-bold block">Forfeited</span>
                                <p className="text-[10px] text-slate-400 line-clamp-1">
                                  {pay.ineligibilityReason}
                                </p>
                              </div>
                            )}
                          </td>

                          {/* Calculated Amount */}
                          <td className="py-3.5 px-4 font-mono font-extrabold">
                            {pay.isEligible ? (
                              <span className="text-emerald-400 text-sm">
                                {formatCurrency(pay.amount)}
                              </span>
                            ) : (
                              <span className="text-slate-400">LKR 0</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <Badge
                              variant={
                                pay.status === 'Paid'
                                  ? 'active'
                                  : pay.status === 'Eligible'
                                  ? 'blue'
                                  : 'rose'
                              }
                            >
                              {pay.status.toUpperCase()}
                            </Badge>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            {pay.isEligible ? (
                              pay.status === 'Paid' ? (
                                <span className="text-[11px] text-slate-400 font-mono">
                                  Ref: {pay.referenceNo || 'OK'}
                                </span>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={() =>
                                    updatePaymentStatus(
                                      pay.id,
                                      'Paid',
                                      `BTR-${Math.floor(10000 + Math.random() * 90000)}`
                                    )
                                  }
                                >
                                  Mark Paid
                                </Button>
                              )
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">No payment</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: VIEW FULL STUDENT PROFILE                                        */}
      {/* ========================================================================= */}
      {selectedStudent && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedStudent(null)}
          title={`Scholar Profile: ${selectedStudent.fullName}`}
          maxWidth="lg"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xl">
                {selectedStudent.fullName.charAt(0)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">{selectedStudent.fullName}</h3>
                  <Badge variant="emerald">Blossom Trust Scholar</Badge>
                </div>
                <p className="text-xs font-mono text-slate-400">
                  {selectedStudent.utNumber} • NIC: {selectedStudent.nic} • District: {selectedStudent.district}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 bg-slate-900/40 border-slate-800">
                <h4 className="text-xs font-bold uppercase text-slate-400 mb-3 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Blossom Trust Bank Coordinates</span>
                </h4>
                {selectedStudent.bankDetails ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Bank Name:</span>
                      <span className="font-semibold text-slate-100">{selectedStudent.bankDetails.bankName}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Branch Name:</span>
                      <span className="font-semibold text-slate-100">{selectedStudent.bankDetails.branchName}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Branch Code:</span>
                      <span className="font-mono font-bold text-slate-100">{selectedStudent.bankDetails.branchCode}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Account Number:</span>
                      <span className="font-mono font-extrabold text-white">{selectedStudent.bankDetails.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Beneficiary:</span>
                      <span className="font-semibold text-emerald-400">{selectedStudent.bankDetails.beneficiaryName}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No bank coordinates registered.</p>
                )}
              </Card>

              <Card className="p-4 bg-slate-900/40 border-slate-800">
                <h4 className="text-xs font-bold uppercase text-slate-400 mb-3 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-400" />
                  <span>Contact & Enrolment</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Phone:</span>
                    <span className="font-mono text-slate-100">{selectedStudent.phone}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Email:</span>
                    <span className="text-slate-100">{selectedStudent.email}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Course:</span>
                    <span className="font-semibold text-slate-100">{selectedStudent.courseName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Batch:</span>
                    <span className="font-semibold text-slate-100">{selectedStudent.batchName}</span>
                  </div>
                </div>
              </Card>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setSelectedStudent(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT STUDENT BANK DETAILS                                        */}
      {/* ========================================================================= */}
      {editingStudent && (
        <Modal
          isOpen={true}
          onClose={() => setEditingStudent(null)}
          title={`Edit Student Details: ${editingStudent.fullName}`}
          maxWidth="md"
        >
          <form onSubmit={handleUpdateStudentSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Phone Number"
                value={editingStudent.phone || ''}
                onChange={(e) => {
                  setEditingStudent((prev) => {
                    if (!prev) return null;
                    return { ...prev, phone: e.target.value };
                  });
                }}
              />
              <Input
                label="District"
                value={editingStudent.district || ''}
                onChange={(e) => {
                  setEditingStudent((prev) => {
                    if (!prev) return null;
                    return { ...prev, district: e.target.value };
                  });
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-slate-800/80 pt-3">
              <Input
                label="Blossom Trust Amount (LKR)"
                type="number"
                value={editingStudent.blossomAmount !== undefined ? editingStudent.blossomAmount : 15000}
                onChange={(e) => {
                  setEditingStudent((prev) => {
                    if (!prev) return null;
                    return { ...prev, blossomAmount: Number(e.target.value) };
                  });
                }}
                required
              />
              <Select
                label="Student Status (Eligibility)"
                value={editingStudent.currentStatus}
                onChange={(e) => {
                  setEditingStudent((prev) => {
                    if (!prev) return null;
                    return { ...prev, currentStatus: e.target.value as any };
                  });
                }}
                options={[
                  { value: 'Active', label: 'Active (Eligible)' },
                  { value: 'Dropout', label: 'Dropout (Ineligible)' },
                  { value: 'Low Attendance', label: 'Low Attendance (Ineligible)' },
                  { value: 'Completed', label: 'Completed' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
            </div>

            <div>
              <Select
                label="Bank Name (Sri Lanka)"
                value={editingStudent.bankDetails?.bankName || 'Pan Asia Bank'}
                onChange={(e) => {
                  const selectedBank = getBankByName(e.target.value);
                  const firstBranch = selectedBank?.branches[0];
                  setEditingStudent((prev) => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      bankDetails: {
                        bankName: e.target.value,
                        branchName: firstBranch ? firstBranch.branchName : '',
                        branchCode: firstBranch ? firstBranch.branchCode : '1',
                        accountNumber: prev.bankDetails?.accountNumber || '',
                        beneficiaryName: prev.bankDetails?.beneficiaryName || prev.fullName,
                        district: firstBranch ? firstBranch.district : prev.district,
                      },
                    };
                  });
                }}
                options={SRI_LANKA_BANKS.map((b) => ({
                  value: b.bankName,
                  label: b.bankName,
                }))}
              />
            </div>

            {/* Cascading Branch Dropdown */}
            {(() => {
              const currentBankInfo = getBankByName(editingStudent.bankDetails?.bankName || '');
              const branches = currentBankInfo?.branches || [];

              return (
                <div>
                  <Select
                    label="Branch Name"
                    value={editingStudent.bankDetails?.branchName || ''}
                    onChange={(e) => {
                      const branch = branches.find((b) => b.branchName === e.target.value);
                      setEditingStudent((prev) => {
                        if (!prev) return null;
                        return {
                          ...prev,
                          bankDetails: {
                            bankName: prev.bankDetails?.bankName || '',
                            branchName: e.target.value,
                            branchCode: branch ? branch.branchCode : prev.bankDetails?.branchCode || '1',
                            accountNumber: prev.bankDetails?.accountNumber || '',
                            beneficiaryName: prev.bankDetails?.beneficiaryName || prev.fullName,
                            district: branch ? branch.district : prev.district,
                          },
                        };
                      });
                    }}
                    options={branches.map((b) => ({
                      value: b.branchName,
                      label: `${b.branchName} (Code: ${b.branchCode})`,
                    }))}
                  />
                </div>
              );
            })()}

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Branch Code"
                value={editingStudent.bankDetails?.branchCode || '1'}
                onChange={(e) => {
                  setEditingStudent((prev) => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      bankDetails: {
                        ...prev.bankDetails!,
                        branchCode: e.target.value,
                      },
                    };
                  });
                }}
                required
              />

              <Input
                label="Account Number"
                value={editingStudent.bankDetails?.accountNumber || ''}
                onChange={(e) => {
                  setEditingStudent((prev) => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      bankDetails: {
                        ...prev.bankDetails!,
                        accountNumber: e.target.value,
                      },
                    };
                  });
                }}
                required
              />
            </div>

            <Input
              label="Beneficiary Name"
              value={editingStudent.bankDetails?.beneficiaryName || editingStudent.fullName}
              onChange={(e) => {
                setEditingStudent((prev) => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    bankDetails: {
                      ...prev.bankDetails!,
                      beneficiaryName: e.target.value,
                    },
                  };
                });
              }}
              required
            />

            <div className="flex justify-end gap-2.5 pt-3">
              <Button type="button" variant="outline" onClick={() => setEditingStudent(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Details
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: UPLOAD & IMPORT BLOSSOM TRUST STUDENTS EXCEL / CSV              */}
      {/* ========================================================================= */}
      {isUploadModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => {
            setIsUploadModalOpen(false);
            setUploadFile(null);
            setParsedExcelRows([]);
            setImportSummary(null);
          }}
          title="Upload Blossom Trust Beneficiary Excel / CSV"
          subtitle="Upload student register spreadsheet (.xlsx, .xls, .csv) to view and update Blossom Trust beneficiary details"
          maxWidth="4xl"
        >
          <div className="space-y-6">
            {/* Top Action & File Input Box */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Select Blossom Trust Excel / CSV File</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Columns supported: NO, UT NO, NAME, PHONE NO, DISTRICT, BENEFICIARY NAME, BLOSSOM TRUST AMT, BANK, BRANCH NAME, BR. CODE, ACCOUNT NO
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadBlossomTemplate}
                  leftIcon={<Download className="w-4 h-4 text-emerald-400" />}
                >
                  Download Sample Template
                </Button>
              </div>

              {/* Upload Drop Area */}
              <div className="relative border-2 border-dashed border-emerald-500/40 hover:border-emerald-500/80 rounded-2xl p-6 text-center bg-slate-950/60 transition-colors group cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleExcelFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  {uploadFile ? (
                    <div>
                      <p className="text-sm font-bold text-emerald-400">{uploadFile.name}</p>
                      <p className="text-xs text-slate-400">
                        {(uploadFile.size / 1024).toFixed(1)} KB • Click or drag to change file
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-slate-200">
                        Drop your Excel file here or <span className="text-emerald-400 underline">browse</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">Supports .xlsx, .xls, and .csv formats</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Import Status Alert */}
            {importSummary && (
              <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex items-center gap-3 animate-fadeIn">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-200">Import Successful!</h4>
                  <p className="text-xs text-emerald-300">
                    Updated {importSummary.updatedCount} existing scholars and registered {importSummary.createdCount} new Blossom Trust beneficiaries!
                  </p>
                </div>
              </div>
            )}

            {/* Parsed Excel Data Live Preview Table */}
            {parsedExcelRows.length > 0 && !importSummary && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Parsed Records Preview ({parsedExcelRows.length} Students)
                    </span>
                    <Badge variant="emerald">Ready to Import</Badge>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-slate-300 font-bold border-b border-slate-800 sticky top-0 uppercase">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">UT NO</th>
                        <th className="py-2.5 px-3">NAME</th>
                        <th className="py-2.5 px-3">PHONE NO</th>
                        <th className="py-2.5 px-3">DISTRICT</th>
                        <th className="py-2.5 px-3">BENEFICIARY NAME</th>
                        <th className="py-2.5 px-3">BLOSSOM AMT</th>
                        <th className="py-2.5 px-3">BANK</th>
                        <th className="py-2.5 px-3">BRANCH NAME</th>
                        <th className="py-2.5 px-3">BR. CODE</th>
                        <th className="py-2.5 px-3">ACCOUNT NO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {parsedExcelRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-2 px-3 text-slate-400 font-sans">{idx + 1}</td>
                          <td className="py-2 px-3 text-emerald-400 font-bold">{row.utNumber || 'AUTO'}</td>
                          <td className="py-2 px-3 text-slate-100 font-sans font-semibold">{row.fullName}</td>
                          <td className="py-2 px-3 text-slate-300">{row.phone}</td>
                          <td className="py-2 px-3 text-slate-300 font-sans">{row.district}</td>
                          <td className="py-2 px-3 text-slate-200 font-sans">{row.beneficiaryName}</td>
                          <td className="py-2 px-3 text-indigo-400 font-bold">{row.amount ? (String(row.amount).toUpperCase().includes('LKR') ? row.amount : `LKR ${row.amount}`) : 'LKR 15,000'}</td>
                          <td className="py-2 px-3 text-slate-300 font-sans">{row.bankName}</td>
                          <td className="py-2 px-3 text-slate-300 font-sans">{row.branchName}</td>
                          <td className="py-2 px-3 text-slate-300">{row.branchCode}</td>
                          <td className="py-2 px-3 text-white font-bold">{row.accountNumber}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <Button
                variant="outline"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadFile(null);
                  setParsedExcelRows([]);
                  setImportSummary(null);
                }}
              >
                Cancel
              </Button>

              {parsedExcelRows.length > 0 && !importSummary && (
                <Button
                  variant="success"
                  onClick={handleExecuteImport}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Confirm & Import ({parsedExcelRows.length} Beneficiaries)
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
