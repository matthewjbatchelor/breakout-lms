/**
 * Enrollment Management UI
 * Admin interface for managing participant enrollments
 */

let enrollmentsTable = null;
let allEnrollments = [];
let allCohorts = [];
let allParticipants = [];

/**
 * Initialize the enrollments view
 */
async function initEnrollmentsView() {
  const mainContent = document.getElementById('mainContent');

  mainContent.innerHTML = `
    <div class="view-header">
      <div>
        <h1>Enrollments</h1>
        <p>Manage participant enrollments to cohorts</p>
      </div>
      <div class="view-actions">
        <button onclick="showEnrollParticipantModal()" class="btn btn-primary">
          <span>+ Enroll Participant</span>
        </button>
        <button onclick="showImportEnrollmentsModal()" class="btn btn-secondary">
          <span>📥 Import CSV</span>
        </button>
        <button onclick="exportEnrollments()" class="btn btn-secondary">
          <span>📤 Export CSV</span>
        </button>
      </div>
    </div>

    <div class="stats-grid" id="enrollmentsStats">
      <div class="stat-card">
        <div class="stat-value" id="totalEnrollments">-</div>
        <div class="stat-label">Total Enrollments</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="activeEnrollments">-</div>
        <div class="stat-label">Active</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="completedEnrollments">-</div>
        <div class="stat-label">Completed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="avgCompletion">-</div>
        <div class="stat-label">Avg Completion</div>
      </div>
    </div>

    <div class="filter-tabs">
      <button class="filter-tab active" data-status="all" onclick="filterEnrollments('all')">
        All <span class="count" id="countAll">0</span>
      </button>
      <button class="filter-tab" data-status="active" onclick="filterEnrollments('active')">
        Active <span class="count" id="countActive">0</span>
      </button>
      <button class="filter-tab" data-status="completed" onclick="filterEnrollments('completed')">
        Completed <span class="count" id="countCompleted">0</span>
      </button>
      <button class="filter-tab" data-status="withdrawn" onclick="filterEnrollments('withdrawn')">
        Withdrawn <span class="count" id="countWithdrawn">0</span>
      </button>
    </div>

    <div class="table-container">
      <table id="enrollmentsTable">
        <thead>
          <tr>
            <th data-sortable="participantName">Participant</th>
            <th data-sortable="cohortName">Cohort</th>
            <th data-sortable="programmeName">Programme</th>
            <th data-sortable="enrollmentStatus">Status</th>
            <th data-sortable="completionPercentage">Progress</th>
            <th data-sortable="enrolledAt">Enrolled Date</th>
            <th class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
        </tbody>
      </table>
    </div>
  `;

  // Initialize table manager
  enrollmentsTable = new TableManager('enrollmentsTable', {
    sortable: true,
    filterable: true,
    searchPlaceholder: 'Search enrollments...',
    renderRow: renderEnrollmentRow
  });

  // Load data
  await loadCohorts();
  await loadParticipants();
  await loadEnrollments();
}

/**
 * Load all cohorts for dropdown
 */
async function loadCohorts() {
  try {
    allCohorts = await API.get('/api/cohorts');
  } catch (error) {
    console.error('Error loading cohorts:', error);
  }
}

/**
 * Load all participants
 */
async function loadParticipants() {
  try {
    const users = await API.get('/api/users/role/participant');
    allParticipants = users;
  } catch (error) {
    console.error('Error loading participants:', error);
  }
}

/**
 * Load all enrollments
 */
async function loadEnrollments() {
  try {
    const enrollments = await API.get('/api/enrollments');
    allEnrollments = enrollments;

    // Update stats
    const stats = calculateEnrollmentStats(enrollments);
    document.getElementById('totalEnrollments').textContent = stats.total;
    document.getElementById('activeEnrollments').textContent = stats.active;
    document.getElementById('completedEnrollments').textContent = stats.completed;
    document.getElementById('avgCompletion').textContent = stats.avgCompletion + '%';

    // Update filter counts
    document.getElementById('countAll').textContent = stats.total;
    document.getElementById('countActive').textContent = stats.active;
    document.getElementById('countCompleted').textContent = stats.completed;
    document.getElementById('countWithdrawn').textContent = stats.withdrawn;

    // Set table data
    enrollmentsTable.setData(enrollments);
  } catch (error) {
    console.error('Error loading enrollments:', error);
    showNotification('Failed to load enrollments', 'error');
  }
}

/**
 * Calculate enrollment statistics
 */
