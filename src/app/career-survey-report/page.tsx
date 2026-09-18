'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { 
  FileSpreadsheet, 
  Search, 
  GraduationCap,
  AlertCircle,
  Briefcase,
  UserX
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { exportCareerSurveysToExcel } from '@/lib/excelExport';
import { Select } from '@/components/ui/Select';

export default function CareerSurveyReportPage() {
  const { careerSurveyResponses, currentRole } = useStore();
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

  const filteredResponses = careerSurveyResponses.filter(res => {
    const matchesSearch = 
      res.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      res.utNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (res.workingCompanyName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || res.outcomeStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    exportCareerSurveysToExcel(filteredResponses);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Employed':
        return <Badge variant="emerald">Employed</Badge>;
      case 'Internship':
        return <Badge variant="blue">Internship</Badge>;
      case 'Unemployed':
        return <Badge variant="rose">Unemployed</Badge>;
      case 'Self Employed':
        return <Badge variant="purple">Self Employed</Badge>;
      case 'Higher Studies':
        return <Badge variant="amber">Higher Studies</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-400" />
            Career Placement Survey Report
          </h1>
          <p className="text-sm text-slate-400">View and manage all 9-Month Course Completion Survey responses.</p>
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
                placeholder="Search by student name, UT number, or company..." 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-56">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'All', label: 'All Statuses' },
                  { value: 'Employed', label: 'Employed' },
                  { value: 'Internship', label: 'Internship' },
                  { value: 'Unemployed', label: 'Unemployed' },
                  { value: 'Self Employed', label: 'Self Employed' },
                  { value: 'Higher Studies', label: 'Higher Studies' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 overflow-hidden overflow-x-auto bg-slate-950/50">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Outcome Status</th>
                  <th className="px-4 py-3 font-medium">Job Details</th>
                  <th className="px-4 py-3 font-medium text-right">Salary (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredResponses.length > 0 ? (
                  filteredResponses.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-200">{res.studentName}</div>
                        <div className="text-xs text-slate-500">{res.utNumber}</div>
                        <div className="text-[10px] text-slate-600 mt-1">Submitted: {new Date(res.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-4 py-4">
                         {res.isBlossomTrust ? (
                           <Badge variant="blue" className="text-[10px]">Blossom Scholar</Badge>
                         ) : (
                           <Badge variant="neutral" className="text-[10px]">Trainee</Badge>
                         )}
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(res.outcomeStatus)}
                      </td>
                      <td className="px-4 py-4 max-w-xs">
                        <div className="flex flex-col gap-0.5">
                          {res.workingCompanyName && res.workingCompanyName !== 'N/A' ? (
                            <span className="font-medium text-slate-300 flex items-center gap-1.5">
                              <Briefcase className="w-3 h-3 text-slate-500" />
                              {res.workingCompanyName}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic text-xs">No Company</span>
                          )}
                          {res.jobTitle && res.jobTitle !== 'N/A' && (
                            <span className="text-xs text-slate-400">{res.jobTitle}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        {res.salary && res.salary > 0 ? (
                          <span className="font-mono text-emerald-400 font-semibold">
                            {Number(res.salary).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No career survey responses found matching your filters.
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
