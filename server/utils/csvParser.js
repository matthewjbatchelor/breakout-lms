// CSV Parser utility for importing data

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');

  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Parse header row
  const headers = lines[0].split(',').map(h => h.trim());

  // Parse data rows
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());

    if (values.length !== headers.length) {
      throw new Error(`Row ${i + 1} has ${values.length} columns, expected ${headers.length}`);
    }

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    data.push(row);
  }

  return { headers, data };
}

function validateParticipantsCSV(data) {
  const requiredFields = ['firstName', 'lastName', 'email'];
  const errors = [];

  data.forEach((row, index) => {
    requiredFields.forEach(field => {
      if (!row[field] || row[field] === '') {
        errors.push(`Row ${index + 2}: Missing ${field}`);
      }
    });

    // Validate email format
    if (row.email && !isValidEmail(row.email)) {
      errors.push(`Row ${index + 2}: Invalid email format`);
    }
  });

  return errors;
}

function validateAttendanceCSV(data) {
  const requiredFields = ['participantEmail', 'sessionDate', 'status'];
  const validStatuses = ['present', 'absent', 'late', 'excused'];
  const errors = [];

  data.forEach((row, index) => {
    requiredFields.forEach(field => {
      if (!row[field] || row[field] === '') {
        errors.push(`Row ${index + 2}: Missing ${field}`);
      }
    });

    // Validate status
    if (row.status && !validStatuses.includes(row.status.toLowerCase())) {
      errors.push(`Row ${index + 2}: Invalid status. Must be: ${validStatuses.join(', ')}`);
    }

    // Validate date format (YYYY-MM-DD)
    if (row.sessionDate && !isValidDate(row.sessionDate)) {
      errors.push(`Row ${index + 2}: Invalid date format. Use YYYY-MM-DD`);
    }
  });

  return errors;
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidDate(dateString) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

module.exports = {
  parseCSV,
  validateParticipantsCSV,
  validateAttendanceCSV
};
