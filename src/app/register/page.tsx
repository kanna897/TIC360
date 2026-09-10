'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  Sparkles,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  HeartHandshake,
  CreditCard,
  Building,
  Calendar,
  MapPin,
  FileCheck,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Printer,
  Upload,
  Code2,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from '@/lib/store';
import { Gender, StudentStatus, Student } from '@/lib/types';
import { UserAccount } from '@/lib/auth';
import { SRI_LANKA_BANKS, BankInfo, BankBranch } from '@/lib/sriLankaBanks';
import { Button } from '@/components/ui/Button';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { formatCurrency } from '@/lib/utils';

export default function StudentRegisterPage() {
  const router = useRouter();
  const { courses, batches, orgProfile, registerNewStudent } = useStore();

  const [step, setStep] = useState<1 | 2>(1); // 1: Form, 2: Success Confirmation Card
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success state after registration
  const [registeredData, setRegisteredData] = useState<{
    student: Student;
    account: UserAccount;
  } | null>(null);

  // Default Bank setup from SRI_LANKA_BANKS
  const defaultBank = SRI_LANKA_BANKS[0]; // Bank of Ceylon (BOC)
  const defaultBranch = defaultBank.branches[0]; // Jaffna Main Branch

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    nic: '',
    dob: '2004-05-15',
    gender: 'Female' as Gender,
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    district: 'Jaffna',
    photoUrl: '',
    // Emergency Contact
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: 'Parent',
    // Academic Course & Batch (Only Software Development & Batch 2026 in TIC)
    courseId: courses[0]?.id || 'CRS-01',
    courseName: 'Software Development',
    batchId: batches[0]?.id || 'BAT-2026',
    batchName: 'Batch 2026',
    // Blossom Trust Stipend
    isBlossomTrust: true,
    // Dynamic Sri Lanka Bank Details
    bankName: defaultBank.bankName,
    branchName: defaultBranch.branchName,
    branchCode: defaultBranch.branchCode,
    accountNumber: '',
    beneficiaryName: '',
    bankDistrict: defaultBranch.district,
    // Family & Income
    parentsOccupation: 'Agriculture / Daily Wage',
    familyIncome: 35000,
    familyMembersCount: 4,
    siblingsCount: 2,
    financialDifficulties: 'Need stipend assistance for daily transport and study materials.',
    accommodationExpense: 4000,
    foodExpense: 12000,
    // Password
    password: '',
    confirmPassword: '',
    group: 'Group A' as 'Group A' | 'Group B',
  });

  // Current bank branches list for dynamic dropdown
  const currentBankInfo =
    SRI_LANKA_BANKS.find((b) => b.bankName === formData.bankName) || SRI_LANKA_BANKS[0];

  const handleBankChange = (newBankName: string) => {
    const bank = SRI_LANKA_BANKS.find((b) => b.bankName === newBankName) || SRI_LANKA_BANKS[0];
    const firstBranch = bank.branches[0];
    setFormData((prev) => ({
      ...prev,
      bankName: bank.bankName,
      branchName: firstBranch ? firstBranch.branchName : '',
      branchCode: firstBranch ? firstBranch.branchCode : '',
      bankDistrict: firstBranch ? firstBranch.district : prev.district,
    }));
  };

  const handleBranchChange = (newBranchName: string) => {
    const branch = currentBankInfo.branches.find((br) => br.branchName === newBranchName);
    if (branch) {
      setFormData((prev) => ({
        ...prev,
        branchName: branch.branchName,
        branchCode: branch.branchCode,
        bankDistrict: branch.district,
      }));
    }
  };

  const handleBranchCodeChange = (newBranchCode: string) => {
    const branch = currentBankInfo.branches.find((br) => br.branchCode === newBranchCode);
    if (branch) {
      setFormData((prev) => ({
        ...prev,
        branchName: branch.branchName,
        branchCode: branch.branchCode,
        bankDistrict: branch.district,
      }));
    } else {
      setFormData((prev) => ({ ...prev, branchCode: newBranchCode }));
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      setErrorMsg('');
      const res = await uploadToCloudinary(file, 'photo');
      if (res.success && res.url) {
        setFormData((prev) => ({ ...prev, photoUrl: res.url }));
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Failed to upload photo. You can continue and add it later.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validation
    if (!formData.fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!formData.nic.trim()) {
      setErrorMsg('Please enter your National Identity Card (NIC) number or passport.');
      return;
    }
    if (!formData.email.trim()) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMsg('Please enter your contact phone number.');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Password and Confirm Password do not match.');
      return;
    }

    if (formData.isBlossomTrust && !formData.accountNumber.trim()) {
      setErrorMsg('Please provide your bank account number for Blossom monthly stipend transfers.');
      return;
    }

    setIsSubmitting(true);

    try {
      const studentPayload: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'utNumber'> = {
        fullName: formData.fullName.trim(),
        nic: formData.nic.trim().toUpperCase(),
        dob: formData.dob,
        gender: formData.gender,
        phone: formData.phone.trim(),
        whatsapp: formData.whatsapp.trim() || formData.phone.trim(),
        email: formData.email.trim().toLowerCase(),
        address: formData.address.trim(),
        district: formData.district,
        photoUrl: formData.photoUrl || undefined,
        emergencyContact: {
          name: formData.emergencyContactName.trim() || 'Parent / Guardian',
          phone: formData.emergencyContactPhone.trim() || formData.phone.trim(),
          relationship: formData.emergencyContactRelationship,
        },
        courseId: 'CRS-01',
        courseName: 'Software Development',
        batchId: 'BAT-2026',
        batchName: 'Batch 2026',
        group: formData.group,
        isBlossomTrust: formData.isBlossomTrust,
        currentStatus: 'Active' as StudentStatus,
        bankDetails: formData.isBlossomTrust
          ? {
              bankName: formData.bankName,
              branchName: formData.branchName,
              branchCode: formData.branchCode,
              accountNumber: formData.accountNumber.trim(),
              beneficiaryName: formData.beneficiaryName.trim() || formData.fullName.trim(),
              district: formData.bankDistrict,
            }
          : undefined,
        blossomApplication: formData.isBlossomTrust
          ? {
              parentsOccupation: formData.parentsOccupation,
              familyIncome: Number(formData.familyIncome) || 30000,
              familyMembersCount: Number(formData.familyMembersCount) || 4,
              siblingsCount: Number(formData.siblingsCount) || 1,
              financialDifficulties: formData.financialDifficulties,
              accommodationExpense: Number(formData.accommodationExpense) || 0,
              foodExpense: Number(formData.foodExpense) || 0,
              declarationSigned: true,
              verificationStatus: 'Pending',
            }
          : undefined,
      };

      const result = registerNewStudent(studentPayload, formData.password);
      setRegisteredData(result);
      setStep(2);

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore if not supported
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('An error occurred during registration. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 relative overflow-x-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[450px] h-[450px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Portal Home</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Already registered?</span>
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-bold hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1.5"
            >
              <span>Student Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 border border-slate-700 shadow-xl ring-4 ring-blue-500/20 p-1 mb-1">
            <img
              src="/logo-badge.jpg"
              alt="TIC360"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            <span>Student Trainee Registration</span>
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Admission Open
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            {orgProfile.orgName} in partnership with <span className="text-emerald-400 font-semibold">{orgProfile.trustName}</span>.
            Complete this form to create your student account and apply for monthly stipend assistance.
          </p>
        </div>

        {/* STEP 2: REGISTRATION CONFIRMATION / TRAINEE ID CARD */}
        {step === 2 && registeredData && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-emerald-500/40 backdrop-blur-2xl shadow-2xl space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-2xl font-black text-white">Registration Successful!</h2>
                <p className="text-xs sm:text-sm text-slate-300">
                  Welcome, <span className="text-white font-bold">{registeredData.student.fullName}</span>! Your student admission has been confirmed.
                </p>
              </div>

              {/* Trainee Card */}
              <div className="max-w-lg mx-auto p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-700/80 shadow-2xl text-left space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-400" />
                    <span className="text-xs font-bold text-slate-200">TIC360 TRAINEE IDENTITY</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold">
                    OFFICIAL
                  </span>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-20 h-24 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                    {registeredData.student.photoUrl ? (
                      <img
                        src={registeredData.student.photoUrl}
                        alt={registeredData.student.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 text-slate-500" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <h3 className="text-base font-bold text-white">{registeredData.student.fullName}</h3>
                    <div className="space-y-0.5 text-xs text-slate-300 font-mono">
                      <div>
                        <span className="text-slate-400">Student UT No: </span>
                        <span className="text-emerald-400 font-bold text-sm">
                          {registeredData.student.utNumber}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">NIC: </span>
                        <span>{registeredData.student.nic}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Course: </span>
                        <span className="text-blue-300">Software Development (9 Months)</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Batch: </span>
                        <span>Batch 2026</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-300">
                      {registeredData.student.isBlossomTrust
                        ? '🌸 Blossom Trust Scholar (LKR 15,000/mo eligible with ≥80% attendance)'
                        : 'Standard Trainee'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Login Credentials Notice */}
              <div className="max-w-lg mx-auto p-4 rounded-xl bg-blue-950/40 border border-blue-800/60 text-left space-y-1.5 text-xs">
                <p className="font-bold text-blue-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  Your Student Login Credentials:
                </p>
                <div className="font-mono text-slate-300 space-y-1 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Login ID / UT No:</span>
                    <span className="text-white font-bold">{registeredData.student.utNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Registered Email:</span>
                    <span className="text-white">{registeredData.student.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Password:</span>
                    <span className="text-emerald-400 font-bold">•••••••• (Your chosen password)</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  You can log in anytime using either your <strong>UT Number</strong> or your <strong>Email</strong>.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Button
                  variant="primary"
                  className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold justify-center"
                  onClick={() => router.push('/portal')}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Enter My Student Portal Now
                </Button>
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold justify-center"
                  onClick={() => router.push('/login')}
                  leftIcon={<Lock className="w-4 h-4" />}
                >
                  Go to Login Screen
                </Button>
                <Button
                  variant="ghost"
                  className="w-full sm:w-auto px-4 py-2.5 text-xs justify-center"
                  onClick={() => window.print()}
                  leftIcon={<Printer className="w-4 h-4" />}
                >
                  Print ID Card
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: REGISTRATION FORM */}
        {step === 1 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3 animate-fadeIn">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            {/* SECTION 1: Personal Details */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
                <User className="w-5 h-5 text-blue-400" />
                <div>
                  <h2 className="text-sm font-bold text-white">1. Personal Details</h2>
                  <p className="text-[11px] text-slate-400">Basic identification information as per your NIC</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Full Name (with Initials or as in NIC) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. S. Priya or Priya Sundaramoorthy"
                    className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    National Identity Card (NIC) / Passport *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nic}
                    onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
                    placeholder="e.g. 200458901234 or 991234567V"
                    className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">District of Residence *</label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Jaffna">Jaffna</option>
                    <option value="Kilinochchi">Kilinochchi</option>
                    <option value="Mullaitivu">Mullaitivu</option>
                    <option value="Vavuniya">Vavuniya</option>
                    <option value="Mannar">Mannar</option>
                    <option value="Batticaloa">Batticaloa</option>
                    <option value="Trincomalee">Trincomalee</option>
                    <option value="Ampara">Ampara</option>
                    <option value="Colombo">Colombo</option>
                    <option value="Kandy">Kandy</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Class Group Selection */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Class Group *
                  </label>
                  <select
                    value={formData.group}
                    onChange={(e) => setFormData({ ...formData, group: e.target.value as 'Group A' | 'Group B' })}
                    className="w-full rounded-xl bg-slate-950/70 border border-emerald-600/60 px-3.5 py-2.5 text-xs text-emerald-300 font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Group A">🅰️ Group A</option>
                    <option value="Group B">🅱️ Group B</option>
                  </select>
                  <p className="text-[10px] text-slate-500">Select the class group assigned by the trainer</p>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Permanent Residential Address *</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="No, Street name, Village / Town"
                    className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Photo Upload */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Profile Photo / Passport Size Image (Optional)
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                      {formData.photoUrl ? (
                        <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-slate-600" />
                      )}
                    </div>
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors">
                      <Upload className="w-3.5 h-3.5 text-blue-400" />
                      <span>{isUploadingPhoto ? 'Uploading Photo...' : 'Upload Student Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={isUploadingPhoto}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: Contact & Emergency */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
                <Phone className="w-5 h-5 text-emerald-400" />
                <div>
                  <h2 className="text-sm font-bold text-white">2. Contact & Emergency Details</h2>
                  <p className="text-[11px] text-slate-400">Communication and emergency notification channels</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Primary Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0771234567"
                    className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">WhatsApp Number</label>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="0771234567 (if same as mobile, leave blank)"
                    className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Email Address (Used for Login & Notices) *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="yourname@gmail.com"
                    className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Emergency Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    placeholder="Parent / Guardian Name"
                    className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Emergency Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    placeholder="0779876543"
                    className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: Academic Enrollment - SINGLE COURSE ONLY (SOFTWARE DEVELOPMENT & BATCH 2026) */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
                <Code2 className="w-5 h-5 text-purple-400" />
                <div>
                  <h2 className="text-sm font-bold text-white">3. Academic Enrollment</h2>
                  <p className="text-[11px] text-slate-400">Official TIC Vocational Course & Active Intake</p>
                </div>
              </div>

              {/* Single Course and Batch Presentation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/30 to-slate-950/80 border border-purple-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                      Enrolled Vocational Course
                    </span>
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                      TIC-SD
                    </span>
                  </div>
                  <div className="text-base font-black text-white flex items-center gap-2">
                    <span>Software Development (9 Months)</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Comprehensive 9-Month Intensive Training: Full Stack Web Engineering, Database Design, React 19, Next.js, Node.js & Industry Internship.
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold pt-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Duration: 9 Months (Full-Time)</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/30 to-slate-950/80 border border-blue-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                      Academic Intake
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                      Active
                    </span>
                  </div>
                  <div className="text-base font-black text-white flex items-center gap-2">
                    <span>Batch 2026</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Direct admission into the 2026 academic cohort at Unicom TIC Training Centre.
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] text-blue-400 font-semibold pt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Intake: 2026 Academic Session</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 4: Blossom Trust Financial Support Application WITH DYNAMIC SRI LANKA BANK DROPDOWNS */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <HeartHandshake className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h2 className="text-sm font-bold text-white">4. Student Category & Blossom Trust Assistance</h2>
                    <p className="text-[11px] text-slate-400">
                      Select whether applicant is applying as a Blossom Trust Scholar (LKR 15,000 / month) or Non-Blossom Trainee
                    </p>
                  </div>
                </div>

                {/* Prominent Pill Buttons */}
                <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-full border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isBlossomTrust: true })}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                      formData.isBlossomTrust
                        ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-md shadow-indigo-600/40 ring-1 ring-purple-400/50'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <HeartHandshake className="w-3.5 h-3.5" />
                    <span>Blossom Trust Student</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isBlossomTrust: false })}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                      !formData.isBlossomTrust
                        ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-md shadow-indigo-600/40 ring-1 ring-purple-400/50'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Non-Blossom Student</span>
                  </button>
                </div>
              </div>

              {!formData.isBlossomTrust && (
                <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-800/30 text-xs text-blue-300 flex items-center gap-3 animate-fadeIn">
                  <GraduationCap className="w-5 h-5 text-blue-400 shrink-0" />
                  <div>
                    <p className="font-bold text-white">Enrolling as a Non-Blossom Student</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Standard academic enrollment in Software Development course. No Blossom Trust bank details or financial assistance required.
                    </p>
                  </div>
                </div>
              )}

              {formData.isBlossomTrust ? (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Important Attendance Criteria: </span>
                      Trainees receiving the Blossom Trust monthly stipend must maintain at least{' '}
                      <span className="font-bold text-white underline">80% monthly attendance</span>. If attendance falls below 80% in any given month, the payment for that month will be LKR 0 as per policy.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {/* 1. Bank Name Dropdown */}
                    <div className="space-y-1 sm:col-span-2 md:col-span-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Bank Name (Dropdown) *
                      </label>
                      <select
                        value={formData.bankName}
                        onChange={(e) => handleBankChange(e.target.value)}
                        className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                      >
                        {SRI_LANKA_BANKS.map((b) => (
                          <option key={b.id} value={b.bankName}>
                            {b.bankName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Branch Name Dropdown (Dynamically populated based on Bank) */}
                    <div className="space-y-1 sm:col-span-2 md:col-span-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Branch Name (Dropdown) *
                      </label>
                      <select
                        value={formData.branchName}
                        onChange={(e) => handleBranchChange(e.target.value)}
                        className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                      >
                        {currentBankInfo.branches.map((br) => (
                          <option key={`${br.branchName}-${br.branchCode}`} value={br.branchName}>
                            {br.branchName} ({br.district})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 3. Branch Code (Auto-filled on branch select, also selectable) */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Branch Code (Auto-Filled) *
                      </label>
                      <select
                        value={formData.branchCode}
                        onChange={(e) => handleBranchCodeChange(e.target.value)}
                        className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3.5 py-2.5 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      >
                        {currentBankInfo.branches.map((br) => (
                          <option key={`code-${br.branchCode}`} value={br.branchCode}>
                            {br.branchCode} - {br.branchName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 4. Student Account Number */}
                    <div className="space-y-1 sm:col-span-2 md:col-span-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Student Account Number *
                      </label>
                      <input
                        type="text"
                        required={formData.isBlossomTrust}
                        value={formData.accountNumber}
                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                        placeholder="e.g. 8004529103"
                        className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                      />
                    </div>

                    {/* 5. Beneficiary Name */}
                    <div className="space-y-1 sm:col-span-2 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-300">
                          Beneficiary / Account Holder Name *
                        </label>
                        {formData.fullName && (
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, beneficiaryName: formData.fullName })
                            }
                            className="text-[10px] text-emerald-400 hover:underline font-medium"
                          >
                            Use Full Name
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        required={formData.isBlossomTrust}
                        value={formData.beneficiaryName}
                        onChange={(e) => setFormData({ ...formData, beneficiaryName: e.target.value })}
                        placeholder="Name exactly as in Bank Passbook"
                        className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    {/* 6. Parent/Guardian Occupation */}
                    <div className="space-y-1 sm:col-span-2 md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300">
                        Parent / Guardian Occupation
                      </label>
                      <input
                        type="text"
                        value={formData.parentsOccupation}
                        onChange={(e) => setFormData({ ...formData, parentsOccupation: e.target.value })}
                        placeholder="e.g. Agriculture / Daily Wage / Self-employed"
                        className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    {/* 7. Family Monthly Income */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Monthly Family Income (LKR)
                      </label>
                      <input
                        type="number"
                        value={formData.familyIncome}
                        onChange={(e) => setFormData({ ...formData, familyIncome: Number(e.target.value) })}
                        className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800 text-slate-400 text-xs">
                  <span>Enrolling as a standard trainee (Self-sponsored or General Enrollment).</span>
                </div>
              )}
            </div>

            {/* SECTION 5: Account Password */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
                <Lock className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="text-sm font-bold text-white">5. Account Security & Password</h2>
                  <p className="text-[11px] text-slate-400">Set a password for your student portal login</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Create Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="At least 6 characters"
                      className="w-full rounded-xl bg-slate-950/70 border border-slate-800 pl-3.5 pr-10 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Confirm Password *</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Repeat your password"
                      className="w-full rounded-xl bg-slate-950/70 border border-slate-800 pl-3.5 pr-10 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Declaration & Submit Button */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-start gap-2.5 text-xs text-slate-400">
                <input type="checkbox" required defaultChecked className="mt-0.5 rounded border-slate-700" />
                <span>
                  I declare that the information provided above is true and accurate. I agree to abide by the rules of {orgProfile.orgName} and the Blossom Trust attendance regulations.
                </span>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="w-full justify-center py-3 text-sm font-bold shadow-lg shadow-blue-600/30"
                rightIcon={<Sparkles className="w-4 h-4" />}
              >
                {isSubmitting ? 'Registering Student...' : 'Complete Registration & Get Trainee ID'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
