/**
 * Programme Management UI
 * Admin interface for managing programmes
 */

let programmesTable = null;
let allProgrammes = [];

/**
 * Initialize the programmes view
 */
async function initProgrammesView() {
  const mainContent = document.getElementById('mainContent');

  mainContent.innerHTML = `
    <div class="view-header">
      <div>
        <h1>Programmes</h1>
        <p>Manage Breakout and Mentoring Day programmes</p>
      </div>
      <div class="view-actions">
        <button onclick="showAddProgrammeModal()" class="btn btn-primary">
          <span>+ Add Programme</span>
        </button>
      </div>
    </div>

    <div class="stats-grid" id="programmesStats">
      <div class="stat-card">
        <div class="stat-value" id="totalProgrammes">-</div>
        <div class="stat-label">Total Programmes</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="activeProgrammes">-</div>
        <div class="stat-label">Active</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="completedProgrammes">-</div>
        <div class="stat-label">Completed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="totalCohorts">-</div>
        <div class="stat-label">Total Cohorts</div>
      </div>
    </div>

    <div class="filter-tabs">
      <button class="filter-tab active" data-status="all" onclick="filterProgrammes('all')">
        All <span class="count" id="countAll">0</span>
      </button>
      <button class="filter-tab" data-status="active" onclick="filterProgrammes('active')">
        Active <span class="count" id="countActive">0</span>
      </button>
      <button class="filter-tab" data-status="completed" onclick="filterProgrammes('completed')">
        Completed <span class="count" id="countCompleted">0</span>
      </button>
      <button class="filter-tab" data-status="draft" onclick="filterProgrammes('draft')">
        Draft <span class="count" id="countDraft">0</span>
      </button>
    </div>

    <div class="table-container">
      <table id="programmesTable">
        <thead>
          <tr>
            <th data-sortable="name">Name</th>
            <th data-sortable="programmeType">Type</th>
            <th data-sortable="status">Status</th>
            <th data-sortable="cohortCount">Cohorts</th>
            <th data-sortable="participantCount">Participants</th>
            <th data-sortable="createdAt">Created</th>
            <th class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
        </tbody>
      </table>
    </div>
  `;

  // Initialize table manager
  programmesTable = new TableManager('programmesTable', {
    sortable: true,
    filterable: true,
    searchPlaceholder: 'Search programmes...',
    renderRow: renderProgrammeRow
  });

  // Load programmes
  await loadProgrammes();
}

/**
 * Load all programmes with stats
 */
async function loadProgrammes() {
  try {
    const programmes = await API.get('/api/programmes?stats=true');
    allProgrammes = programmes;

    // Update stats
    const stats = calculateProgrammeStats(programmes);
    document.getElementById('totalProgrammes').textContent = stats.total;
    document.getElementById('activeProgrammes').textContent = stats.active;
    document.getElementById('completedProgrammes').textContent = stats.completed;
    document.getElementById('totalCohorts').textContent = stats.cohorts;

    // Update filter counts
    document.getElementById('countAll').textContent = stats.total;
    document.getElementById('countActive').textContent = stats.active;
    document.getElementById('countCompleted').textContent = stats.completed;
    document.getElementById('countDraft').textContent = stats.draft;

    // Set table data
    programmesTable.setData(programmes);
  } catch (error) {
    console.error('Error loading programmes:', error);
    showNotification('Failed to load programmes', 'error');
  }
}

/**
 * Calculate programme statistics
 */
function calculateProgrammeStats(programmes) {
  return {
    total: programmes.length,
    active: programmes.filter(p => p.status === 'active').length,
    completed: programmes.filter(p => p.status === 'completed').length,
    draft: programmes.filter(p => p.status === 'draft').length,
    cohorts: programmes.reduce((sum, p) => sum + (p.cohortCount || 0), 0)
  };
}

/**
 * Filter programmes by status
 */
function filterProgrammes(status) {
  // Update active tab
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.dataset.status === status) {
      tab.classList.add('active');
    }
  });

  // Filter data
  let filteredData = allProgrammes;
  if (status !== 'all') {
    filteredData = allProgrammes.filter(p => p.status === status);
  }

  programmesTable.setData(filteredData);
}

/**
 * Render a programme row
 */
function renderProgrammeRow(programme) {
  const tr = document.createElement('tr');

  tr.innerHTML = `
    <td>
      <div style="font-weight: 500;">${programme.name || ''}</div>
      <div style="font-size: 0.75rem; color: #666;">${programme.description || ''}</div>
    </td>
    <td>${formatProgrammeType(programme.programmeType)}</td>
    <td><span class="status-badge ${programme.status}">${programme.status}</span></td>
    <td>${programme.cohortCount || 0}</td>
    <td>${programme.participantCount || 0}</td>
    <td>${formatDate(programme.createdAt)}</td>
    <td class="col-actions">
      <div class="table-actions">
        <button class="btn btn-sm btn-primary" onclick="showEditProgrammeModal(${programme.id})">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteProgramme(${programme.id})">Delete</button>
      </div>
    </td>
  `;

  return tr;
}

/**
 * Format programme type for display
 */
function formatProgrammeType(type) {
  const types = {
    'breakout': 'Breakout Programme',
    'mentoring_day': 'Mentoring Day',
    'other': 'Other'
  };
  return types[type] || type;
}

