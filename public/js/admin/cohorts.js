/**
 * Cohort Management UI
 * Admin interface for managing cohorts
 */

console.log('✅ Cohorts.js loaded');

let cohortsTable = null;
let allCohorts = [];
let allProgrammes = [];

/**
 * Initialize the cohorts view
 */
async function initCohortsView() {
  const mainContent = document.getElementById('mainContent');

  mainContent.innerHTML = `
    <div class="view-header">
      <div>
        <h1>Cohorts</h1>
        <p>Manage programme cohorts and participant groups</p>
      </div>
      <div class="view-actions">
        <button onclick="showAddCohortModal()" class="btn btn-primary">
          <span>+ Add Cohort</span>
        </button>
      </div>
    </div>

    <div class="stats-grid" id="cohortsStats">
      <div class="stat-card">
        <div class="stat-value" id="totalCohorts">-</div>
        <div class="stat-label">Total Cohorts</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="activeCohorts">-</div>
        <div class="stat-label">Active</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="totalParticipants">-</div>
        <div class="stat-label">Total Participants</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="totalMentors">-</div>
        <div class="stat-label">Assigned Mentors</div>
      </div>
    </div>

    <div class="filter-tabs">
      <button class="filter-tab active" data-status="all" onclick="filterCohorts('all')">
        All <span class="count" id="countAll">0</span>
      </button>
      <button class="filter-tab" data-status="active" onclick="filterCohorts('active')">
        Active <span class="count" id="countActive">0</span>
      </button>
      <button class="filter-tab" data-status="completed" onclick="filterCohorts('completed')">
        Completed <span class="count" id="countCompleted">0</span>
      </button>
      <button class="filter-tab" data-status="scheduled" onclick="filterCohorts('scheduled')">
        Scheduled <span class="count" id="countScheduled">0</span>
      </button>
    </div>

    <div class="table-container">
      <table id="cohortsTable">
        <thead>
          <tr>
            <th data-sortable="name">Cohort Name</th>
            <th data-sortable="programmeName">Programme</th>
            <th data-sortable="status">Status</th>
            <th data-sortable="startDate">Start Date</th>
            <th data-sortable="endDate">End Date</th>
            <th data-sortable="participantCount">Participants</th>
            <th class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
        </tbody>
      </table>
    </div>
  `;

  // Initialize table manager
  cohortsTable = new TableManager('cohortsTable', {
    sortable: true,
    filterable: true,
    searchPlaceholder: 'Search cohorts...',
    renderRow: renderCohortRow
  });

  // Load data
  await loadProgrammes();
  await loadCohorts();
}

/**
 * Load all programmes for dropdown
 */
async function loadProgrammes() {
  try {
    allProgrammes = await API.get('/api/programmes');
  } catch (error) {
    console.error('Error loading programmes:', error);
  }
}

/**
 * Load all cohorts
 */
async function loadCohorts() {
  try {
    const cohorts = await API.get('/api/cohorts');
    allCohorts = cohorts;

    // Update stats
    const stats = calculateCohortStats(cohorts);
    document.getElementById('totalCohorts').textContent = stats.total;
    document.getElementById('activeCohorts').textContent = stats.active;
    document.getElementById('totalParticipants').textContent = stats.participants;
    document.getElementById('totalMentors').textContent = stats.mentors;

    // Update filter counts
    document.getElementById('countAll').textContent = stats.total;
    document.getElementById('countActive').textContent = stats.active;
    document.getElementById('countCompleted').textContent = stats.completed;
    document.getElementById('countScheduled').textContent = stats.scheduled;

    // Set table data
    cohortsTable.setData(cohorts);
  } catch (error) {
    console.error('Error loading cohorts:', error);
    showNotification('Failed to load cohorts', 'error');
  }
}

/**
 * Calculate cohort statistics
 */
function calculateCohortStats(cohorts) {
  return {
    total: cohorts.length,
    active: cohorts.filter(c => c.status === 'active').length,
    completed: cohorts.filter(c => c.status === 'completed').length,
    scheduled: cohorts.filter(c => c.status === 'scheduled').length,
    participants: cohorts.reduce((sum, c) => sum + (c.participantCount || 0), 0),
    mentors: cohorts.reduce((sum, c) => sum + (c.mentorCount || 0), 0)
  };
}

