'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Download,
  Eye,
  Edit2,
  Trash2,
  HeartHandshake,
  GraduationCap,
  Building,
  Phone,
  Mail,
  CreditCard,
  CheckCircle2,
  Calendar,
  MapPin,
  FileText,
  Upload,
  Sparkles,
  Briefcase,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { Student, Gender, StudentStatus, Course, Batch } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatCurrency, formatDate, exportToCSV, exportToExcel } from '@/lib/utils';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { SRI_LANKA_BANKS } from '@/lib/sriLankaBanks';
import * as XLSX from 'xlsx';

export default function StudentsPage() {
  const {
    students,
    courses,
    batches,
    outcomes,
    addStudent,
    updateStudent,
    deleteStudent,
    currentRole,
  } = useStore();

  const [copiedLinkToast, setCopiedLinkToast] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');


  // Selected Student for View Modal
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Edit Student Modal
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Add Student Modal & Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [formData, setFormData] = useState({
    utNumber: `UT-2026-${String(students.length + 1).padStart(3, '0')}`,
    fullName: '',
    nic: '',
    dob: '2002-01-01',
    gender: 'Male' as Gender,
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    district: 'Jaffna',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: 'Parent',
    batchId: batches[0]?.id || 'BAT-02',
    courseId: courses[0]?.id || 'CRS-02',
    photoUrl: '',
    isBlossomTrust: true, // Default prompt asks: Blossom Trust Student?
    currentStatus: 'Active' as StudentStatus,
    // Bank details (only when isBlossomTrust === true)
    bankName: 'Commercial Bank of Ceylon',
    branchName: 'Jaffna Main Branch',
    branchCode: '045',
    accountNumber: '',
    beneficiaryName: '',
    bankDistrict: 'Jaffna',
    // Blossom application data
    parentsOccupation: '',
    familyIncome: 35000,
    familyMembersCount: 4,
    siblingsCount: 2,
    financialDifficulties: '',
    accommodationExpense: 4000,
    foodExpense: 15000,
  });

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.utNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone.includes(searchQuery);

      const matchesBatch = batchFilter === 'all' || s.batchId === batchFilter;
      const matchesCourse = courseFilter === 'all' || s.courseId === courseFilter;
      const matchesStatus = statusFilter === 'all' || s.currentStatus === statusFilter;
      const isDummyVisible = !s.isDummy; // Hide dummy data in standard view if desired, or set to true

      return matchesSearch && matchesBatch && matchesCourse && matchesStatus && isDummyVisible;
    });
  }, [students, searchQuery, batchFilter, courseFilter, statusFilter]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    const result = await uploadToCloudinary(file, 'photo');
    setIsUploadingPhoto(false);

    if (result.success) {
      setFormData((prev) => ({ ...prev, photoUrl: result.url }));
    } else {
      alert(result.error || 'Failed to upload photo');
    }
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.utNumber || !formData.nic) {
      alert('Please fill all required fields');
      return;
    }

    // Check Duplicate UT Number
    const utExists = students.some(
      (s) => s.utNumber.trim().toLowerCase() === formData.utNumber.trim().toLowerCase()
    );
    if (utExists) {
      alert(`Error: A student with UT Number "${formData.utNumber}" already exists in the system. UT Numbers must be strictly unique.`);
      return;
    }

    // Check Duplicate NIC
    const nicExists = students.some(
      (s) => s.nic.trim().toLowerCase() === formData.nic.trim().toLowerCase()
    );
    if (nicExists) {
      alert(`Error: A student with NIC "${formData.nic}" already exists in the system.`);
      return;
    }

    const selectedCourse = courses.find((c) => c.id === formData.courseId) || courses[0];
    const selectedBatch = batches.find((b) => b.id === formData.batchId) || batches[0];

    addStudent({
      utNumber: formData.utNumber,
      fullName: formData.fullName,
      nic: formData.nic,
      dob: formData.dob,
      gender: formData.gender,
      phone: formData.phone,
      whatsapp: formData.whatsapp || formData.phone,
      email: formData.email || `${formData.fullName.toLowerCase().replace(/\s+/g, '.')}@unicomtic.org`,
      address: formData.address,
      district: formData.district,
      emergencyContact: {
        name: formData.emergencyContactName,
        phone: formData.emergencyContactPhone,
        relationship: formData.emergencyContactRelationship,
      },
      batchId: selectedBatch.id,
      batchName: selectedBatch.name,
      courseId: selectedCourse.id,
      courseName: selectedCourse.name,
      photoUrl: formData.photoUrl,
      isBlossomTrust: formData.isBlossomTrust,
      currentStatus: formData.currentStatus,
      bankDetails: formData.isBlossomTrust
        ? {
            bankName: formData.bankName,
            branchName: formData.branchName,
            branchCode: formData.branchCode,
            accountNumber: formData.accountNumber,
            beneficiaryName: formData.beneficiaryName || formData.fullName,
            district: formData.bankDistrict,
          }
        : undefined,
      blossomApplication: formData.isBlossomTrust
        ? {
            parentsOccupation: formData.parentsOccupation,
            familyIncome: Number(formData.familyIncome) || 0,
            familyMembersCount: Number(formData.familyMembersCount) || 1,
            siblingsCount: Number(formData.siblingsCount) || 0,
            financialDifficulties: formData.financialDifficulties,
            accommodationExpense: Number(formData.accommodationExpense) || 0,
            foodExpense: Number(formData.foodExpense) || 0,
            declarationSigned: true,
            verificationStatus: 'Pending',
          }
        : undefined,
    });

    setIsAddModalOpen(false);
    // Reset form
    setFormData({
      utNumber: `UT-2026-${String(students.length + 2).padStart(3, '0')}`,
      fullName: '',
      nic: '',
      dob: '2002-01-01',
      gender: 'Male',
      phone: '',
      whatsapp: '',
      email: '',
      address: '',
      district: 'Jaffna',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelationship: 'Parent',
      batchId: batches[0]?.id || 'BAT-02',
      courseId: courses[0]?.id || 'CRS-02',
      photoUrl: '',
      isBlossomTrust: true,
      currentStatus: 'Active',
      bankName: 'Commercial Bank of Ceylon',
      branchName: 'Jaffna Main Branch',
      branchCode: '045',
      accountNumber: '',
      beneficiaryName: '',
      bankDistrict: 'Jaffna',
      parentsOccupation: '',
      familyIncome: 35000,
      familyMembersCount: 4,
      siblingsCount: 2,
      financialDifficulties: '',
      accommodationExpense: 4000,
      foodExpense: 15000,
    });
  };

  const handleUpdateStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    updateStudent(editingStudent.id, editingStudent);
    setEditingStudent(null);
  };

  const handleExportCSV = () => {
    const exportData = filteredStudents.map((s) => ({
      UT_Number: s.utNumber,
      Full_Name: s.fullName,
      Course: s.courseName,
      Batch: s.batchName,
      Status: s.currentStatus,
      NIC: s.nic,
      Phone: s.phone,
      Email: s.email,
      District: s.district,
    }));

    exportToCSV('TIC360_Students_Register', exportData);
  };

  const handleExportExcel = () => {
    const exportData = filteredStudents.map((s) => ({
      'UT Number': s.utNumber,
      'Full Name': s.fullName,
      'Course': s.courseName,
      'Batch': s.batchName,
      'Current Status': s.currentStatus,
      'NIC': s.nic,
      'DOB': s.dob,
      'Gender': s.gender,
      'Phone': s.phone,
      'Email': s.email,
      'District': s.district,
    }));

    exportToExcel('TIC360_Students_Register', [{ sheetName: 'Students', data: exportData }]);
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { raw: false }) as Record<string, any>[];

        let addedCount = 0;
        let skippedCount = 0;

        for (const row of data) {
          // Normalize keys by converting to lowercase and stripping spaces
          const normalizedRow: Record<string, any> = {};
          for (const key in row) {
            const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
            normalizedRow[normKey] = row[key];
          }

          // We ignore 'status' and 'action' columns as requested by the user
          // Extract relevant fields mapping either to table headers or export headers
          const utNumber = normalizedRow['utno'] || normalizedRow['utnumber'];
          const fullName = normalizedRow['name'] || normalizedRow['fullname'];
          const nic = normalizedRow['nicno'] || normalizedRow['nic'];
          
          if (!utNumber || !fullName || !nic) {
            skippedCount++;
            continue;
          }

          const phone = normalizedRow['phoneno'] || normalizedRow['phone'] || '';
          const email = normalizedRow['email'] || `${String(fullName).toLowerCase().replace(/\\s+/g, '.')}@unicomtic.org`;
          const district = normalizedRow['district'] || 'Jaffna';
          
          const courseNameStr = normalizedRow['course'] || 'Web Development';
          const batchNameStr = normalizedRow['batch'] || 'BAT-02';
          
          const selectedCourse = courses.find(c => c.name.toLowerCase() === String(courseNameStr).toLowerCase()) || courses[0];
          const selectedBatch = batches.find(b => b.name.toLowerCase() === String(batchNameStr).toLowerCase()) || batches[0];

          // Check if UT Number or NIC already exists
          const existingStudent = students.find(
            (s) => s.utNumber.trim().toLowerCase() === String(utNumber).trim().toLowerCase() ||
                   s.nic.trim().toLowerCase() === String(nic).trim().toLowerCase()
          );

          if (existingStudent) {
            // Upsert (Update) existing student
            updateStudent(existingStudent.id, {
              fullName: String(fullName),
              nic: String(nic),
              dob: normalizedRow['dob'] || existingStudent.dob,
              gender: (normalizedRow['gender'] || existingStudent.gender) as Gender,
              phone: String(phone) || existingStudent.phone,
              whatsapp: String(phone) || existingStudent.whatsapp,
              email: String(email) || existingStudent.email,
              district: String(district) || existingStudent.district,
              batchId: selectedBatch?.id || existingStudent.batchId,
              batchName: selectedBatch?.name || existingStudent.batchName,
              courseId: selectedCourse?.id || existingStudent.courseId,
              courseName: selectedCourse?.name || existingStudent.courseName,
              // We do NOT overwrite isBlossomTrust or bankDetails so Blossom Trust data remains safe!
            });
            addedCount++;
          } else {
            // Insert new student
            addStudent({
              utNumber: String(utNumber),
              fullName: String(fullName),
              nic: String(nic),
              dob: normalizedRow['dob'] || '2002-01-01',
              gender: (normalizedRow['gender'] || 'Male') as Gender,
              phone: String(phone),
              whatsapp: String(phone),
              email: String(email),
              address: '',
              district: String(district),
              emergencyContact: {
                name: '',
                phone: '',
                relationship: 'Parent',
              },
              batchId: selectedBatch?.id || 'BAT-02',
              batchName: selectedBatch?.name || 'Batch 2',
              courseId: selectedCourse?.id || 'CRS-02',
              courseName: selectedCourse?.name || 'Web Development',
              photoUrl: '',
              isBlossomTrust: false,
              currentStatus: 'Active',
            });
            addedCount++;
          }
        }

        alert(`Bulk upload complete! Processed (Added/Updated): ${addedCount}, Skipped (Invalid data): ${skippedCount}`);
      } catch (error) {
        console.error('Error during bulk upload:', error);
        alert('Failed to parse the Excel file.');
      }
      
      // Clear the file input
      if (e.target) {
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Student Directory & Blossom Trust Details
            </h1>
            <Badge variant="blue">{filteredStudents.length} Students</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage student registrations, Blossom Trust beneficiary bank details, and monthly allowance records
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const surveyUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/survey`;
              navigator.clipboard.writeText(surveyUrl);
              setCopiedLinkToast(true);
              setTimeout(() => setCopiedLinkToast(false), 3000);
            }}
            className="bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200"
            leftIcon={<Sparkles className="w-4 h-4 text-amber-400" />}
          >
            {copiedLinkToast ? 'Survey Link Copied! ✓' : '📋 Copy Graduate Survey Link'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            leftIcon={<Download className="w-4 h-4 text-emerald-400" />}
          >
            Export Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
          {currentRole !== 'Student' && (
            <>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                id="bulk-upload-excel"
                onChange={handleBulkUpload}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('bulk-upload-excel')?.click()}
                leftIcon={<Upload className="w-4 h-4 text-blue-400" />}
              >
                Bulk Upload (Excel)
              </Button>
            </>
          )}
          {currentRole !== 'Student' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Register Student
            </Button>
          )}
        </div>
      </div>



      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by UT number, student name, NIC, phone, bank, or district..."
                className="w-full rounded-xl bg-slate-950/70 border border-slate-800 pl-10 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 text-xs">
              <div className="w-full sm:w-36">
                <Select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Courses' },
                    ...courses.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                />
              </div>

              <div className="w-full sm:w-36">
                <Select
                  value={batchFilter}
                  onChange={(e) => setBatchFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Batches' },
                    ...batches.map((b) => ({ value: b.id, label: b.name })),
                  ]}
                />
              </div>

              <div className="w-full sm:w-32">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'Active', label: 'Active' },
                    { value: 'Completed', label: 'Completed' },
                    { value: 'Dropout', label: 'Dropout' },
                  ]}
                />
              </div>

            </div>
          </div>
        </CardContent>
      </Card>

      {/* STANDARD STUDENTS DIRECTORY TABLE (SEPARATE COLUMNS, WIDESCREEN VIEW) */}
        <div className="rounded-2xl border-2 border-indigo-500/60 bg-slate-950/95 shadow-2xl overflow-hidden animate-fadeIn">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-slate-800 bg-slate-900/90 text-xs uppercase tracking-wider font-extrabold text-slate-300 select-none">
                  <th className="py-3.5 px-2 text-center w-8 text-slate-400">NO</th>
                  <th className="py-3.5 px-2.5 text-white whitespace-nowrap">UT NO</th>
                  <th className="py-3.5 px-3 text-slate-100 whitespace-nowrap">NAME</th>
                  <th className="py-3.5 px-2.5 text-slate-200 whitespace-nowrap">NIC NO</th>
                  <th className="py-3.5 px-2.5 text-slate-200 whitespace-nowrap">PHONE NO</th>
                  <th className="py-3.5 px-3 text-slate-200 whitespace-nowrap">EMAIL</th>
                  <th className="py-3.5 px-2.5 text-slate-200 whitespace-nowrap">DISTRICT</th>

                  <th className="py-3.5 px-2.5 text-center text-slate-200 whitespace-nowrap">STATUS</th>
                  <th className="py-3.5 px-2 text-center text-slate-400 whitespace-nowrap">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-sm">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-14 text-center text-base text-slate-400"
                    >
                      No student records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((stu, index) => (
                    <tr
                      key={stu.id}
                      className="hover:bg-slate-900/80 transition-colors group border-b border-slate-800/60"
                    >
                      {/* NO */}
                      <td className="py-3.5 px-2 text-center font-bold text-slate-300 text-sm sm:text-base">
                        {index + 1}
                      </td>

                      {/* UT NO */}
                      <td className="py-3.5 px-2.5 font-extrabold text-white font-mono text-sm sm:text-base tracking-wide whitespace-nowrap">
                        {stu.utNumber}
                      </td>

                      {/* NAME */}
                      <td className="py-3.5 px-3 font-bold text-slate-100 group-hover:text-blue-400 transition-colors text-sm sm:text-base whitespace-nowrap">
                        {stu.fullName}
                      </td>

                      {/* NIC NO */}
                      <td className="py-3.5 px-2.5 font-mono font-medium text-slate-300 text-sm sm:text-base whitespace-nowrap">
                        {stu.nic}
                      </td>

                      {/* PHONE NO */}
                      <td className="py-3.5 px-2.5 font-mono font-medium text-slate-200 text-sm sm:text-base whitespace-nowrap">
                        {stu.phone.replace('+94 ', '0').replace(/ /g, '')}
                      </td>

                      {/* EMAIL */}
                      <td className="py-3.5 px-3 font-mono text-slate-300 text-xs sm:text-sm whitespace-nowrap">
                        {stu.email}
                      </td>

                      {/* DISTRICT */}
                      <td className="py-3.5 px-2.5 text-slate-300 font-medium text-sm sm:text-base whitespace-nowrap">
                        {stu.district}
                      </td>



                      {/* STATUS */}
                      <td className="py-3.5 px-2.5 text-center whitespace-nowrap">
                        <Badge
                          variant={
                            stu.currentStatus === 'Active'
                              ? 'active'
                              : stu.currentStatus === 'Completed'
                              ? 'purple'
                              : 'rose'
                          }
                        >
                          {stu.currentStatus.toUpperCase()}
                        </Badge>
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3.5 px-2 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedStudent(stu)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                            title="View Full Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {currentRole !== 'Student' && (
                            <button
                              onClick={() => setEditingStudent(stu)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                              title="Edit Student Details"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {currentRole === 'Admin' && (
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete ${stu.fullName}?`)) {
                                  deleteStudent(stu.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                              title="Delete Student"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>


      {/* VIEW FULL STUDENT PROFILE MODAL */}
      {selectedStudent && (
        <Modal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          title={`Student Profile: ${selectedStudent.fullName}`}
          subtitle={`Student ID / UT Number: ${selectedStudent.utNumber}`}
          maxWidth="xl"
        >
          <div className="space-y-5">
            {/* Header info card */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="w-14 h-14 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-extrabold text-xl">
                {selectedStudent.fullName.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-white">{selectedStudent.fullName}</h4>
                  <Badge variant={selectedStudent.currentStatus === 'Active' ? 'active' : 'purple'}>
                    {selectedStudent.currentStatus}
                  </Badge>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {selectedStudent.courseName} • {selectedStudent.batchName}
                </p>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  NIC: {selectedStudent.nic} • DOB: {selectedStudent.dob} ({selectedStudent.gender})
                </p>
              </div>
            </div>

            {/* Contact & Residential Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Phone & WhatsApp</span>
                <p className="font-semibold text-slate-200 mt-1">{selectedStudent.phone}</p>
                <p className="text-[11px] text-slate-400">WhatsApp: {selectedStudent.whatsapp || selectedStudent.phone}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Emergency Contact</span>
                <p className="font-semibold text-slate-200 mt-1">{selectedStudent.emergencyContact.name}</p>
                <p className="text-[11px] text-slate-400">{selectedStudent.emergencyContact.phone} ({selectedStudent.emergencyContact.relationship})</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 sm:col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Address & District</span>
                <p className="font-semibold text-slate-200 mt-1">
                  {selectedStudent.address}, {selectedStudent.district}
                </p>
              </div>
            </div>

            {/* Blossom Trust Conditional Bank Details Section */}
            {selectedStudent.isBlossomTrust && (
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Blossom Trust Bank Information</span>
                  </div>
                  <Badge variant="emerald">Verified for Support</Badge>
                </div>

                {currentRole === 'Student' ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    🔒 Bank account coordinates and financial details are confidential to Unicom TIC Staff & Blossom Trust Trustees.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Bank Name</span>
                        <span className="font-semibold text-slate-200">{selectedStudent.bankDetails?.bankName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Account Number</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {selectedStudent.bankDetails?.accountNumber}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Branch & Code</span>
                        <span className="font-semibold text-slate-200">
                          {selectedStudent.bankDetails?.branchName} ({selectedStudent.bankDetails?.branchCode || 'N/A'})
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Beneficiary Name</span>
                        <span className="font-semibold text-slate-200">{selectedStudent.bankDetails?.beneficiaryName}</span>
                      </div>
                    </div>

                    {selectedStudent.blossomApplication && (
                      <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                        <p>
                          <span className="text-slate-400">Family Income:</span> LKR {selectedStudent.blossomApplication.familyIncome?.toLocaleString()} / month ({selectedStudent.blossomApplication.familyMembersCount} members)
                        </p>
                        <p>
                          <span className="text-slate-400">Background:</span> {selectedStudent.blossomApplication.financialDifficulties}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* 9-MONTH COURSE COMPLETION & POST-GRADUATION CAREER OUTCOME */}
            {(() => {
              const studentOutcome = outcomes.find((o) => o.studentId === selectedStudent.id);
              return studentOutcome ? (
                <div className="p-4 rounded-xl bg-blue-950/20 border-2 border-blue-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-white">
                        9-Month Course Completion & Career Placement Details
                      </span>
                    </div>
                    <Badge
                      variant={
                        studentOutcome.outcomeStatus === 'Employed'
                          ? 'active'
                          : studentOutcome.outcomeStatus === 'Internship'
                          ? 'blue'
                          : 'purple'
                      }
                    >
                      {studentOutcome.currentStatus || studentOutcome.outcomeStatus}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Working Company</span>
                      <span className="font-extrabold text-white text-sm">
                        {studentOutcome.workingCompanyName || studentOutcome.companyOrInstitution || 'N/A'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Salary (LKR)</span>
                      <span className="font-mono font-extrabold text-emerald-400 text-sm">
                        {studentOutcome.salary ? `LKR ${studentOutcome.salary.toLocaleString()}` : 'LKR 0'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Role / Title</span>
                      <span className="font-semibold text-slate-200">
                        {studentOutcome.jobTitle || 'N/A'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Completion Status</span>
                      <span className="font-semibold text-slate-200">
                        {studentOutcome.courseCompletionStatus || 'Completed (9 Months)'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Specialization</span>
                      <span className="font-semibold text-slate-200">
                        {studentOutcome.courseSpecialization || 'Software Development'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Employment Status</span>
                      <span className="font-semibold text-slate-200">
                        {studentOutcome.employmentStatus || studentOutcome.outcomeStatus}
                      </span>
                    </div>

                    {studentOutcome.otherStatus && studentOutcome.otherStatus !== 'None' && (
                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 sm:col-span-2">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Other Status</span>
                        <span className="font-semibold text-slate-300">{studentOutcome.otherStatus}</span>
                      </div>
                    )}

                    {studentOutcome.workLocation && (
                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Location</span>
                        <span className="font-semibold text-slate-300">{studentOutcome.workLocation}</span>
                      </div>
                    )}
                  </div>

                  {studentOutcome.remarks && (
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300">
                      <span className="text-slate-400 font-bold block mb-0.5">Remarks / Placement Notes:</span>
                      {studentOutcome.remarks}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Briefcase className="w-4 h-4 text-slate-500" />
                    <span>No post-course career outcome recorded yet.</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const surveyUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/survey`;
                      navigator.clipboard.writeText(surveyUrl);
                      alert('Survey Link Copied! Share with student to fill their details.');
                    }}
                    className="text-[11px] py-1 h-7"
                  >
                    Copy Survey Link
                  </Button>
                </div>
              );
            })()}

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setSelectedStudent(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* REGISTER STUDENT MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Student"
        subtitle="Unicom TIC Training Centre Student Enrolment"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateStudent} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="UT Number *"
              required
              value={formData.utNumber}
              onChange={(e) => setFormData({ ...formData, utNumber: e.target.value })}
            />
            <div className="sm:col-span-2">
              <Input
                label="Full Name *"
                required
                placeholder="e.g. Karthik Sivakumar"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="NIC Number *"
              required
              placeholder="e.g. 200185403211"
              value={formData.nic}
              onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
            />
            <Input
              label="Date of Birth *"
              type="date"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
            />
            <Select
              label="Gender"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
              options={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Other', label: 'Other' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Phone Number *"
              required
              placeholder="+94 77 123 4567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="WhatsApp Number"
              placeholder="+94 77 123 4567"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Email Address"
              type="email"
              placeholder="student@unicomtic.org"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="District"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
            />
          </div>

          <Input
            label="Residential Address"
            placeholder="e.g. Point Pedro Road, Nallur, Jaffna"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          {/* Course & Batch Selection (ONE course per student) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <Select
              label="Course Allocation (1 Course Per Student) *"
              value={formData.courseId}
              onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
              options={courses.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }))}
            />
            <Select
              label="Assigned Batch *"
              value={formData.batchId}
              onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
              options={batches.map((b) => ({ value: b.id, label: b.name }))}
            />
          </div>

          {/* Emergency Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <Input
              label="Emergency Contact Name"
              placeholder="e.g. Sivakumar (Father)"
              value={formData.emergencyContactName}
              onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
            />
            <Input
              label="Emergency Phone"
              placeholder="+94 77 991 2234"
              value={formData.emergencyContactPhone}
              onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
            />
            <Input
              label="Relationship"
              placeholder="Father / Guardian"
              value={formData.emergencyContactRelationship}
              onChange={(e) => setFormData({ ...formData, emergencyContactRelationship: e.target.value })}
            />
          </div>

          {/* Student Photo Upload */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Student Photo (Max 5 MB)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoUpload}
              className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700"
            />
            {isUploadingPhoto && <p className="text-xs text-blue-400 animate-pulse">Uploading photo...</p>}
          </div>

          {/* BLOSSOM TRUST STUDENT / NON-BLOSSOM STUDENT PILL SELECTOR */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 border border-blue-500/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-xs font-bold text-white block">
                  Student Category *
                </label>
                <p className="text-[11px] text-slate-400">
                  Select whether student receives Blossom Trust scholarship (LKR 15,000 / month) or is a non-blossom student
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-full border border-slate-800">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isBlossomTrust: true })}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    formData.isBlossomTrust
                      ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-md ring-1 ring-purple-400/50'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <HeartHandshake className="w-3.5 h-3.5" />
                  <span>Blossom Trust Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isBlossomTrust: false })}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    !formData.isBlossomTrust
                      ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-md ring-1 ring-purple-400/50'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Non-Blossom Student</span>
                </button>
              </div>
            </div>

            {/* CONDITIONAL BANK & APPLICATION FIELDS: ONLY VISIBLE IF YES */}
            {formData.isBlossomTrust ? (
              <div className="pt-3 border-t border-slate-800 space-y-3 animate-fadeIn">
                <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" /> Blossom Trust Bank Details for Stipends
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Select
                    label="Bank Name (Dropdown) *"
                    value={formData.bankName}
                    onChange={(e) => {
                      const bank = SRI_LANKA_BANKS.find((b) => b.bankName === e.target.value) || SRI_LANKA_BANKS[0];
                      const firstBr = bank.branches[0];
                      setFormData({
                        ...formData,
                        bankName: bank.bankName,
                        branchName: firstBr ? firstBr.branchName : '',
                        branchCode: firstBr ? firstBr.branchCode : '',
                        bankDistrict: firstBr ? firstBr.district : formData.district,
                      });
                    }}
                    options={SRI_LANKA_BANKS.map((b) => ({ value: b.bankName, label: b.bankName }))}
                  />

                  <Select
                    label="Branch Name (Dropdown) *"
                    value={formData.branchName}
                    onChange={(e) => {
                      const currentBank = SRI_LANKA_BANKS.find((b) => b.bankName === formData.bankName) || SRI_LANKA_BANKS[0];
                      const br = currentBank.branches.find((b) => b.branchName === e.target.value);
                      if (br) {
                        setFormData({
                          ...formData,
                          branchName: br.branchName,
                          branchCode: br.branchCode,
                          bankDistrict: br.district,
                        });
                      }
                    }}
                    options={(
                      SRI_LANKA_BANKS.find((b) => b.bankName === formData.bankName) || SRI_LANKA_BANKS[0]
                    ).branches.map((br) => ({
                      value: br.branchName,
                      label: `${br.branchName} (${br.district})`,
                    }))}
                  />

                  <Select
                    label="Branch Code (Auto-Filled) *"
                    value={formData.branchCode}
                    onChange={(e) => {
                      const currentBank = SRI_LANKA_BANKS.find((b) => b.bankName === formData.bankName) || SRI_LANKA_BANKS[0];
                      const br = currentBank.branches.find((b) => b.branchCode === e.target.value);
                      if (br) {
                        setFormData({
                          ...formData,
                          branchName: br.branchName,
                          branchCode: br.branchCode,
                          bankDistrict: br.district,
                        });
                      }
                    }}
                    options={(
                      SRI_LANKA_BANKS.find((b) => b.bankName === formData.bankName) || SRI_LANKA_BANKS[0]
                    ).branches.map((br) => ({
                      value: br.branchCode,
                      label: `${br.branchCode} - ${br.branchName}`,
                    }))}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Account Number *"
                    required={formData.isBlossomTrust}
                    placeholder="e.g. 8004529103"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  />
                  <Input
                    label="Beneficiary Name on Account"
                    placeholder="e.g. Karthik Sivakumar"
                    value={formData.beneficiaryName}
                    onChange={(e) => setFormData({ ...formData, beneficiaryName: e.target.value })}
                  />
                </div>

                {/* Blossom Application Background Data */}
                <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Parents' Occupation"
                    placeholder="e.g. Farmer / Weaver"
                    value={formData.parentsOccupation}
                    onChange={(e) => setFormData({ ...formData, parentsOccupation: e.target.value })}
                  />
                  <Input
                    label="Monthly Family Income (Rs.)"
                    type="number"
                    value={formData.familyIncome}
                    onChange={(e) => setFormData({ ...formData, familyIncome: Number(e.target.value) })}
                  />
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic pt-1">
                Student will be registered as Non-Blossom. Bank disbursement information is not required.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" leftIcon={<CheckCircle2 className="w-4 h-4" />}>
              Save & Enrol Student
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT STUDENT MODAL */}
      {editingStudent && (
        <Modal
          isOpen={!!editingStudent}
          onClose={() => setEditingStudent(null)}
          title={`Edit Student: ${editingStudent.fullName}`}
          subtitle={`Student ID: ${editingStudent.utNumber}`}
          maxWidth="xl"
        >
          <form onSubmit={handleUpdateStudentSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Full Name"
                required
                value={editingStudent.fullName}
                onChange={(e) =>
                  setEditingStudent({ ...editingStudent, fullName: e.target.value })
                }
              />
              <Input
                label="NIC"
                value={editingStudent.nic}
                onChange={(e) =>
                  setEditingStudent({ ...editingStudent, nic: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Phone"
                value={editingStudent.phone}
                onChange={(e) =>
                  setEditingStudent({ ...editingStudent, phone: e.target.value })
                }
              />
              <Input
                label="Email"
                type="email"
                value={editingStudent.email}
                onChange={(e) =>
                  setEditingStudent({ ...editingStudent, email: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Course Allocation"
                value={editingStudent.courseId}
                onChange={(e) => {
                  const c = courses.find((crs) => crs.id === e.target.value);
                  setEditingStudent({
                    ...editingStudent,
                    courseId: e.target.value,
                    courseName: c?.name || editingStudent.courseName,
                  });
                }}
                options={courses.map((c) => ({ value: c.id, label: c.name }))}
              />
              <Select
                label="Status"
                value={editingStudent.currentStatus}
                onChange={(e) =>
                  setEditingStudent({
                    ...editingStudent,
                    currentStatus: e.target.value as StudentStatus,
                  })
                }
                options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'Completed', label: 'Completed' },
                  { value: 'Dropout', label: 'Dropout' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
            </div>

            {editingStudent.isBlossomTrust && (
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-emerald-400">Blossom Trust Bank Account Details</p>
                  <span className="text-[10px] text-emerald-400/80 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
                    Direct Stipend Disbursement
                  </span>
                </div>

                <Select
                  label="Bank Name (Select Bank) *"
                  value={editingStudent.bankDetails?.bankName || SRI_LANKA_BANKS[0].bankName}
                  onChange={(e) => {
                    const newBankName = e.target.value;
                    const b = SRI_LANKA_BANKS.find((item) => item.bankName === newBankName) || SRI_LANKA_BANKS[0];
                    const firstBranch = b.branches[0];
                    setEditingStudent({
                      ...editingStudent,
                      bankDetails: {
                        ...(editingStudent.bankDetails || {
                          accountNumber: '',
                          beneficiaryName: editingStudent.fullName,
                        }),
                        bankName: b.bankName,
                        branchName: firstBranch.branchName,
                        branchCode: firstBranch.branchCode,
                        district: firstBranch.district,
                        accountNumber: editingStudent.bankDetails?.accountNumber || '',
                        beneficiaryName: editingStudent.bankDetails?.beneficiaryName || editingStudent.fullName,
                      },
                    });
                  }}
                  options={SRI_LANKA_BANKS.map((b) => ({ value: b.bankName, label: b.bankName }))}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label="Branch Name (Dropdown) *"
                    value={
                      editingStudent.bankDetails?.branchName ||
                      (SRI_LANKA_BANKS.find((b) => b.bankName === (editingStudent.bankDetails?.bankName || SRI_LANKA_BANKS[0].bankName)) || SRI_LANKA_BANKS[0]).branches[0].branchName
                    }
                    onChange={(e) => {
                      const curBankName = editingStudent.bankDetails?.bankName || SRI_LANKA_BANKS[0].bankName;
                      const curBank = SRI_LANKA_BANKS.find((b) => b.bankName === curBankName) || SRI_LANKA_BANKS[0];
                      const br = curBank.branches.find((b) => b.branchName === e.target.value);
                      if (br) {
                        setEditingStudent({
                          ...editingStudent,
                          bankDetails: {
                            ...(editingStudent.bankDetails || {
                              accountNumber: '',
                              beneficiaryName: editingStudent.fullName,
                            }),
                            bankName: curBank.bankName,
                            branchName: br.branchName,
                            branchCode: br.branchCode,
                            district: br.district,
                            accountNumber: editingStudent.bankDetails?.accountNumber || '',
                            beneficiaryName: editingStudent.bankDetails?.beneficiaryName || editingStudent.fullName,
                          },
                        });
                      }
                    }}
                    options={(
                      SRI_LANKA_BANKS.find(
                        (b) => b.bankName === (editingStudent.bankDetails?.bankName || SRI_LANKA_BANKS[0].bankName)
                      ) || SRI_LANKA_BANKS[0]
                    ).branches.map((br) => ({
                      value: br.branchName,
                      label: `${br.branchName} (${br.district})`,
                    }))}
                  />

                  <Select
                    label="Branch Code (Auto-Filled) *"
                    value={
                      editingStudent.bankDetails?.branchCode ||
                      (SRI_LANKA_BANKS.find((b) => b.bankName === (editingStudent.bankDetails?.bankName || SRI_LANKA_BANKS[0].bankName)) || SRI_LANKA_BANKS[0]).branches[0].branchCode
                    }
                    onChange={(e) => {
                      const curBankName = editingStudent.bankDetails?.bankName || SRI_LANKA_BANKS[0].bankName;
                      const curBank = SRI_LANKA_BANKS.find((b) => b.bankName === curBankName) || SRI_LANKA_BANKS[0];
                      const br = curBank.branches.find((b) => b.branchCode === e.target.value);
                      if (br) {
                        setEditingStudent({
                          ...editingStudent,
                          bankDetails: {
                            ...(editingStudent.bankDetails || {
                              accountNumber: '',
                              beneficiaryName: editingStudent.fullName,
                            }),
                            bankName: curBank.bankName,
                            branchName: br.branchName,
                            branchCode: br.branchCode,
                            district: br.district,
                            accountNumber: editingStudent.bankDetails?.accountNumber || '',
                            beneficiaryName: editingStudent.bankDetails?.beneficiaryName || editingStudent.fullName,
                          },
                        });
                      }
                    }}
                    options={(
                      SRI_LANKA_BANKS.find(
                        (b) => b.bankName === (editingStudent.bankDetails?.bankName || SRI_LANKA_BANKS[0].bankName)
                      ) || SRI_LANKA_BANKS[0]
                    ).branches.map((br) => ({
                      value: br.branchCode,
                      label: `${br.branchCode} - ${br.branchName}`,
                    }))}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Account Number *"
                    value={editingStudent.bankDetails?.accountNumber || ''}
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        bankDetails: {
                          ...(editingStudent.bankDetails || {
                            bankName: SRI_LANKA_BANKS[0].bankName,
                            branchName: SRI_LANKA_BANKS[0].branches[0].branchName,
                            branchCode: SRI_LANKA_BANKS[0].branches[0].branchCode,
                            district: SRI_LANKA_BANKS[0].branches[0].district,
                            beneficiaryName: editingStudent.fullName,
                          }),
                          accountNumber: e.target.value,
                        },
                      })
                    }
                  />
                  <Input
                    label="Beneficiary / Account Holder Name"
                    value={editingStudent.bankDetails?.beneficiaryName || ''}
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        bankDetails: {
                          ...(editingStudent.bankDetails || {
                            bankName: SRI_LANKA_BANKS[0].bankName,
                            branchName: SRI_LANKA_BANKS[0].branches[0].branchName,
                            branchCode: SRI_LANKA_BANKS[0].branches[0].branchCode,
                            district: SRI_LANKA_BANKS[0].branches[0].district,
                            accountNumber: '',
                          }),
                          beneficiaryName: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <Button type="button" variant="secondary" onClick={() => setEditingStudent(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Update Student Record
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
