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

export default function StudentsPage() {
  const {
    students,
    courses,
    batches,
    addStudent,
    updateStudent,
    deleteStudent,
    currentRole,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [blossomFilter, setBlossomFilter] = useState<string>('all');

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
      const matchesBlossom =
        blossomFilter === 'all' ||
        (blossomFilter === 'blossom' && s.isBlossomTrust) ||
        (blossomFilter === 'non-blossom' && !s.isBlossomTrust);

      return matchesSearch && matchesBatch && matchesCourse && matchesStatus && matchesBlossom;
    });
  }, [students, searchQuery, batchFilter, courseFilter, statusFilter, blossomFilter]);

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
      Blossom_Trust: s.isBlossomTrust ? 'YES' : 'NO',
      NIC: s.nic,
      Phone: s.phone,
      Email: s.email,
      District: s.district,
      Bank_Name: s.bankDetails?.bankName || 'N/A',
      Account_Number: s.bankDetails?.accountNumber || 'N/A',
      Branch: s.bankDetails?.branchName || 'N/A',
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
      'Blossom Trust': s.isBlossomTrust ? 'YES' : 'NO',
      'NIC': s.nic,
      'DOB': s.dob,
      'Gender': s.gender,
      'Phone': s.phone,
      'Email': s.email,
      'District': s.district,
      'Bank Name': s.bankDetails?.bankName || '',
      'Account Number': s.bankDetails?.accountNumber || '',
      'Branch': s.bankDetails?.branchName || '',
    }));

    exportToExcel('TIC360_Students_Register', [{ sheetName: 'Students', data: exportData }]);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Student Directory & Registration
            </h1>
            <Badge variant="blue">{filteredStudents.length} Students</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage student registrations, single-course allocations, Blossom Trust bank accounts, and lifecycle statuses
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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
                placeholder="Search by UT number, student name, NIC, phone, or email..."
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

              <div className="w-full sm:w-36">
                <Select
                  value={blossomFilter}
                  onChange={(e) => setBlossomFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'Blossom: All' },
                    { value: 'blossom', label: 'Blossom (Yes)' },
                    { value: 'non-blossom', label: 'Self-Funded (No)' },
                  ]}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                <th className="py-3 px-4 sm:px-6">Student ID & Name</th>
                <th className="py-3 px-4">Course & Batch</th>
                <th className="py-3 px-4">Blossom Support</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">District</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No student records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((stu) => (
                  <tr key={stu.id} className="hover:bg-slate-900/40 transition-colors group">
                    {/* ID & Name */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                          {stu.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                            {stu.fullName}
                          </p>
                          <p className="text-[11px] font-mono text-slate-400">
                            {stu.utNumber} • NIC: {stu.nic}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Course & Batch */}
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-200">{stu.courseName}</p>
                      <p className="text-[11px] text-slate-400">{stu.batchName}</p>
                    </td>

                    {/* Blossom Support */}
                    <td className="py-3.5 px-4">
                      {stu.isBlossomTrust ? (
                        <div className="space-y-0.5">
                          <Badge variant="emerald" dot>
                            Blossom Scholar
                          </Badge>
                          <p className="text-[10px] text-slate-400 truncate max-w-[130px]">
                            {stu.bankDetails?.bankName}
                          </p>
                        </div>
                      ) : (
                        <Badge variant="neutral">Self-Funded</Badge>
                      )}
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4 text-slate-300">
                      <p className="flex items-center gap-1.5 text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{stu.phone}</span>
                      </p>
                      <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[140px]">{stu.email}</span>
                      </p>
                    </td>

                    {/* District */}
                    <td className="py-3.5 px-4 text-slate-300 font-medium">
                      {stu.district}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
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

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
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
                            title="Edit Student"
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
      </Card>

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

          {/* BLOSSOM TRUST STUDENT: YES / NO TOGGLE */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 border border-blue-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-white block">
                  Blossom Trust Student? *
                </label>
                <p className="text-[11px] text-slate-400">
                  Enrol as an official Blossom Trust scholarship beneficiary
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isBlossomTrust: true })}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    formData.isBlossomTrust
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  YES
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isBlossomTrust: false })}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    !formData.isBlossomTrust
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  NO
                </button>
              </div>
            </div>

            {/* CONDITIONAL BANK & APPLICATION FIELDS: ONLY VISIBLE IF YES */}
            {formData.isBlossomTrust ? (
              <div className="pt-3 border-t border-slate-800 space-y-3 animate-fadeIn">
                <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" /> Blossom Trust Bank Details for Stipends
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Bank Name *"
                    required={formData.isBlossomTrust}
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  />
                  <Input
                    label="Account Number *"
                    required={formData.isBlossomTrust}
                    placeholder="e.g. 8004529103"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="Branch Name *"
                    value={formData.branchName}
                    onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                  />
                  <Input
                    label="Branch Code"
                    value={formData.branchCode}
                    onChange={(e) => setFormData({ ...formData, branchCode: e.target.value })}
                  />
                  <Input
                    label="Bank District"
                    value={formData.bankDistrict}
                    onChange={(e) => setFormData({ ...formData, bankDistrict: e.target.value })}
                  />
                </div>

                <Input
                  label="Beneficiary Name on Account"
                  placeholder="e.g. Karthik Sivakumar"
                  value={formData.beneficiaryName}
                  onChange={(e) => setFormData({ ...formData, beneficiaryName: e.target.value })}
                />

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
                Student will be registered as Self-Funded. Bank disbursement information is not required.
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
                <p className="text-xs font-bold text-emerald-400">Blossom Trust Bank Account</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Bank Name"
                    value={editingStudent.bankDetails?.bankName || ''}
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        bankDetails: {
                          ...(editingStudent.bankDetails || {
                            accountNumber: '',
                            bankName: '',
                            branchName: '',
                            beneficiaryName: '',
                            district: '',
                          }),
                          bankName: e.target.value,
                        },
                      })
                    }
                  />
                  <Input
                    label="Account Number"
                    value={editingStudent.bankDetails?.accountNumber || ''}
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        bankDetails: {
                          ...(editingStudent.bankDetails || {
                            accountNumber: '',
                            bankName: '',
                            branchName: '',
                            beneficiaryName: '',
                            district: '',
                          }),
                          accountNumber: e.target.value,
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