/**
 * Filter cohorts by status
 */
function filterCohorts(status) {
  // Update active tab
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.dataset.status === status) {
      tab.classList.add('active');
    }
  });

  // Filter data
  let filteredData = allCohorts;
  if (status !== 'all') {
    filteredData = allCohorts.filter(c => c.status === status);
  }

  cohortsTable.setData(filteredData);
}

/**
 * Render a cohort row
 */
function renderCohortRow(cohort) {
  const tr = document.createElement('tr');

  tr.innerHTML = `
    <td>
      <div style="font-weight: 500;">${cohort.name || ''}</div>
      ${cohort.location ? `<div style="font-size: 0.75rem; color: #666;">📍 ${cohort.location}</div>` : ''}
    </td>
    <td>${cohort.programmeName || '-'}</td>
    <td><span class="status-badge ${cohort.status}">${cohort.status}</span></td>
    <td>${formatDate(cohort.startDate)}</td>
    <td>${formatDate(cohort.endDate)}</td>
    <td>${cohort.participantCount || 0} / ${cohort.maxParticipants || '∞'}</td>
    <td class="col-actions">
      <div class="table-actions">
        <button class="btn btn-sm btn-secondary" onclick="viewCohortSessions(${cohort.id})">📅 Sessions</button>
        <button class="btn btn-sm btn-secondary" onclick="viewCohortParticipants(${cohort.id})">👥 View</button>
        <button class="btn btn-sm btn-primary" onclick="showEditCohortModal(${cohort.id})">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteCohort(${cohort.id})">Delete</button>
      </div>
    </td>
  `;

  return tr;
}

/**
 * Show add cohort modal
 */
function showAddCohortModal() {
  const modal = new Modal();

  modal.show({
    title: 'Add Cohort',
    size: 'medium',
    content: getCohortFormHTML(),
    submitText: 'Create Cohort',
    onSubmit: async (modalInstance) => {
      const formData = modalInstance.getFormData();

      // Validation
      if (!formData.name || !formData.programmeId || !formData.status) {
        modalInstance.showError('Please fill in all required fields');
        return false;
      }

      // Convert IDs to integers
      if (formData.programmeId) formData.programmeId = parseInt(formData.programmeId);
      if (formData.maxParticipants) formData.maxParticipants = parseInt(formData.maxParticipants);

      modalInstance.setLoading(true);

      try {
        await API.post('/api/cohorts', formData);
        showNotification('Cohort created successfully', 'success');
        await loadCohorts();
        return true;
      } catch (error) {
        modalInstance.setLoading(false);
        modalInstance.showError(error.message || 'Failed to create cohort');
        return false;
      }
    }
  });
}

/**
 * Show edit cohort modal
 */
async function showEditCohortModal(cohortId) {
  try {
    const cohort = await API.get(`/api/cohorts/${cohortId}`);
    const modal = new Modal();

    modal.show({
      title: 'Edit Cohort',
      size: 'medium',
      content: getCohortFormHTML(cohort),
      submitText: 'Update Cohort',
      onSubmit: async (modalInstance) => {
        const formData = modalInstance.getFormData();

        // Validation
        if (!formData.name || !formData.programmeId || !formData.status) {
          modalInstance.showError('Please fill in all required fields');
          return false;
        }

        // Convert IDs to integers
        if (formData.programmeId) formData.programmeId = parseInt(formData.programmeId);
        if (formData.maxParticipants) formData.maxParticipants = parseInt(formData.maxParticipants);

        modalInstance.setLoading(true);

        try {
          await API.put(`/api/cohorts/${cohortId}`, formData);
          showNotification('Cohort updated successfully', 'success');
          await loadCohorts();
          return true;
        } catch (error) {
          modalInstance.setLoading(false);
          modalInstance.showError(error.message || 'Failed to update cohort');
          return false;
        }
      }
    });
  } catch (error) {
    showNotification('Failed to load cohort', 'error');
  }
}

