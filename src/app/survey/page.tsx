'use client';

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Briefcase,
  Building,
  DollarSign,
  CheckCircle2,
  Sparkles,
  User,
  Phone,
  Mail,
  MapPin,
  FileCheck,
  Send,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  Search,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { OutcomeStatus } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export default function GraduateSurveyPage() {
  const { students, outcomes, saveStudentOutcome } = useStore();

  const [selectedUtNumber, setSelectedUtNumber] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionSummary, setSubmissionSummary] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    utNumber: '',
    studentName: '',
    nic: '',
    contactPhone: '',
    contactEmail: '',
    district: '',
    isBlossomTrust: false,
    
    // Core Survey Fields (From User Screenshot)
    currentStatus: 'Unemployed',
    workingCompanyName: 'N/A',
    salary: '0',
    courseCompletionStatus: 'Completed (9 Months)',
    courseSpecialization: 'Software Development (Full-Stack Web)',
    employmentStatus: 'Unemployed / Looking for Job',
    otherStatus: 'Seeking Placement Assistance',

    // Additional Career Details
    jobTitle: '',
    workLocation: 'Jaffna',
    linkedinUrl: '',
    remarks: '',
  });

  // Auto-detect ?ut=UT-2026-001 from URL parameter if shared as a personalized link
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const utParam = params.get('ut');
      if (utParam) {
        handleUtSelect(utParam);
      }
    }
  }, [students]);

  // When a UT number is selected from dropdown or typed, autofill student info
  const handleUtSelect = (ut: string) => {
    setSelectedUtNumber(ut);
    const foundStudent = students.find(
      (s) => s.utNumber.trim().toLowerCase() === ut.trim().toLowerCase()
    );

    if (foundStudent) {
      // Check if existing outcome exists
      const existingOutcome = outcomes.find((o) => o.studentId === foundStudent.id);

      setFormData((prev) => ({
        ...prev,
        utNumber: foundStudent.utNumber,
        studentName: foundStudent.fullName,
        nic: foundStudent.nic,
        contactPhone: foundStudent.phone.replace('+94 ', '0').replace(/ /g, ''),
        contactEmail: foundStudent.email,
        district: foundStudent.district,
        isBlossomTrust: foundStudent.isBlossomTrust,
        currentStatus: existingOutcome?.currentStatus || (existingOutcome?.outcomeStatus === 'Employed' ? 'Employed' : 'Unemployed'),
        workingCompanyName: existingOutcome?.workingCompanyName || existingOutcome?.companyOrInstitution || 'N/A',
        salary: existingOutcome?.salary !== undefined ? String(existingOutcome.salary) : '0',
        courseCompletionStatus: existingOutcome?.courseCompletionStatus || 'Completed (9 Months)',
        courseSpecialization: existingOutcome?.courseSpecialization || 'Software Development (Full-Stack Web)',
        employmentStatus: existingOutcome?.employmentStatus || (existingOutcome?.outcomeStatus === 'Employed' ? 'Employed (Full-Time)' : 'Unemployed / Looking for Job'),
        otherStatus: existingOutcome?.otherStatus || 'None',
        jobTitle: existingOutcome?.jobTitle || '',
        workLocation: existingOutcome?.workLocation || foundStudent.district,
        linkedinUrl: existingOutcome?.linkedinUrl || '',
        remarks: existingOutcome?.remarks || '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        utNumber: ut,
      }));
    }
  };

  // Adjust default company / salary when currentStatus or employmentStatus changes
  const handleEmploymentStatusChange = (status: string) => {
    let newCurrentStatus = formData.currentStatus;
    let newCompany = formData.workingCompanyName;
    let newSalary = formData.salary;

    if (status.includes('Employed') || status.includes('Full-Time') || status.includes('Part-Time')) {
      newCurrentStatus = 'Employed';
      if (newCompany === 'N/A') newCompany = '';
      if (newSalary === '0') newSalary = '65000';
    } else if (status.includes('Internship')) {
      newCurrentStatus = 'Internship';
      if (newCompany === 'N/A') newCompany = '';
      if (newSalary === '0') newSalary = '45000';
    } else if (status.includes('Freelance') || status.includes('Self-Employed')) {
      newCurrentStatus = 'Self Employed';
      if (newCompany === 'N/A') newCompany = 'Self-Employed / Client Projects';
    } else if (status.includes('Higher Studies')) {
      newCurrentStatus = 'Higher Studies';
      newCompany = 'N/A';
      newSalary = '0';
    } else if (status.includes('Unemployed')) {
      newCurrentStatus = 'Unemployed';
      newCompany = 'N/A';
      newSalary = '0';
    }

    setFormData((prev) => ({
      ...prev,
      employmentStatus: status,
      currentStatus: newCurrentStatus,
      workingCompanyName: newCompany,
      salary: newSalary,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.utNumber.trim() || !formData.studentName.trim()) {
      alert('Please provide your UT Number and Student Name.');
      return;
    }

    const matchedStudent = students.find(
      (s) => s.utNumber.trim().toLowerCase() === formData.utNumber.trim().toLowerCase()
    );

    const studentId = matchedStudent ? matchedStudent.id : `STU-GEN-${Date.now()}`;
    const isBlossom = matchedStudent ? matchedStudent.isBlossomTrust : formData.isBlossomTrust;

    // Map to OutcomeStatus
    let outcomeStatusMapped: OutcomeStatus = 'Other';
    if (formData.currentStatus.toLowerCase().includes('employed') || formData.employmentStatus.toLowerCase().includes('employed')) {
      outcomeStatusMapped = 'Employed';
    } else if (formData.currentStatus.toLowerCase().includes('internship') || formData.employmentStatus.toLowerCase().includes('internship')) {
      outcomeStatusMapped = 'Internship';
    } else if (formData.currentStatus.toLowerCase().includes('self') || formData.employmentStatus.toLowerCase().includes('freelance')) {
      outcomeStatusMapped = 'Self Employed';
    } else if (formData.currentStatus.toLowerCase().includes('study') || formData.employmentStatus.toLowerCase().includes('higher studies')) {
      outcomeStatusMapped = 'Higher Studies';
    } else if (formData.currentStatus.toLowerCase().includes('unemployed') || formData.employmentStatus.toLowerCase().includes('unemployed')) {
      outcomeStatusMapped = 'Unemployed';
    } else if (formData.employmentStatus.toLowerCase().includes('foreign')) {
      outcomeStatusMapped = 'Foreign Employment';
    }

    const outcomePayload = {
      studentId: studentId,
      utNumber: formData.utNumber.trim().toUpperCase(),
      studentName: formData.studentName.trim(),
      isBlossomTrust: isBlossom,
      outcomeStatus: outcomeStatusMapped,
      outcomeDate: new Date().toISOString().slice(0, 10),
      companyOrInstitution: formData.workingCompanyName.trim() || 'N/A',
      workingCompanyName: formData.workingCompanyName.trim() || 'N/A',
      jobTitle: formData.jobTitle.trim() || (outcomeStatusMapped === 'Employed' ? 'Software Trainee' : 'N/A'),
      salary: Number(formData.salary) || 0,
      currentStatus: formData.currentStatus,
      courseCompletionStatus: formData.courseCompletionStatus,
      courseSpecialization: formData.courseSpecialization,
      employmentStatus: formData.employmentStatus,
      otherStatus: formData.otherStatus,
      workLocation: formData.workLocation,
      linkedinUrl: formData.linkedinUrl,
      contactPhone: formData.contactPhone,
      contactEmail: formData.contactEmail,
      remarks: formData.remarks || `Submitted via Graduate Outcome Survey on ${new Date().toLocaleDateString()}`,
    };

    saveStudentOutcome(outcomePayload);
    setSubmissionSummary(outcomePayload);
    setIsSubmitted(true);
  };

  const matchedStudent = students.find(
    (s) => s.utNumber.trim().toLowerCase() === formData.utNumber.trim().toLowerCase()
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn py-2 sm:py-6">
      {/* Top Banner / Hero Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-2 border-indigo-500/40 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="blue" dot>
                TIC360 Official Survey
              </Badge>
              <Badge variant="purple">9-Month Vocational Training</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-blue-400" />
              9-Month Course Completion & Career Placement Survey
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Dear Graduate / Trainee, please share your current employment position, working company, salary, and career progression. Your response automatically updates your student record across the Unicom TIC & Blossom Trust database.
            </p>
          </div>

          <div className="hidden sm:flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900/80 border border-slate-700/80 text-center min-w-[140px]">
            <Sparkles className="w-6 h-6 text-amber-400 mb-1 animate-pulse" />
            <span className="text-[10px] uppercase font-bold text-slate-400">Response Sync</span>
            <span className="text-xs font-extrabold text-emerald-400">Instant Auto-Link</span>
          </div>
        </div>
      </div>

      {isSubmitted ? (
        /* SUCCESS CONFIRMATION SCREEN */
        <Card className="border-2 border-emerald-500/60 bg-slate-950/95 shadow-2xl p-6 sm:p-10 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-900/30">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Thank You, {submissionSummary?.studentName}!
            </h2>
            <p className="text-sm text-emerald-400 font-semibold">
              Your career outcome and course completion data has been submitted and auto-linked to your student profile!
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Student ID: <span className="font-mono font-bold text-white">{submissionSummary?.utNumber}</span> • Category:{' '}
              <span className="font-bold text-indigo-400">
                {submissionSummary?.isBlossomTrust ? '🌸 Blossom Trust Scholar' : '🎓 Non-Blossom Trainee'}
              </span>
            </p>
          </div>

          {/* Submission Summary Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Status</span>
              <span className="font-bold text-white text-sm">{submissionSummary?.currentStatus}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Working Company</span>
              <span className="font-bold text-white text-sm">{submissionSummary?.workingCompanyName}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Salary (LKR)</span>
              <span className="font-bold text-emerald-400 text-sm font-mono">
                LKR {Number(submissionSummary?.salary || 0).toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 sm:col-span-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Specialization</span>
              <span className="font-semibold text-slate-200">{submissionSummary?.courseSpecialization}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Completion Status</span>
              <span className="font-semibold text-slate-200">{submissionSummary?.courseCompletionStatus}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsSubmitted(false);
              }}
            >
              Edit or Submit Another Response
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                window.location.href = '/students';
              }}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Go to Students Directory
            </Button>
          </div>
        </Card>
      ) : (
        /* SURVEY FORM */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: STUDENT IDENTIFICATION & UT NUMBER */}
          <Card className="border-2 border-indigo-500/40 bg-slate-950/90 shadow-xl">
            <CardHeader className="border-b border-slate-800 pb-4">
              <CardTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                Step 1: Student Identification (UT Number)
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Select or type your registered UT Number to automatically verify your student record.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Select Your UT Number *
                  </label>
                  <Select
                    value={selectedUtNumber}
                    onChange={(e) => handleUtSelect(e.target.value)}
                    options={[
                      { value: '', label: '-- Choose Your UT Number --' },
                      ...students.map((s) => ({
                        value: s.utNumber,
                        label: `${s.utNumber} - ${s.fullName} (${s.district})`,
                      })),
                    ]}
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    💡 If your UT Number is not in the list, type it manually below.
                  </p>
                </div>

                <div>
                  <Input
                    label="Or Type UT Number Manually *"
                    required
                    placeholder="e.g. UT-2026-001"
                    value={formData.utNumber}
                    onChange={(e) => handleUtSelect(e.target.value)}
                  />
                </div>
              </div>

              {/* LIVE STUDENT VERIFICATION CARD */}
              {matchedStudent && (
                <div className="p-4 rounded-2xl bg-indigo-950/30 border-2 border-indigo-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300 font-extrabold text-lg">
                      {matchedStudent.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-sm sm:text-base">
                          {matchedStudent.fullName}
                        </span>
                        <Badge variant={matchedStudent.isBlossomTrust ? 'emerald' : 'blue'}>
                          {matchedStudent.isBlossomTrust ? '🌸 Blossom Scholar' : '🎓 Non-Blossom'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        NIC: {matchedStudent.nic} • District: {matchedStudent.district} • {matchedStudent.courseName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/40">
                    <ShieldCheck className="w-4 h-4" />
                    Verified Student
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <Input
                  label="Student Full Name *"
                  required
                  placeholder="e.g. Karthik Sivakumar"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                />
                <Input
                  label="Contact Phone / WhatsApp *"
                  required
                  placeholder="e.g. 0771234567"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
                <Input
                  label="Email Address *"
                  type="email"
                  required
                  placeholder="e.g. student@gmail.com"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* STEP 2: POST-COURSE POSITION & EMPLOYMENT STATUS (AS IN SCREENSHOT) */}
          <Card className="border-2 border-blue-500/40 bg-slate-950/90 shadow-xl">
            <CardHeader className="border-b border-slate-800 pb-4">
              <CardTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-400" />
                Step 2: 9-Month Course Completion & Career Placement Details
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Provide exact career position, company, salary, specialization, and completion status.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              {/* CURRENT STATUS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    CURRENT STATUS *
                  </label>
                  <Select
                    value={formData.currentStatus}
                    onChange={(e) => {
                      setFormData({ ...formData, currentStatus: e.target.value });
                      if (e.target.value === 'Unemployed') {
                        setFormData((prev) => ({ ...prev, currentStatus: 'Unemployed', workingCompanyName: 'N/A', salary: '0' }));
                      }
                    }}
                    options={[
                      { value: 'Unemployed', label: 'Unemployed' },
                      { value: 'Employed', label: 'Employed' },
                      { value: 'Internship', label: 'Internship' },
                      { value: 'Self Employed', label: 'Self Employed / Freelancer' },
                      { value: 'Higher Studies', label: 'Higher Studies' },
                      { value: 'Foreign Employment', label: 'Foreign Employment' },
                      { value: 'Other', label: 'Other' },
                    ]}
                  />
                </div>

                {/* WORKING COMPANY NAME */}
                <div>
                  <Input
                    label="WORKING COMPANY NAME *"
                    required
                    placeholder="e.g. WSO2, Virtusa, IFS, CodeGen, N/A"
                    value={formData.workingCompanyName}
                    onChange={(e) => setFormData({ ...formData, workingCompanyName: e.target.value })}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Enter company/organization name or type &quot;N/A&quot; if not employed.
                  </p>
                </div>
              </div>

              {/* SALARY (LKR) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="SALARY (LKR) *"
                    type="number"
                    required
                    placeholder="e.g. 85000 (Enter 0 if unemployed)"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Monthly gross salary / stipend in Sri Lankan Rupees (LKR).
                  </p>
                </div>

                {/* COURSE COMPLETION STATUS */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    COURSE COMPLETION STATUS *
                  </label>
                  <Select
                    value={formData.courseCompletionStatus}
                    onChange={(e) => setFormData({ ...formData, courseCompletionStatus: e.target.value })}
                    options={[
                      { value: 'Select Course Completion Status', label: 'Select Course Completion Status' },
                      { value: 'Completed (9 Months)', label: 'Completed (9 Months)' },
                      { value: 'Course Completed - Project Pending', label: 'Course Completed - Project Pending' },
                      { value: 'Graduated with Distinction', label: 'Graduated with Distinction' },
                      { value: 'Graduated with Merit', label: 'Graduated with Merit' },
                      { value: 'Completed - Certificate Issued', label: 'Completed - Certificate Issued' },
                      { value: 'Incomplete / Dropped Out', label: 'Incomplete / Dropped Out' },
                    ]}
                  />
                </div>
              </div>

              {/* COURSE SPECIALIZATION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    COURSE SPECIALIZATION *
                  </label>
                  <Select
                    value={formData.courseSpecialization}
                    onChange={(e) => setFormData({ ...formData, courseSpecialization: e.target.value })}
                    options={[
                      { value: 'Select Specialization', label: 'Select Specialization' },
                      { value: 'Software Development (Full-Stack Web)', label: 'Software Development (Full-Stack Web)' },
                      { value: 'Frontend React / Next.js Development', label: 'Frontend React / Next.js Development' },
                      { value: 'Backend Node.js & Database Systems', label: 'Backend Node.js & Database Systems' },
                      { value: 'Mobile Application Development (React Native / Flutter)', label: 'Mobile Application Development (React Native / Flutter)' },
                      { value: 'UI/UX & Frontend Engineering', label: 'UI/UX & Frontend Engineering' },
                      { value: 'Cloud Computing & DevOps', label: 'Cloud Computing & DevOps' },
                      { value: 'IT & Network Infrastructure', label: 'IT & Network Infrastructure' },
                    ]}
                  />
                </div>

                {/* EMPLOYMENT STATUS */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    EMPLOYMENT STATUS *
                  </label>
                  <Select
                    value={formData.employmentStatus}
                    onChange={(e) => handleEmploymentStatusChange(e.target.value)}
                    options={[
                      { value: 'Select Employment Status', label: 'Select Employment Status' },
                      { value: 'Employed (Full-Time)', label: 'Employed (Full-Time)' },
                      { value: 'Employed (Part-Time)', label: 'Employed (Part-Time)' },
                      { value: 'Internship / Trainee', label: 'Internship / Trainee' },
                      { value: 'Freelance / Remote Contractor', label: 'Freelance / Remote Contractor' },
                      { value: 'Self-Employed / Entrepreneur', label: 'Self-Employed / Entrepreneur' },
                      { value: 'Unemployed / Looking for Job', label: 'Unemployed / Looking for Job' },
                      { value: 'Higher Studies / University', label: 'Higher Studies / University' },
                      { value: 'Foreign Employment', label: 'Foreign Employment' },
                    ]}
                  />
                </div>
              </div>

              {/* OTHER STATUS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    OTHER STATUS
                  </label>
                  <Select
                    value={formData.otherStatus}
                    onChange={(e) => setFormData({ ...formData, otherStatus: e.target.value })}
                    options={[
                      { value: 'Select Other Status', label: 'Select Other Status' },
                      { value: 'Seeking Placement Assistance', label: 'Seeking Placement Assistance' },
                      { value: 'Preparing for Tech Interviews', label: 'Preparing for Tech Interviews' },
                      { value: 'Higher Studies in Progress', label: 'Higher Studies in Progress' },
                      { value: 'Relocating / Foreign Studies', label: 'Relocating / Foreign Studies' },
                      { value: 'Not Seeking Employment', label: 'Not Seeking Employment' },
                      { value: 'None', label: 'None' },
                    ]}
                  />
                </div>

                <div>
                  <Input
                    label="Job Designation / Role Title"
                    placeholder="e.g. Junior Software Engineer, Associate QA"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  />
                </div>
              </div>

              {/* Additional optional fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <Input
                  label="Work Location / City"
                  placeholder="e.g. Colombo, Jaffna, Remote (WFH)"
                  value={formData.workLocation}
                  onChange={(e) => setFormData({ ...formData, workLocation: e.target.value })}
                />
                <Input
                  label="LinkedIn Profile or Portfolio Link"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={formData.linkedinUrl}
                  onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Remarks / Placement Feedback (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Any additional information regarding your placement, starting date, or career milestone..."
                  className="w-full rounded-xl bg-slate-900/80 border border-slate-800 p-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* SUBMIT BUTTON */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs text-slate-400">
              🔒 By clicking Submit, your outcome data will be securely synced with Unicom TIC records.
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full sm:w-auto px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-extrabold shadow-lg shadow-blue-900/30"
              rightIcon={<Send className="w-4 h-4" />}
            >
              Submit Career Outcome Data
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