function calculateEnrollmentStats(enrollments) {
  const avgCompletion = enrollments.length > 0
    ? Math.round(enrollments.reduce((sum, e) => sum + (e.completionPercentage || 0), 0) / enrollments.length)
    : 0;

  return {
    total: enrollments.length,
    active: enrollments.filter(e => e.enrollmentStatus === 'active').length,
    completed: enrollments.filter(e => e.enrollmentStatus === 'completed').length,
    withdrawn: enrollments.filter(e => e.enrollmentStatus === 'withdrawn').length,
    avgCompletion
  };
}

/**
 * Filter enrollments by status
 */
function filterEnrollments(status) {
  // Update active tab
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.dataset.status === status) {
      tab.classList.add('active');
    }
  });

  // Filter data
  let filteredData = allEnrollments;
  if (status !== 'all') {
    filteredData = allEnrollments.filter(e => e.enrollmentStatus === status);
  }

  enrollmentsTable.setData(filteredData);
}

/**
 * Render an enrollment row
 */
function renderEnrollmentRow(enrollment) {
  const tr = document.createElement('tr');

  tr.innerHTML = `
    <td>
      <div style="font-weight: 500;">${enrollment.participantName || '-'}</div>
      <div style="font-size: 0.75rem; color: #666;">${enrollment.participantEmail || ''}</div>
    </td>
    <td>${enrollment.cohortName || '-'}</td>
    <td>${enrollment.programmeName || '-'}</td>
    <td><span class="status-badge ${enrollment.enrollmentStatus}">${enrollment.enrollmentStatus}</span></td>
    <td>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${enrollment.completionPercentage || 0}%"></div>
        <span class="progress-text">${enrollment.completionPercentage || 0}%</span>
      </div>
    </td>
    <td>${formatDate(enrollment.enrolledAt)}</td>
    <td class="col-actions">
      <div class="table-actions">
        <button class="btn btn-sm btn-primary" onclick="showEditEnrollmentModal(${enrollment.id})">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteEnrollment(${enrollment.id})">Remove</button>
      </div>
    </td>
  `;

  return tr;
}

/**
 * Show enroll participant modal
 */
function showEnrollParticipantModal() {
  const modal = new Modal();

  modal.show({
    title: 'Enroll Participant',
    size: 'medium',
    content: getEnrollmentFormHTML(),
    submitText: 'Enroll',
    onSubmit: async (modalInstance) => {
      const formData = modalInstance.getFormData();

      // Validation
      if (!formData.userId || !formData.cohortId) {
        modalInstance.showError('Please select both participant and cohort');
        return false;
      }

      // Convert IDs to integers
      formData.userId = parseInt(formData.userId);
      formData.cohortId = parseInt(formData.cohortId);

      modalInstance.setLoading(true);

      try {
        await API.post('/api/enrollments', formData);
        showNotification('Participant enrolled successfully', 'success');
        await loadEnrollments();
        return true;
      } catch (error) {
        modalInstance.setLoading(false);
        modalInstance.showError(error.message || 'Failed to enroll participant');
        return false;
      }
    }
  });
}

/**
 * Show edit enrollment modal
 */
async function showEditEnrollmentModal(enrollmentId) {
  try {
    const enrollment = await API.get(`/api/enrollments/${enrollmentId}`);
    const modal = new Modal();

    modal.show({
      title: 'Edit Enrollment',
      size: 'medium',
      content: getEnrollmentFormHTML(enrollment),
      submitText: 'Update',
      onSubmit: async (modalInstance) => {
        const formData = modalInstance.getFormData();

        // Convert percentage to integer
        if (formData.completionPercentage) {
          formData.completionPercentage = parseInt(formData.completionPercentage);
        }

        modalInstance.setLoading(true);

        try {
          await API.put(`/api/enrollments/${enrollmentId}`, formData);
          showNotification('Enrollment updated successfully', 'success');
          await loadEnrollments();
          return true;
        } catch (error) {
          modalInstance.setLoading(false);
          modalInstance.showError(error.message || 'Failed to update enrollment');
          return false;
        }
      }
    });
  } catch (error) {
    showNotification('Failed to load enrollment', 'error');
  }
}

/**
 * Get enrollment form HTML
 */
