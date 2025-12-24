// Enhanced Cohort Management with Session Scheduling
import { fetchAPI } from '../utils/api.js';
import { showModal, closeModal } from '../shared/modal.js';

let currentCohortId = null;
let cohortSessions = [];

// Initialize enhanced cohort management
export async function initCohortsEnhanced() {
  await loadCohorts();
  setupEventListeners();
}

// Load all cohorts
async function loadCohorts() {
  try {
    const cohorts = await fetchAPI('/api/cohorts');
    displayCohorts(cohorts);
  } catch (error) {
    console.error('Failed to load cohorts:', error);
    alert('Failed to load cohorts');
  }
}

// Display cohorts in list
function displayCohorts(cohorts) {
  const container = document.getElementById('cohortsContainer');
  if (!container) return;

  if (cohorts.length === 0) {
    container.innerHTML = '<p class="empty-state">No cohorts found. Create one to get started.</p>';
    return;
  }

  container.innerHTML = cohorts.map(cohort => `
    <div class="cohort-card" data-cohort-id="${cohort.id}">
      <div class="cohort-header">
        <h3>${cohort.name}</h3>
        <span class="cohort-status status-${cohort.status}">${cohort.status}</span>
      </div>
      <div class="cohort-details">
        <p><strong>Programme:</strong> ${cohort.programmeName || 'N/A'}</p>
        <p><strong>Start Date:</strong> ${formatDate(cohort.startDate)}</p>
        <p><strong>End Date:</strong> ${formatDate(cohort.endDate)}</p>
        <p><strong>Capacity:</strong> ${cohort.currentEnrollments || 0} / ${cohort.maxParticipants || 'Unlimited'}</p>
      </div>
      <div class="cohort-actions">
        <button class="btn btn-primary" onclick="viewCohortSessions(${cohort.id})">
          📅 Sessions
        </button>
        <button class="btn btn-secondary" onclick="viewCohortParticipants(${cohort.id})">
          👥 Participants
        </button>
        <button class="btn btn-secondary" onclick="editCohort(${cohort.id})">
          ✏️ Edit
        </button>
      </div>
    </div>
  `).join('');
}

// View cohort sessions
window.viewCohortSessions = async function(cohortId) {
  currentCohortId = cohortId;

  try {
    const sessions = await fetchAPI(`/api/cohort-sessions/cohort/${cohortId}/with-stats`);
    cohortSessions = sessions;
    showSessionsModal(sessions);
  } catch (error) {
    console.error('Failed to load sessions:', error);
    alert('Failed to load sessions');
  }
};

// Show sessions in modal with calendar view
function showSessionsModal(sessions) {
  const modalContent = `
    <div class="sessions-modal">
      <div class="modal-header">
        <h2>Cohort Sessions</h2>
        <button class="btn btn-primary" onclick="showAddSessionForm()">
          ➕ Add Session
        </button>
      </div>

      <div class="sessions-calendar">
        ${sessions.length === 0 ?
          '<p class="empty-state">No sessions scheduled. Add a session to get started.</p>' :
          renderSessionsTimeline(sessions)
        }
      </div>
    </div>
  `;

  showModal(modalContent, 'large');
}

// Render sessions as timeline
function renderSessionsTimeline(sessions) {
  const grouped = groupSessionsByMonth(sessions);

  return Object.entries(grouped).map(([month, monthSessions]) => `
    <div class="session-month">
      <h3 class="month-header">${month}</h3>
      <div class="session-list">
        ${monthSessions.map(session => renderSessionCard(session)).join('')}
      </div>
    </div>
  `).join('');
}

