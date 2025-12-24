/**
 * Attendance Management UI
 * Admin interface for tracking session attendance
 */

console.log('✅ Attendance.js loaded');

let attendanceTable = null;
let allAttendance = [];
let allCohorts = [];
let selectedCohortId = null;

/**
 * Initialize the attendance view
 */
async function initAttendanceView() {
  const mainContent = document.getElementById('mainContent');

  mainContent.innerHTML = `
    <div class="view-header">
      <div>
        <h1>Attendance Tracking</h1>
        <p>Record and manage participant attendance</p>
      </div>
      <div class="view-actions">
        <button onclick="showBulkMarkAttendance()" class="btn btn-primary">
          <span>✓ Bulk Mark Session</span>
        </button>
        <button onclick="showMarkAttendanceModal()" class="btn btn-secondary">
          <span>+ Mark Individual</span>
        </button>
        <button onclick="showImportAttendanceModal()" class="btn btn-secondary">
          <span>📥 Import CSV</span>
        </button>
        <button onclick="exportAttendance()" class="btn btn-secondary">
          <span>📤 Export CSV</span>
        </button>
      </div>
    </div>

    <div class="stats-grid" id="attendanceStats">
      <div class="stat-card">
        <div class="stat-value" id="totalRecords">-</div>
        <div class="stat-label">Total Records</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="presentCount">-</div>
        <div class="stat-label">Present</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="absentCount">-</div>
        <div class="stat-label">Absent</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="attendanceRate">-</div>
        <div class="stat-label">Attendance Rate</div>
      </div>
    </div>

    <div class="filter-container" style="margin-bottom: 1.5rem;">
      <label for="cohortFilter" style="margin-right: 0.5rem; font-weight: 500;">Filter by Cohort:</label>
      <select id="cohortFilter" class="form-select" style="max-width: 300px;" onchange="filterByCohort(this.value)">
        <option value="">All Cohorts</option>
      </select>
    </div>

    <div class="filter-tabs">
      <button class="filter-tab active" data-status="all" onclick="filterAttendance('all')">
        All <span class="count" id="countAll">0</span>
      </button>
      <button class="filter-tab" data-status="present" onclick="filterAttendance('present')">
        Present <span class="count" id="countPresent">0</span>
      </button>
      <button class="filter-tab" data-status="absent" onclick="filterAttendance('absent')">
        Absent <span class="count" id="countAbsent">0</span>
      </button>
      <button class="filter-tab" data-status="late" onclick="filterAttendance('late')">
        Late <span class="count" id="countLate">0</span>
      </button>
      <button class="filter-tab" data-status="excused" onclick="filterAttendance('excused')">
        Excused <span class="count" id="countExcused">0</span>
      </button>
    </div>

    <div class="table-container">
      <table id="attendanceTable">
        <thead>
          <tr>
            <th data-sortable="participantName">Participant</th>
            <th data-sortable="cohortName">Cohort</th>
            <th data-sortable="sessionDate">Session Date</th>
            <th data-sortable="sessionName">Session</th>
            <th data-sortable="status">Status</th>
            <th data-sortable="recordedAt">Recorded</th>
            <th class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
        </tbody>
      </table>
    </div>
  `;

  // Initialize table manager
  attendanceTable = new TableManager('attendanceTable', {
    sortable: true,
    filterable: true,
    searchPlaceholder: 'Search attendance records...',
    renderRow: renderAttendanceRow
  });

  // Load data
  await loadCohorts();
  await loadAttendance();
}

/**
 * Load all cohorts for dropdown
 */