/**
 * Show add programme modal
 */
function showAddProgrammeModal() {
  const modal = new Modal();

  modal.show({
    title: 'Add Programme',
    size: 'medium',
    content: getProgrammeFormHTML(),
    submitText: 'Create Programme',
    onSubmit: async (modalInstance) => {
      const formData = modalInstance.getFormData();

      // Validation
      if (!formData.name || !formData.programmeType || !formData.status) {
        modalInstance.showError('Please fill in all required fields');
        return false;
      }

      modalInstance.setLoading(true);

      try {
        await API.post('/api/programmes', formData);
        showNotification('Programme created successfully', 'success');
        await loadProgrammes();
        return true; // Close modal
      } catch (error) {
        modalInstance.setLoading(false);
        modalInstance.showError(error.message || 'Failed to create programme');
        return false; // Keep modal open
      }
    }
  });
}

/**
 * Show edit programme modal
 */
async function showEditProgrammeModal(programmeId) {
  try {
    const programme = await API.get(`/api/programmes/${programmeId}`);
    const modal = new Modal();

    modal.show({
      title: 'Edit Programme',
      size: 'medium',
      content: getProgrammeFormHTML(programme),
      submitText: 'Update Programme',
      onSubmit: async (modalInstance) => {
        const formData = modalInstance.getFormData();

        // Validation
        if (!formData.name || !formData.programmeType || !formData.status) {
          modalInstance.showError('Please fill in all required fields');
          return false;
        }

        modalInstance.setLoading(true);

        try {
          await API.put(`/api/programmes/${programmeId}`, formData);
          showNotification('Programme updated successfully', 'success');
          await loadProgrammes();
          return true;
        } catch (error) {
          modalInstance.setLoading(false);
          modalInstance.showError(error.message || 'Failed to update programme');
          return false;
        }
      }
    });
  } catch (error) {
    showNotification('Failed to load programme', 'error');
  }
}

/**
 * Get programme form HTML
 */
function getProgrammeFormHTML(programme = null) {
  const isEdit = programme !== null;

  return `
    <form>
      <div class="form-group required">
        <label for="name">Programme Name</label>
        <input
          type="text"
          id="name"
          name="name"
          class="form-input"
          value="${isEdit ? programme.name : ''}"
          required
        >
      </div>

      <div class="form-row">
        <div class="form-group required">
          <label for="programmeType">Type</label>
          <select id="programmeType" name="programmeType" class="form-select" required>
            <option value="">Select type...</option>
            <option value="breakout" ${isEdit && programme.programmeType === 'breakout' ? 'selected' : ''}>Breakout Programme</option>
            <option value="mentoring_day" ${isEdit && programme.programmeType === 'mentoring_day' ? 'selected' : ''}>Mentoring Day</option>
            <option value="other" ${isEdit && programme.programmeType === 'other' ? 'selected' : ''}>Other</option>
          </select>
        </div>

        <div class="form-group required">
          <label for="status">Status</label>
          <select id="status" name="status" class="form-select" required>
            <option value="">Select status...</option>
            <option value="draft" ${isEdit && programme.status === 'draft' ? 'selected' : ''}>Draft</option>
            <option value="active" ${isEdit && programme.status === 'active' ? 'selected' : ''}>Active</option>
            <option value="completed" ${isEdit && programme.status === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="archived" ${isEdit && programme.status === 'archived' ? 'selected' : ''}>Archived</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label for="description">Description</label>
        <textarea
          id="description"
          name="description"
          class="form-textarea"
          rows="4"
        >${isEdit && programme.description ? programme.description : ''}</textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="startDate">Start Date</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            class="form-input"
            value="${isEdit && programme.startDate ? programme.startDate.split('T')[0] : ''}"
          >
        </div>

        <div class="form-group">
          <label for="endDate">End Date</label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            class="form-input"
            value="${isEdit && programme.endDate ? programme.endDate.split('T')[0] : ''}"
          >
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="maxParticipants">Max Participants</label>
          <input
            type="number"
            id="maxParticipants"
            name="maxParticipants"
            class="form-input"
            min="1"
            value="${isEdit && programme.maxParticipants ? programme.maxParticipants : ''}"
          >
        </div>

        <div class="form-group">
          <label for="durationWeeks">Duration (weeks)</label>
          <input
            type="number"
            id="durationWeeks"
            name="durationWeeks"
            class="form-input"
            min="1"
            value="${isEdit && programme.durationWeeks ? programme.durationWeeks : ''}"
          >
        </div>
      </div>
    </form>
  `;
}

/**
 * Delete a programme
 */
async function deleteProgramme(programmeId) {
  const confirmed = await confirmDialog(
    'Are you sure you want to delete this programme? This action cannot be undone.',
    'Delete Programme'
  );

  if (!confirmed) return;

  try {
    await API.delete(`/api/programmes/${programmeId}`);
    showNotification('Programme deleted successfully', 'success');
    await loadProgrammes();
  } catch (error) {
    showNotification(error.message || 'Failed to delete programme', 'error');
  }
}

// Make functions globally available
window.initProgrammesView = initProgrammesView;
window.showAddProgrammeModal = showAddProgrammeModal;
window.showEditProgrammeModal = showEditProgrammeModal;
window.deleteProgramme = deleteProgramme;
window.filterProgrammes = filterProgrammes;
