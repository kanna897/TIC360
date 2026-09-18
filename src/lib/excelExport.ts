import * as XLSX from 'xlsx';
import { AbsenceRequest, CareerSurveyResponse } from './types';

export const exportAbsenteesToExcel = (data: AbsenceRequest[], filename = 'Absentees_Report.xlsx') => {
  const formattedData = data.map((req) => ({
    'Submission ID': req.id,
    'UT Number': req.utNumber,
    'Student Name': req.fullName,
    'From Date': req.fromDate,
    'To Date': req.toDate,
    'Reason': req.reason,
    'Status': req.status,
    'Submitted At': new Date(req.createdAt).toLocaleString(),
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Absentees');

  // Adjust column widths
  const wscols = [
    { wch: 25 }, // Submission ID
    { wch: 15 }, // UT Number
    { wch: 25 }, // Student Name
    { wch: 12 }, // From Date
    { wch: 12 }, // To Date
    { wch: 40 }, // Reason
    { wch: 15 }, // Status
    { wch: 22 }, // Submitted At
  ];
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, filename);
};

export const exportCareerSurveysToExcel = (data: CareerSurveyResponse[], filename = 'Career_Survey_Report.xlsx') => {
  const formattedData = data.map((res) => ({
    'Submission ID': res.id,
    'UT Number': res.utNumber,
    'Student Name': res.studentName,
    'Blossom Trust': res.isBlossomTrust ? 'Yes' : 'No',
    'Outcome Status': res.outcomeStatus,
    'Company / Institution': res.companyOrInstitution || 'N/A',
    'Working Company': res.workingCompanyName || 'N/A',
    'Job Title': res.jobTitle || 'N/A',
    'Salary (LKR)': res.salary || 0,
    'Current Status': res.currentStatus || 'N/A',
    'Course Completion Status': res.courseCompletionStatus || 'N/A',
    'Specialization': res.courseSpecialization || 'N/A',
    'Employment Status': res.employmentStatus || 'N/A',
    'Other Status': res.otherStatus || 'N/A',
    'Work Location': res.workLocation || 'N/A',
    'LinkedIn URL': res.linkedinUrl || 'N/A',
    'Contact Phone': res.contactPhone || 'N/A',
    'Contact Email': res.contactEmail || 'N/A',
    'Remarks': res.remarks || 'N/A',
    'Submitted At': new Date(res.createdAt).toLocaleString(),
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Career Surveys');

  XLSX.writeFile(workbook, filename);
};
