// CSV Exporter utility for exporting data

function arrayToCSV(data, headers) {
  if (!data || data.length === 0) {
    return '';
  }

  // If headers not provided, use keys from first object
  if (!headers) {
    headers = Object.keys(data[0]);
  }

  // Create header row
  const headerRow = headers.join(',');

  // Create data rows
  const dataRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];

      // Handle null/undefined
      if (value === null || value === undefined) {
        return '';
      }

      // Convert to string and escape if needed
      let stringValue = String(value);

      // Escape commas and quotes
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        stringValue = `"${stringValue.replace(/"/g, '""')}"`;
      }

      return stringValue;
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

function exportParticipants(participants) {
  const headers = ['firstName', 'lastName', 'email', 'enrollmentStatus', 'enrollmentDate', 'completionPercentage'];

  const data = participants.map(p => ({
    firstName: p.user?.firstName || '',
    lastName: p.user?.lastName || '',
    email: p.user?.email || '',
    enrollmentStatus: p.enrollmentStatus || '',
    enrollmentDate: p.enrollmentDate ? new Date(p.enrollmentDate).toISOString().split('T')[0] : '',
    completionPercentage: p.completionPercentage || 0
  }));

  return arrayToCSV(data, headers);
}

function exportAttendance(attendanceRecords) {
  const headers = ['firstName', 'lastName', 'email', 'sessionDate', 'sessionName', 'status', 'notes'];

  const data = attendanceRecords.map(a => ({
    firstName: a.user?.firstName || '',
    lastName: a.user?.lastName || '',
    email: a.user?.email || '',
    sessionDate: a.sessionDate ? new Date(a.sessionDate).toISOString().split('T')[0] : '',
    sessionName: a.sessionName || '',
    status: a.attendanceStatus || '',
    notes: a.notes || ''
  }));

  return arrayToCSV(data, headers);
}

function exportProgress(progressData) {
  const headers = ['firstName', 'lastName', 'email', 'courseName', 'modulesCompleted', 'totalModules', 'completionPercentage'];

  const data = progressData.map(p => ({
    firstName: p.firstName || '',
    lastName: p.lastName || '',
    email: p.email || '',
    courseName: p.courseName || '',
    modulesCompleted: p.modulesCompleted || 0,
    totalModules: p.totalModules || 0,
    completionPercentage: p.completionPercentage || 0
  }));

  return arrayToCSV(data, headers);
}

module.exports = {
  arrayToCSV,
  exportParticipants,
  exportAttendance,
  exportProgress
};
