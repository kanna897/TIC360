'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { 
  FileSpreadsheet, 
  Search, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  UserX
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { exportAbsenteesToExcel } from '@/lib/excelExport';
import { Select } from '@/components/ui/Select';

export default function AbsenteesReportPage() {
  const { absenceRequests, updateAbsenceRequestStatus, currentRole } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Authorization check (Only Admin should view)
  if (currentRole !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-slate-400 mt-2">You do not have permission to view this report.</p>
      </div>
    );
  }

  const filteredRequests = absenceRequests.filter(req => {
    const matchesSearch = 
      req.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      req.utNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    exportAbsenteesToExcel(filteredRequests);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <Badge variant="emerald"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'Rejected':
        return <Badge variant="rose"><AlertCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="amber"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <UserX className="w-6 h-6 text-rose-400" />
            Student Absentees Report
          </h1>
          <p className="text-sm text-slate-400">View and manage all student absence and leave requests.</p>
        </div>
        <Button 
          variant="primary" 
          onClick={handleExport}
          leftIcon={<FileSpreadsheet className="w-4 h-4" />}
          className="bg-emerald-600 hover:bg-emerald-500 text-white border-none"
        >
          Export to Excel
        </Button>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by student name or UT number..." 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'All', label: 'All Statuses' },
                  { value: 'Submitted', label: 'Pending' },
                  { value: 'Approved', label: 'Approved' },
                  { value: 'Rejected', label: 'Rejected' },
                ]}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 overflow-hidden overflow-x-auto bg-slate-950/50">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Leave Period</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-200">{req.fullName}</div>
                        <div className="text-xs text-slate-500">{req.utNumber}</div>
                        <div className="text-[10px] text-slate-600 mt-1">Submitted: {new Date(req.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{req.fromDate} <span className="text-slate-500 mx-1">to</span> {req.toDate}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 max-w-xs">
                        <p className="text-slate-300 line-clamp-2 text-xs" title={req.reason}>
                          {req.reason}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(req.status)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {req.status === 'Submitted' && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                onClick={() => updateAbsenceRequestStatus(req.id, 'Approved')}
                              >
                                Approve
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-xs bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                                onClick={() => updateAbsenceRequestStatus(req.id, 'Rejected')}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No absence requests found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