/**
 * Get cohort form HTML
 */
function getCohortFormHTML(cohort = null) {
  const isEdit = cohort !== null;

  return `
    <form>
      <div class="form-group required">
        <label for="name">Cohort Name</label>
        <input
          type="text"
          id="name"
          name="name"
          class="form-input"
          value="${isEdit ? cohort.name : ''}"
          required
        >
      </div>

      <div class="form-row">
        <div class="form-group required">
          <label for="programmeId">Programme</label>
          <select id="programmeId" name="programmeId" class="form-select" required>
            <option value="">Select programme...</option>
            ${allProgrammes.map(p => `
              <option value="${p.id}" ${isEdit && cohort.programmeId === p.id ? 'selected' : ''}>
                ${p.name}
              </option>
            `).join('')}
          </select>
        </div>

        <div class="form-group required">
          <label for="status">Status</label>
          <select id="status" name="status" class="form-select" required>
            <option value="">Select status...</option>
            <option value="scheduled" ${isEdit && cohort.status === 'scheduled' ? 'selected' : ''}>Scheduled</option>
            <option value="active" ${isEdit && cohort.status === 'active' ? 'selected' : ''}>Active</option>
            <option value="completed" ${isEdit && cohort.status === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="cancelled" ${isEdit && cohort.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="startDate">Start Date</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            class="form-input"
            value="${isEdit && cohort.startDate ? cohort.startDate.split('T')[0] : ''}"
          >
        </div>

        <div class="form-group">
          <label for="endDate">End Date</label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            class="form-input"
            value="${isEdit && cohort.endDate ? cohort.endDate.split('T')[0] : ''}"
          >
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="location">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            class="form-input"
            value="${isEdit && cohort.location ? cohort.location : ''}"
          >
        </div>

        <div class="form-group">
          <label for="maxParticipants">Max Participants</label>
          <input
            type="number"
            id="maxParticipants"
            name="maxParticipants"
            class="form-input"
            min="1"
            value="${isEdit && cohort.maxParticipants ? cohort.maxParticipants : ''}"
          >
        </div>
      </div>

      <div class="form-group">
        <label for="schedule">Schedule</label>
        <textarea
          id="schedule"
          name="schedule"
          class="form-textarea"
          rows="3"
          placeholder="e.g., Mondays 6-8pm, Wednesdays 6-8pm"
        >${isEdit && cohort.schedule ? cohort.schedule : ''}</textarea>
        <small class="form-help">Describe the meeting schedule for this cohort</small>
      </div>
    </form>
  `;
}

/**
 * View cohort participants
 */
async function viewCohortParticipants(cohortId) {
  try {
    const cohort = await API.get(`/api/cohorts/${cohortId}`);
    const participants = await API.get(`/api/cohorts/${cohortId}/participants`);

    const modal = new Modal();
    modal.show({
      title: `Participants - ${cohort.name}`,
      size: 'large',
      content: `
        <div class="view-header" style="margin-bottom: 1rem;">
          <p>${cohort.programmeName || ''}</p>
          <p>Total: ${participants.length} / ${cohort.maxParticipants || '∞'}</p>
        </div>
        <table style="width: 100%;">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            ${participants.length > 0 ? participants.map(p => `
              <tr>
                <td>${p.firstName} ${p.lastName}</td>
                <td>${p.email}</td>
                <td><span class="status-badge ${p.enrollmentStatus}">${p.enrollmentStatus || 'enrolled'}</span></td>
                <td>${p.completionPercentage || 0}%</td>
              </tr>
            `).join('') : '<tr><td colspan="4" style="text-align: center;">No participants enrolled</td></tr>'}
          </tbody>
        </table>
      `,
      showFooter: false,
      size: 'large'
    });
  } catch (error) {
    showNotification('Failed to load participants', 'error');
  }
}

/**
 * Delete a cohort
 */
async function deleteCohort(cohortId) {
  const confirmed = await confirmDialog(
    'Are you sure you want to delete this cohort? This action cannot be undone.',
    'Delete Cohort'
  );

  if (!confirmed) return;

  try {
    await API.delete(`/api/cohorts/${cohortId}`);
    showNotification('Cohort deleted successfully', 'success');
    await loadCohorts();
  } catch (error) {
    showNotification(error.message || 'Failed to delete cohort', 'error');
  }
}