async function loadCohorts() {
  try {
    allCohorts = await API.get('/api/cohorts');

    // Populate cohort filter dropdown
    const cohortFilter = document.getElementById('cohortFilter');
    if (cohortFilter) {
      allCohorts.forEach(cohort => {
        const option = document.createElement('option');
        option.value = cohort.id;
        option.textContent = `${cohort.name} - ${cohort.programmeName || 'No programme'}`;
        cohortFilter.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading cohorts:', error);
  }
}

/**
 * Load all attendance records
 */
async function loadAttendance() {
  try {
    const attendance = await API.get('/api/attendance');
    allAttendance = attendance;

    // Update stats
    updateStats(attendance);

    // Set table data
    attendanceTable.setData(attendance);
  } catch (error) {
    console.error('Error loading attendance:', error);
    showNotification('Failed to load attendance records', 'error');
  }
}

/**
 * Update statistics
 */
function updateStats(records) {
  const stats = {
    total: records.length,
    present: records.filter(r => r.status === 'present').length,
    absent: records.filter(r => r.status === 'absent').length,
    late: records.filter(r => r.status === 'late').length,
    excused: records.filter(r => r.status === 'excused').length
  };

  const attendanceRate = stats.total > 0
    ? Math.round(((stats.present + stats.late) / stats.total) * 100)
    : 0;

  document.getElementById('totalRecords').textContent = stats.total;
  document.getElementById('presentCount').textContent = stats.present;
  document.getElementById('absentCount').textContent = stats.absent;
  document.getElementById('attendanceRate').textContent = attendanceRate + '%';

  document.getElementById('countAll').textContent = stats.total;
  document.getElementById('countPresent').textContent = stats.present;
  document.getElementById('countAbsent').textContent = stats.absent;
  document.getElementById('countLate').textContent = stats.late;
  document.getElementById('countExcused').textContent = stats.excused;
}

/**
 * Filter by cohort
 */
function filterByCohort(cohortId) {
  selectedCohortId = cohortId ? parseInt(cohortId) : null;

  let filteredData = allAttendance;
  if (selectedCohortId) {
    filteredData = allAttendance.filter(a => a.cohortId === selectedCohortId);
  }

  updateStats(filteredData);
  attendanceTable.setData(filteredData);
}

/**
 * Filter attendance by status
 */
function filterAttendance(status) {
  // Update active tab
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.dataset.status === status) {
      tab.classList.add('active');
    }
  });

  // Start with cohort filter if applied
  let filteredData = selectedCohortId
    ? allAttendance.filter(a => a.cohortId === selectedCohortId)
    : allAttendance;

  // Apply status filter
  if (status !== 'all') {
    filteredData = filteredData.filter(a => a.status === status);
  }

  attendanceTable.setData(filteredData);
}

/**
 * Render an attendance row
 */
function renderAttendanceRow(record) {
  const tr = document.createElement('tr');

  tr.innerHTML = `
    <td>
      <div style="font-weight: 500;">${record.participantName || '-'}</div>
    </td>
    <td>${record.cohortName || '-'}</td>
    <td>${formatDate(record.sessionDate)}</td>
    <td>${record.sessionName || '-'}</td>
    <td><span class="status-badge ${record.status}">${record.status}</span></td>
    <td>${formatDateTime(record.recordedAt)}</td>
    <td class="col-actions">
      <div class="table-actions">
        <button class="btn btn-sm btn-primary" onclick="showEditAttendanceModal(${record.id})">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteAttendance(${record.id})">Delete</button>
      </div>
    </td>
  `;

  return tr;
}

/**
 * Show mark attendance modal
 */