function getEnrollmentFormHTML(enrollment = null) {
  const isEdit = enrollment !== null;

  return `
    <form>
      <div class="form-group required">
        <label for="userId">Participant</label>
        <select id="userId" name="userId" class="form-select" required ${isEdit ? 'disabled' : ''}>
          <option value="">Select participant...</option>
          ${allParticipants.map(p => `
            <option value="${p.id}" ${isEdit && enrollment.userId === p.id ? 'selected' : ''}>
              ${p.firstName} ${p.lastName} (${p.email})
            </option>
          `).join('')}
        </select>
        ${isEdit ? '<small class="form-help">Participant cannot be changed</small>' : ''}
      </div>

      <div class="form-group required">
        <label for="cohortId">Cohort</label>
        <select id="cohortId" name="cohortId" class="form-select" required ${isEdit ? 'disabled' : ''}>
          <option value="">Select cohort...</option>
          ${allCohorts.map(c => `
            <option value="${c.id}" ${isEdit && enrollment.cohortId === c.id ? 'selected' : ''}>
              ${c.name} - ${c.programmeName || 'No programme'}
            </option>
          `).join('')}
        </select>
        ${isEdit ? '<small class="form-help">Cohort cannot be changed</small>' : ''}
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="enrollmentStatus">Status</label>
          <select id="enrollmentStatus" name="enrollmentStatus" class="form-select">
            <option value="active" ${isEdit && enrollment.enrollmentStatus === 'active' ? 'selected' : ''}>Active</option>
            <option value="completed" ${isEdit && enrollment.enrollmentStatus === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="withdrawn" ${isEdit && enrollment.enrollmentStatus === 'withdrawn' ? 'selected' : ''}>Withdrawn</option>
            <option value="suspended" ${isEdit && enrollment.enrollmentStatus === 'suspended' ? 'selected' : ''}>Suspended</option>
          </select>
        </div>

        ${isEdit ? `
          <div class="form-group">
            <label for="completionPercentage">Completion %</label>
            <input
              type="number"
              id="completionPercentage"
              name="completionPercentage"
              class="form-input"
              min="0"
              max="100"
              value="${enrollment.completionPercentage || 0}"
            >
          </div>
        ` : ''}
      </div>

      ${!isEdit ? '<p class="form-help">Status defaults to "active" upon enrollment</p>' : ''}
    </form>
  `;
}

/**
 * Show import enrollments modal
 */
function showImportEnrollmentsModal() {
  const modal = new Modal();

  modal.show({
    title: 'Import Enrollments from CSV',
    size: 'medium',
    content: `
      <p>Upload a CSV file with the following columns:</p>
      <ul style="margin: 1rem 0; padding-left: 1.5rem;">
        <li><strong>cohortId:</strong> Cohort ID</li>
        <li><strong>email:</strong> Participant email address</li>
        <li><strong>firstName:</strong> First name (optional, for new users)</li>
        <li><strong>lastName:</strong> Last name (optional, for new users)</li>
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

        const result = await API.upload('/api/enrollments/import', formData);
        showNotification(`Imported ${result.imported} enrollments successfully`, 'success');
        await loadEnrollments();
        return true;
      } catch (error) {
        modalInstance.setLoading(false);
        modalInstance.showError(error.message || 'Failed to import enrollments');
        return false;
      }
    }
  });
}

/**
 * Export enrollments to CSV
 */
async function exportEnrollments() {
  try {
    // Get current cohort filter if any
    const cohortId = null; // Could be filtered by cohort in future

    const endpoint = cohortId
      ? `/api/enrollments/cohort/${cohortId}/export`
      : '/api/enrollments/export';

    await API.download(endpoint, `enrollments-${new Date().toISOString().split('T')[0]}.csv`);
    showNotification('Enrollments exported successfully', 'success');
  } catch (error) {
    showNotification('Failed to export enrollments', 'error');
  }
}

/**
 * Delete an enrollment
 */
async function deleteEnrollment(enrollmentId) {
  const confirmed = await confirmDialog(
    'Are you sure you want to remove this enrollment?',
    'Remove Enrollment'
  );

  if (!confirmed) return;

  try {
    await API.delete(`/api/enrollments/${enrollmentId}`);
    showNotification('Enrollment removed successfully', 'success');
    await loadEnrollments();
  } catch (error) {
    showNotification(error.message || 'Failed to remove enrollment', 'error');
  }
}

// Make functions globally available
window.initEnrollmentsView = initEnrollmentsView;
window.showEnrollParticipantModal = showEnrollParticipantModal;
window.showEditEnrollmentModal = showEditEnrollmentModal;
window.showImportEnrollmentsModal = showImportEnrollmentsModal;
window.exportEnrollments = exportEnrollments;
window.deleteEnrollment = deleteEnrollment;
window.filterEnrollments = filterEnrollments;