/**
 * View cohort sessions with enhanced session management
 */
async function viewCohortSessions(cohortId) {
  try {
    const [cohort, sessions] = await Promise.all([
      API.get(`/api/cohorts/${cohortId}`),
      API.get(`/api/cohort-sessions/cohort/${cohortId}/with-stats`)
    ]);

    const modal = new Modal();
    modal.show({
      title: `Sessions - ${cohort.name}`,
      size: 'large',
      content: renderSessionsContent(cohort, sessions),
      showFooter: false
    });

    // Store current cohort for session operations
    window.currentSessionCohortId = cohortId;
  } catch (error) {
    console.error('Failed to load sessions:', error);
    showNotification('Failed to load sessions', 'error');
  }
}

/**
 * Render sessions content
 */
function renderSessionsContent(cohort, sessions) {
  const grouped = groupSessionsByMonth(sessions);

  return `
    <div class="sessions-modal-enhanced">
      <div class="view-header" style="margin-bottom: 1.5rem;">
        <p>${cohort.programmeName || ''} | ${formatDate(cohort.startDate)} - ${formatDate(cohort.endDate)}</p>
        <button class="btn btn-primary" onclick="showAddSessionModal()">
          ➕ Add Session
        </button>
      </div>

      <div class="sessions-list">
        ${sessions.length === 0 ?
          '<p class="empty-state">No sessions scheduled. Add a session to get started.</p>' :
          renderSessionTimeline(grouped)
        }
      </div>
    </div>
  `;
}

/**
 * Group sessions by month
 */
function groupSessionsByMonth(sessions) {
  const grouped = {};
  sessions.forEach(session => {
    const date = new Date(session.sessionDate);
    const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    if (!grouped[monthKey]) grouped[monthKey] = [];
    grouped[monthKey].push(session);
  });
  return grouped;
}

/**
 * Render session timeline
 */
function renderSessionTimeline(grouped) {
  return Object.entries(grouped).map(([month, sessions]) => `
    <div class="session-month">
      <h3 class="month-header">${month}</h3>
      ${sessions.map(session => renderSessionCard(session)).join('')}
    </div>
  `).join('');
}

/**
 * Render individual session card
 */
function renderSessionCard(session) {
  const attendanceRate = session.totalMarked > 0
    ? Math.round((session.presentCount / session.totalMarked) * 100)
    : 0;

  const sessionDate = new Date(session.sessionDate);

  return `
    <div class="session-card ${session.isCompleted ? 'completed' : 'upcoming'}">
      <div class="session-date">
        <div class="date-day">${sessionDate.getDate()}</div>
        <div class="date-month">${sessionDate.toLocaleDateString('en-US', { month: 'short' })}</div>
      </div>

      <div class="session-details">
        <h4>${session.sessionName}</h4>
        <div class="session-meta">
          ${session.startTime ? `<span>⏰ ${session.startTime} - ${session.endTime || 'TBD'}</span>` : ''}
          ${session.location ? `<span>📍 ${session.location}</span>` : ''}
          <span class="session-type">${session.sessionType}</span>
        </div>
        ${session.description ? `<p class="session-description">${session.description}</p>` : ''}

        <div class="session-attendance">
          <div class="attendance-bar">
            <div class="attendance-fill" style="width: ${attendanceRate}%"></div>
          </div>
          <span class="attendance-stats">
            ${session.presentCount} present, ${session.absentCount} absent, ${session.lateCount} late
          </span>
        </div>
      </div>

      <div class="session-actions">
        ${!session.isCompleted ? `
          <button class="btn btn-sm btn-success" onclick="markSessionComplete(${session.id})">
            ✓ Complete
          </button>
        ` : `
          <span class="badge badge-success">Completed</span>
        `}
        <button class="btn btn-sm btn-danger" onclick="deleteSession(${session.id})">
          🗑️
        </button>
      </div>
    </div>
  `;
}

/**
 * Show add session modal
 */