async function showMarkAttendanceModal() {
  // Load participants for selected cohort
  let participants = [];
  if (selectedCohortId) {
    try {
      const enrollments = await API.get(`/api/cohorts/${selectedCohortId}/participants`);
      participants = enrollments;
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  }

  const modal = new Modal();

  modal.show({
    title: 'Mark Attendance',
    size: 'medium',
    content: getAttendanceFormHTML(null, participants),
    submitText: 'Record Attendance',
    onSubmit: async (modalInstance) => {
      const formData = modalInstance.getFormData();

      // Validation
      if (!formData.userId || !formData.cohortId || !formData.sessionDate || !formData.status) {
        modalInstance.showError('Please fill in all required fields');
        return false;
      }

      // Convert IDs to integers
      formData.userId = parseInt(formData.userId);
      formData.cohortId = parseInt(formData.cohortId);

      modalInstance.setLoading(true);

      try {
        await API.post('/api/attendance', formData);
        showNotification('Attendance recorded successfully', 'success');
        await loadAttendance();
        return true;
      } catch (error) {
        modalInstance.setLoading(false);
        modalInstance.showError(error.message || 'Failed to record attendance');
        return false;
      }
    }
  });
}

/**
 * Show edit attendance modal
 */
async function showEditAttendanceModal(attendanceId) {
  try {
    const record = await API.get(`/api/attendance/${attendanceId}`);
    const modal = new Modal();

    modal.show({
      title: 'Edit Attendance',
      size: 'medium',
      content: getAttendanceFormHTML(record),
      submitText: 'Update',
      onSubmit: async (modalInstance) => {
        const formData = modalInstance.getFormData();

        modalInstance.setLoading(true);

        try {
          await API.put(`/api/attendance/${attendanceId}`, formData);
          showNotification('Attendance updated successfully', 'success');
          await loadAttendance();
          return true;
        } catch (error) {
          modalInstance.setLoading(false);
          modalInstance.showError(error.message || 'Failed to update attendance');
          return false;
        }
      }
    });
  } catch (error) {
    showNotification('Failed to load attendance record', 'error');
  }
}

/**
 * Get attendance form HTML
 */
function getAttendanceFormHTML(record = null, participants = []) {
  const isEdit = record !== null;
  const today = new Date().toISOString().split('T')[0];

  return `
    <form>
      ${!isEdit ? `
        <div class="form-group required">
          <label for="cohortId">Cohort</label>
          <select id="cohortId" name="cohortId" class="form-select" required onchange="loadCohortParticipants(this.value)">
            <option value="">Select cohort...</option>
            ${allCohorts.map(c => `
              <option value="${c.id}" ${selectedCohortId === c.id ? 'selected' : ''}>
                ${c.name} - ${c.programmeName || 'No programme'}
              </option>
            `).join('')}
          </select>
        </div>

        <div class="form-group required">
          <label for="userId">Participant</label>
          <select id="userId" name="userId" class="form-select" required>
            <option value="">Select participant...</option>
            ${participants.map(p => `
              <option value="${p.userId || p.id}">
                ${p.firstName} ${p.lastName}
              </option>
            `).join('')}
          </select>
        </div>
      ` : `
        <p><strong>Participant:</strong> ${record.participantName}</p>
        <p><strong>Cohort:</strong> ${record.cohortName}</p>
      `}

      <div class="form-row">
        <div class="form-group required">
          <label for="sessionDate">Session Date</label>
          <input
            type="date"
            id="sessionDate"
            name="sessionDate"
            class="form-input"
            value="${isEdit && record.sessionDate ? record.sessionDate.split('T')[0] : today}"
            required
            ${isEdit ? 'readonly' : ''}
          >
        </div>

        <div class="form-group required">
          <label for="status">Status</label>
          <select id="status" name="status" class="form-select" required>
            <option value="present" ${isEdit && record.status === 'present' ? 'selected' : ''}>Present</option>
            <option value="absent" ${isEdit && record.status === 'absent' ? 'selected' : ''}>Absent</option>
            <option value="late" ${isEdit && record.status === 'late' ? 'selected' : ''}>Late</option>
            <option value="excused" ${isEdit && record.status === 'excused' ? 'selected' : ''}>Excused</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label for="sessionName">Session Name</label>
        <input
          type="text"
          id="sessionName"
          name="sessionName"
          class="form-input"
          value="${isEdit && record.sessionName ? record.sessionName : ''}"
          placeholder="e.g., Week 1: Introduction"
        >
      </div>

      <div class="form-group">
        <label for="notes">Notes</label>
        <textarea
          id="notes"
          name="notes"
          class="form-textarea"
          rows="3"
        >${isEdit && record.notes ? record.notes : ''}</textarea>
      </div>
    </form>
  `;
}

/**
 * Show import attendance modal
 */
function showImportAttendanceModal() {
  const modal = new Modal();

  modal.show({
    title: 'Import Attendance from CSV',
    size: 'medium',
    content: `
      <p>Upload a CSV file with the following columns:</p>
      <ul style="margin: 1rem 0; padding-left: 1.5rem;">
        <li><strong>cohortId:</strong> Cohort ID</li>
        <li><strong>participantEmail:</strong> Participant email</li>
        <li><strong>sessionDate:</strong> Session date (YYYY-MM-DD)</li>
        <li><strong>sessionName:</strong> Session name</li>
        <li><strong>status:</strong> Status (present, absent, late, excused)</li>
        <li><strong>notes:</strong> Optional notes</li>
      </ul>
      <form>
        <div class="form-group file-upload">
          <label for="csvFile">CSV File</label>
          <input type="file" id="csvFile" name="csvFile" accept=".csv" required>
        </div>
      </form>
    `,
    submitText: 'Import',
    onSubmit: async (modalInstance) => {
      const fileInput = document.getElementById('csvFile');
      const file = fileInput.files[0];

      if (!file) {
        modalInstance.showError('Please select a CSV file');
        return false;
      }

      modalInstance.setLoading(true);

      try {
        const formData = new FormData();
        formData.append('csv', file);

        const result = await API.upload('/api/attendance/import', formData);
        showNotification(`Imported ${result.imported} attendance records successfully`, 'success');
        await loadAttendance();
        return true;
      } catch (error) {
        modalInstance.setLoading(false);
        modalInstance.showError(error.message || 'Failed to import attendance');
        return false;
      }
    }
  });
}

/**
 * Export attendance to CSV
 */
async function exportAttendance() {
  try {
    const endpoint = selectedCohortId
      ? `/api/attendance/cohort/${selectedCohortId}/export`
      : '/api/attendance/export';

    await API.download(endpoint, `attendance-${new Date().toISOString().split('T')[0]}.csv`);
    showNotification('Attendance exported successfully', 'success');
  } catch (error) {
    showNotification('Failed to export attendance', 'error');
  }
}

/**
 * Delete an attendance record
 */
async function deleteAttendance(attendanceId) {
  const confirmed = await confirmDialog(
    'Are you sure you want to delete this attendance record?',
    'Delete Attendance'
  );

  if (!confirmed) return;

  try {
    await API.delete(`/api/attendance/${attendanceId}`);
    showNotification('Attendance deleted successfully', 'success');
    await loadAttendance();
  } catch (error) {
    showNotification(error.message || 'Failed to delete attendance', 'error');
  }
}

/**
 * Show bulk mark attendance modal
 */
async function showBulkMarkAttendance() {
  if (!selectedCohortId) {
    showNotification('Please select a cohort first', 'warning');
    return;
  }

  try {
    const participants = await API.get(`/api/cohorts/${selectedCohortId}/participants`);

    if (participants.length === 0) {
      showNotification('No participants enrolled in this cohort', 'warning');
      return;
    }

    const modal = new Modal();

    modal.show({
      title: 'Bulk Mark Attendance',
      size: 'large',
      content: `
        <form>
          <div class="form-group required">
            <label for="bulkSessionDate">Session Date</label>
            <input type="date" id="bulkSessionDate" name="sessionDate" class="form-input"
                   value="${new Date().toISOString().split('T')[0]}" required>
          </div>

          <div class="form-group required">
            <label for="bulkSessionName">Session Name</label>
            <input type="text" id="bulkSessionName" name="sessionName" class="form-input" required
                   placeholder="e.g., Week 1: Introduction">
          </div>

          <div class="form-group">
            <label>Quick Actions</label>
            <div class="status-presets">
              <button type="button" class="btn btn-preset" onclick="bulkSetAllStatus('present')">
                ✓ Mark All Present
              </button>
              <button type="button" class="btn btn-preset" onclick="bulkSetAllStatus('absent')">
                ✗ Mark All Absent
              </button>
            </div>
          </div>

          <div class="bulk-participants-list">
            <h4>Participants</h4>
            <table style="width: 100%;">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${participants.map(p => `
                  <tr>
                    <td>${p.firstName} ${p.lastName}</td>
                    <td>
                      <select class="attendance-select form-select" data-participant-id="${p.userId || p.id}">
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                        <option value="excused">Excused</option>
                      </select>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </form>
      `,
      submitText: 'Save Attendance',
      onSubmit: async (modalInstance) => {
        const sessionDate = document.getElementById('bulkSessionDate').value;
        const sessionName = document.getElementById('bulkSessionName').value;

        if (!sessionDate || !sessionName) {
          modalInstance.showError('Please fill in session date and name');
          return false;
        }

        const selects = document.querySelectorAll('.attendance-select');
        const attendanceData = Array.from(selects).map(select => ({
          userId: parseInt(select.dataset.participantId),
          status: select.value
        }));

        modalInstance.setLoading(true);

        try {
          const result = await API.post('/api/attendance/bulk', {
            cohortId: selectedCohortId,
            sessionDate: sessionDate,
            sessionName: sessionName,
            attendanceData: attendanceData
          });

          showNotification(`Attendance marked for ${result.recorded} participants`, 'success');
          await loadAttendance();
          return true;
        } catch (error) {
          modalInstance.setLoading(false);
          modalInstance.showError(error.message || 'Failed to mark attendance');
          return false;
        }
      }
    });
  } catch (error) {
    console.error('Failed to load participants:', error);
    showNotification('Failed to load participants', 'error');
  }
}

/**
 * Bulk set all participants to a status
 */
function bulkSetAllStatus(status) {
  const selects = document.querySelectorAll('.attendance-select');
  selects.forEach(select => {
    select.value = status;
  });
}

// Make functions globally available
window.initAttendanceView = initAttendanceView;
window.showMarkAttendanceModal = showMarkAttendanceModal;
window.showEditAttendanceModal = showEditAttendanceModal;
window.showImportAttendanceModal = showImportAttendanceModal;
window.exportAttendance = exportAttendance;
window.deleteAttendance = deleteAttendance;
window.filterAttendance = filterAttendance;
window.filterByCohort = filterByCohort;
window.showBulkMarkAttendance = showBulkMarkAttendance;
window.bulkSetAllStatus = bulkSetAllStatus;

console.log('✅ Attendance functions exported:', typeof window.initAttendanceView);