// Render individual session card
function renderSessionCard(session) {
  const attendanceRate = session.totalMarked > 0
    ? Math.round((session.presentCount / session.totalMarked) * 100)
    : 0;

  return `
    <div class="session-card ${session.isCompleted ? 'completed' : 'upcoming'}">
      <div class="session-date">
        <div class="date-day">${new Date(session.sessionDate).getDate()}</div>
        <div class="date-month">${new Date(session.sessionDate).toLocaleDateString('en-US', { month: 'short' })}</div>
      </div>

      <div class="session-details">
        <h4>${session.sessionName}</h4>
        <div class="session-meta">
          <span>⏰ ${session.startTime || 'TBD'} - ${session.endTime || 'TBD'}</span>
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
          <button class="btn btn-sm btn-primary" onclick="markAttendanceForSession(${session.id})">
            ✓ Mark Attendance
          </button>
          <button class="btn btn-sm btn-success" onclick="markSessionComplete(${session.id})">
            ✓ Complete
          </button>
        ` : `
          <span class="badge badge-success">Completed</span>
        `}
        <button class="btn btn-sm btn-secondary" onclick="editSession(${session.id})">
          ✏️ Edit
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteSession(${session.id})">
          🗑️ Delete
        </button>
      </div>
    </div>
  `;
}

// Group sessions by month
function groupSessionsByMonth(sessions) {
  const grouped = {};

  sessions.forEach(session => {
    const date = new Date(session.sessionDate);
    const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

    if (!grouped[monthKey]) {
      grouped[monthKey] = [];
    }
    grouped[monthKey].push(session);
  });

  return grouped;
}

// Show add session form
window.showAddSessionForm = function() {
  const formContent = `
    <div class="session-form">
      <h3>Add New Session</h3>
      <form id="addSessionForm">
        <div class="form-group">
          <label for="sessionName">Session Name *</label>
          <input type="text" id="sessionName" name="sessionName" required
                 placeholder="e.g., Week 1: Introduction to Business">
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="sessionDate">Date *</label>
            <input type="date" id="sessionDate" name="sessionDate" required>
          </div>

          <div class="form-group">
            <label for="sessionType">Type</label>
            <select id="sessionType" name="sessionType">
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
            <input type="time" id="startTime" name="startTime">
          </div>

          <div class="form-group">
            <label for="endTime">End Time</label>
            <input type="time" id="endTime" name="endTime">
          </div>
        </div>

        <div class="form-group">
          <label for="location">Location</label>
          <input type="text" id="location" name="location"
                 placeholder="e.g., Room 101, Online via Zoom">
        </div>

        <div class="form-group">
          <label for="description">Description</label>
          <textarea id="description" name="description" rows="3"
                    placeholder="Session objectives, topics, or notes"></textarea>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Create Session</button>
        </div>
      </form>
    </div>
  `;

  showModal(formContent, 'medium');

  document.getElementById('addSessionForm').addEventListener('submit', handleAddSession);
};

// Handle add session form submission
async function handleAddSession(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const sessionData = {
    cohortId: currentCohortId,
    sessionName: formData.get('sessionName'),
    sessionDate: formData.get('sessionDate'),
    sessionType: formData.get('sessionType'),
    startTime: formData.get('startTime') || null,
    endTime: formData.get('endTime') || null,
    location: formData.get('location') || null,
    description: formData.get('description') || null
  };

  try {
    await fetchAPI('/api/cohort-sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData)
    });

    closeModal();
    viewCohortSessions(currentCohortId); // Reload sessions
    alert('Session created successfully');
  } catch (error) {
    console.error('Failed to create session:', error);
    alert('Failed to create session');
  }
}

// Mark session as complete
window.markSessionComplete = async function(sessionId) {
  const notes = prompt('Enter any completion notes (optional):');

  try {
    await fetchAPI(`/api/cohort-sessions/${sessionId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ notes })
    });

    viewCohortSessions(currentCohortId); // Reload sessions
    alert('Session marked as complete');
  } catch (error) {
    console.error('Failed to mark session complete:', error);
    alert('Failed to mark session complete');
  }
};

// Delete session
window.deleteSession = async function(sessionId) {
  if (!confirm('Are you sure you want to delete this session?')) return;

  try {
    await fetchAPI(`/api/cohort-sessions/${sessionId}`, {
      method: 'DELETE'
    });

    viewCohortSessions(currentCohortId); // Reload sessions
    alert('Session deleted successfully');
  } catch (error) {
    console.error('Failed to delete session:', error);
    alert('Failed to delete session');
  }
};

// Utility: Format date
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Setup event listeners
function setupEventListeners() {
  const addCohortBtn = document.getElementById('addCohortBtn');
  if (addCohortBtn) {
    addCohortBtn.addEventListener('click', () => {
      // Show add cohort modal (use existing cohort modal)
      window.location.hash = '#cohorts';
    });
  }
}