async function showAddSessionModal() {
  const modal = new Modal();

  modal.show({
    title: 'Add Session',
    size: 'medium',
    content: `
      <form>
        <div class="form-group required">
          <label for="sessionName">Session Name</label>
          <input type="text" id="sessionName" name="sessionName" class="form-input" required
                 placeholder="e.g., Week 1: Introduction to Business">
        </div>

        <div class="form-row">
          <div class="form-group required">
            <label for="sessionDate">Date</label>
            <input type="date" id="sessionDate" name="sessionDate" class="form-input" required>
          </div>

          <div class="form-group">
            <label for="sessionType">Type</label>
            <select id="sessionType" name="sessionType" class="form-select">
              <option value="lecture">Lecture</option>
              <option value="workshop">Workshop</option>
              <option value="seminar">Seminar</option>
              <option value="practical">Practical</option>
              <option value="assessment">Assessment</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="startTime">Start Time</label>
            <input type="time" id="startTime" name="startTime" class="form-input">
          </div>

          <div class="form-group">
            <label for="endTime">End Time</label>
            <input type="time" id="endTime" name="endTime" class="form-input">
          </div>
        </div>

        <div class="form-group">
          <label for="location">Location</label>
          <input type="text" id="location" name="location" class="form-input"
                 placeholder="e.g., Room 101, Online via Zoom">
        </div>

        <div class="form-group">
          <label for="description">Description</label>
          <textarea id="description" name="description" class="form-textarea" rows="3"
                    placeholder="Session objectives, topics, or notes"></textarea>
        </div>
      </form>
    `,
    submitText: 'Create Session',
    onSubmit: async (modalInstance) => {
      const formData = modalInstance.getFormData();

      if (!formData.sessionName || !formData.sessionDate) {
        modalInstance.showError('Please fill in all required fields');
        return false;
      }

      modalInstance.setLoading(true);

      try {
        await API.post('/api/cohort-sessions', {
          cohortId: window.currentSessionCohortId,
          sessionName: formData.sessionName,
          sessionDate: formData.sessionDate,
          sessionType: formData.sessionType || 'lecture',
          startTime: formData.startTime || null,
          endTime: formData.endTime || null,
          location: formData.location || null,
          description: formData.description || null
        });

        showNotification('Session created successfully', 'success');
        viewCohortSessions(window.currentSessionCohortId); // Reload
        return true;
      } catch (error) {
        modalInstance.setLoading(false);
        modalInstance.showError(error.message || 'Failed to create session');
        return false;
      }
    }
  });
}

/**
 * Mark session as complete
 */
async function markSessionComplete(sessionId) {
  const notes = prompt('Enter completion notes (optional):');

  try {
    await API.post(`/api/cohort-sessions/${sessionId}/complete`, { notes });
    showNotification('Session marked as complete', 'success');
    viewCohortSessions(window.currentSessionCohortId);
  } catch (error) {
    console.error('Failed to mark session complete:', error);
    showNotification('Failed to mark session complete', 'error');
  }
}

/**
 * Delete session
 */
async function deleteSession(sessionId) {
  const confirmed = await confirmDialog(
    'Are you sure you want to delete this session?',
    'Delete Session'
  );

  if (!confirmed) return;

  try {
    await API.delete(`/api/cohort-sessions/${sessionId}`);
    showNotification('Session deleted successfully', 'success');
    viewCohortSessions(window.currentSessionCohortId);
  } catch (error) {
    console.error('Failed to delete session:', error);
    showNotification('Failed to delete session', 'error');
  }
}

// Make functions globally available
window.initCohortsView = initCohortsView;
window.showAddCohortModal = showAddCohortModal;
window.showEditCohortModal = showEditCohortModal;
window.viewCohortParticipants = viewCohortParticipants;
window.viewCohortSessions = viewCohortSessions;
window.showAddSessionModal = showAddSessionModal;
window.markSessionComplete = markSessionComplete;
window.deleteSession = deleteSession;
window.deleteCohort = deleteCohort;
window.filterCohorts = filterCohorts;

console.log('✅ Cohorts functions exported:', typeof window.initCohortsView);
