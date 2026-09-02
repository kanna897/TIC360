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
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { BlossomPaymentStatus } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { formatCurrency, exportToCSV, exportToExcel, formatMonthName } from '@/lib/utils';

export default function BlossomPaymentsPage() {
  const {
    students,
    blossomPayments,
    monthlyAttendance,
    updatePaymentStatus,
    recalculateMonthlyPayments,
    settings,
  } = useStore();

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonthOnly, setSelectedMonthOnly] = useState<string>('08'); // August
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedMonthString = `${selectedYear}-${selectedMonthOnly}`; // '2026-08'

  // Payments for this month
  const currentMonthPayments = useMemo(() => {
    return blossomPayments.filter((p) => p.month === selectedMonthString);
  }, [blossomPayments, selectedMonthString]);

  // Filtered list
  const filteredPayments = useMemo(() => {
    return currentMonthPayments.filter((p) => {
      const matchesSearch =
        p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.utNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [currentMonthPayments, searchQuery, statusFilter]);

  // Calculations
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

  const handleExportBankTransferExcel = () => {
    const exportData = filteredPayments
      .filter((p) => p.isEligible)
      .map((p) => {
        const student = students.find((s) => s.id === p.studentId);
        return {
          'UT Number': p.utNumber,
          'Beneficiary Name': student?.bankDetails?.beneficiaryName || p.studentName,
          'Bank Name': student?.bankDetails?.bankName || '',
          'Branch Name': student?.bankDetails?.branchName || '',
          'Branch Code': student?.bankDetails?.branchCode || '',
          'Account Number': student?.bankDetails?.accountNumber || '',
          'Amount (LKR)': p.amount,
          'Month': p.month,
          'Payment Status': p.status,
          'Reference No': p.referenceNo || 'Pending',
        };
      });

    exportToExcel(`TIC360_Bank_Disbursement_${selectedMonthString}`, [
      { sheetName: 'Bank Transfer List', data: exportData },
    ]);
  };

  const handleExportCSV = () => {
    const exportData = filteredPayments.map((p) => ({
      UT_Number: p.utNumber,
      Student_Name: p.studentName,
      Month: p.month,
      Attendance_Percentage: p.attendancePercentage,
      Eligibility: p.isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE',
      Amount_LKR: p.amount,
      Payment_Status: p.status,
      Ineligibility_Reason: p.ineligibilityReason || '',
      Reference_No: p.referenceNo || '',
    }));

    exportToCSV(`TIC360_Blossom_Payments_${selectedMonthString}`, exportData);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Monthly Blossom Trust Support Payments
            </h1>
            <Badge variant="emerald">Max {formatCurrency(settings.blossomMonthlyMax)} / Student</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Month-by-month stipend eligibility based on strict attendance thresholds (&gt;= 80%) and active student status
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportBankTransferExcel}
            leftIcon={<Download className="w-4 h-4 text-emerald-400" />}
          >
            Export Bank Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
          <Button
            variant="success"
            size="sm"
            onClick={handleBatchMarkPaid}
            leftIcon={<Check className="w-4 h-4" />}
          >
            Mark All Eligible as Paid
          </Button>
        </div>
      </div>

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
  );
}
