// Enhanced Attendance Management with Bulk Marking and Analytics
import { fetchAPI } from '../utils/api.js';
import { showModal, closeModal } from '../shared/modal.js';

let currentCohortId = null;
let attendanceData = [];
let enrolledParticipants = [];

// Initialize enhanced attendance management
export async function initAttendanceEnhanced() {
  setupEventListeners();
}

// Show attendance tracker for cohort
window.showAttendanceTracker = async function(cohortId) {
  currentCohortId = cohortId;

  try {
    const [attendance, enrollments, cohortSessions] = await Promise.all([
      fetchAPI(`/api/attendance/cohort/${cohortId}`),
      fetchAPI(`/api/enrollments/cohort/${cohortId}`),
      fetchAPI(`/api/cohort-sessions/cohort/${cohortId}`)
    ]);

    attendanceData = attendance;
    enrolledParticipants = enrollments.map(e => e.user || e);

    showAttendanceModal(cohortSessions);
  } catch (error) {
    console.error('Failed to load attendance data:', error);
    alert('Failed to load attendance data');
  }
};

// Show attendance modal with grid view
function showAttendanceModal(sessions) {
  const modalContent = `
    <div class="attendance-modal">
      <div class="modal-header">
        <h2>Attendance Tracker</h2>
        <div class="header-actions">
          <button class="btn btn-primary" onclick="showBulkMarkingInterface()">
            ✓ Quick Mark Session
          </button>
          <button class="btn btn-secondary" onclick="exportAttendance()">
            📥 Export CSV
          </button>
        </div>
      </div>

      <div class="attendance-tabs">
        <button class="tab-btn active" onclick="showAttendanceGrid()">Grid View</button>
        <button class="tab-btn" onclick="showAttendanceAnalytics()">Analytics</button>
        <button class="tab-btn" onclick="showAttendancePatterns()">Patterns</button>
      </div>

      <div id="attendanceContent" class="attendance-content">
        ${renderAttendanceGrid(sessions)}
      </div>
    </div>
  `;

  showModal(modalContent, 'fullscreen');
}

// Render attendance grid
function renderAttendanceGrid(sessions) {
  if (sessions.length === 0 || enrolledParticipants.length === 0) {
    return '<p class="empty-state">No attendance data available</p>';
  }

  return `
    <div class="attendance-grid-container">
      <table class="attendance-grid">
        <thead>
          <tr>
            <th class="sticky-col">Participant</th>
            ${sessions.map(session => `
              <th class="session-header" title="${session.sessionName}">
                <div class="session-date">${formatShortDate(session.sessionDate)}</div>
                <div class="session-name">${truncate(session.sessionName, 20)}</div>
              </th>
            `).join('')}
            <th>Attendance %</th>
          </tr>
        </thead>
        <tbody>
          ${enrolledParticipants.map(participant => {
            const participantAttendance = getParticipantAttendance(participant.id);
            const attendanceRate = calculateAttendanceRate(participantAttendance, sessions);

            return `
              <tr>
                <td class="sticky-col participant-name">
                  ${participant.firstName} ${participant.lastName}
                </td>
                ${sessions.map(session => {
                  const record = participantAttendance.find(a =>
                    new Date(a.sessionDate).toDateString() === new Date(session.sessionDate).toDateString()
                  );

                  return `
                    <td class="attendance-cell ${record ? 'status-' + record.attendanceStatus : 'status-unmarked'}"
                        onclick="quickMarkAttendance(${participant.id}, '${session.sessionDate}', '${session.sessionName}')">
                      ${renderAttendanceStatus(record)}
                    </td>
                  `;
                }).join('')}
                <td class="attendance-rate">
                  <div class="rate-bar">
                    <div class="rate-fill" style="width: ${attendanceRate}%"></div>
                  </div>
                  <span>${attendanceRate}%</span>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Get participant attendance records
function getParticipantAttendance(participantId) {
  return attendanceData.filter(a => a.userId === participantId);
}

// Calculate attendance rate
function calculateAttendanceRate(participantAttendance, sessions) {
  if (sessions.length === 0) return 0;

  const present = participantAttendance.filter(a =>
    a.attendanceStatus === 'present' || a.attendanceStatus === 'late'
  ).length;

  return Math.round((present / sessions.length) * 100);
}

// Render attendance status
function renderAttendanceStatus(record) {
  if (!record) return '<span class="status-icon">-</span>';

  const icons = {
    present: '✓',
    absent: '✗',
    late: '⏰',
    excused: '📋'
  };

  return `<span class="status-icon">${icons[record.attendanceStatus] || '-'}</span>`;
}

// Quick mark attendance for individual cell
window.quickMarkAttendance = function(participantId, sessionDate, sessionName) {
  const statuses = ['present', 'absent', 'late', 'excused'];
  const statusLabels = {
    present: '✓ Present',
    absent: '✗ Absent',
    late: '⏰ Late',
    excused: '📋 Excused'
  };

  const modalContent = `
    <div class="quick-mark-modal">
      <h3>Mark Attendance</h3>
      <p><strong>Participant:</strong> ${getParticipantName(participantId)}</p>
      <p><strong>Session:</strong> ${sessionName}</p>
      <p><strong>Date:</strong> ${formatDate(sessionDate)}</p>

      <div class="status-buttons">
        ${statuses.map(status => `
          <button class="btn btn-status btn-${status}" onclick="saveQuickAttendance(${participantId}, '${sessionDate}', '${sessionName}', '${status}')">
            ${statusLabels[status]}
          </button>
        `).join('')}
      </div>

      <div class="form-group">
        <label for="attendanceNotes">Notes (optional)</label>
        <textarea id="attendanceNotes" rows="2"></textarea>
      </div>

      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      </div>
    </div>
  `;

  showModal(modalContent, 'small');
};

// Save quick attendance
window.saveQuickAttendance = async function(participantId, sessionDate, sessionName, status) {
  const notes = document.getElementById('attendanceNotes')?.value || '';

  try {
    await fetchAPI('/api/attendance', {
      method: 'POST',
      body: JSON.stringify({
        cohortId: currentCohortId,
        userId: participantId,
        sessionDate: sessionDate,
        sessionName: sessionName,
        attendanceStatus: status,
        notes: notes
      })
    });

    closeModal();
    showAttendanceTracker(currentCohortId); // Reload
    alert('Attendance marked successfully');
  } catch (error) {
    console.error('Failed to mark attendance:', error);
    alert('Failed to mark attendance');
  }
};

// Show bulk marking interface
window.showBulkMarkingInterface = function() {
  const modalContent = `
    <div class="bulk-marking-modal">
      <h3>Quick Mark Entire Session</h3>

      <form id="bulkMarkingForm">
        <div class="form-group">
          <label for="bulkSessionDate">Session Date *</label>
          <input type="date" id="bulkSessionDate" required>
        </div>

        <div class="form-group">
          <label for="bulkSessionName">Session Name *</label>
          <input type="text" id="bulkSessionName" required
                 placeholder="e.g., Week 1: Introduction">
        </div>

        <div class="form-group">
          <label>Mark All Participants As:</label>
          <div class="status-presets">
            <button type="button" class="btn btn-preset" onclick="bulkMarkAll('present')">
              ✓ All Present
            </button>
            <button type="button" class="btn btn-preset" onclick="bulkMarkAll('absent')">
              ✗ All Absent
            </button>
          </div>
        </div>

        <div class="bulk-participants-list">
          <h4>Individual Marking</h4>
          ${enrolledParticipants.map(participant => `
            <div class="bulk-participant-row">
              <span class="participant-name">
                ${participant.firstName} ${participant.lastName}
              </span>
              <select class="attendance-select" data-participant-id="${participant.id}">
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="excused">Excused</option>
              </select>
            </div>
          `).join('')}
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Attendance</button>
        </div>
      </form>
    </div>
  `;

  showModal(modalContent, 'large');

  document.getElementById('bulkMarkingForm').addEventListener('submit', handleBulkMarking);
};

// Bulk mark all participants with same status
window.bulkMarkAll = function(status) {
  const selects = document.querySelectorAll('.attendance-select');
  selects.forEach(select => {
    select.value = status;
  });
};

// Handle bulk marking form submission
async function handleBulkMarking(e) {
  e.preventDefault();

  const sessionDate = document.getElementById('bulkSessionDate').value;
  const sessionName = document.getElementById('bulkSessionName').value;

  const selects = document.querySelectorAll('.attendance-select');
  const attendanceData = Array.from(selects).map(select => ({
    userId: parseInt(select.dataset.participantId),
    status: select.value
  }));

  try {
    await fetchAPI('/api/attendance/bulk', {
      method: 'POST',
      body: JSON.stringify({
        cohortId: currentCohortId,
        sessionDate: sessionDate,
        sessionName: sessionName,
        attendanceData: attendanceData
      })
    });

    closeModal();
    showAttendanceTracker(currentCohortId); // Reload
    alert(`Attendance marked for ${attendanceData.length} participants`);
  } catch (error) {
    console.error('Failed to bulk mark attendance:', error);
    alert('Failed to mark attendance');
  }
}

// Show attendance analytics
window.showAttendanceAnalytics = async function() {
  try {
    const stats = await fetchAPI(`/api/attendance/cohort/${currentCohortId}/stats`);
    renderAttendanceAnalytics(stats);
  } catch (error) {
    console.error('Failed to load analytics:', error);
    alert('Failed to load analytics');
  }
};

// Render attendance analytics
function renderAttendanceAnalytics(stats) {
  const content = `
    <div class="attendance-analytics">
      <div class="analytics-cards">
        <div class="analytics-card">
          <h3>Overall Attendance Rate</h3>
          <div class="big-stat">${stats.overallRate || 0}%</div>
        </div>

        <div class="analytics-card">
          <h3>Total Sessions</h3>
          <div class="big-stat">${stats.totalSessions || 0}</div>
        </div>

        <div class="analytics-card">
          <h3>Average Present</h3>
          <div class="big-stat">${stats.averagePresent || 0}</div>
        </div>

        <div class="analytics-card">
          <h3>At-Risk Students</h3>
          <div class="big-stat warning">${stats.atRiskCount || 0}</div>
          <p class="card-note">Below 75% attendance</p>
        </div>
      </div>

      <div class="analytics-charts">
        <div class="chart-container">
          <h3>Attendance by Session</h3>
          <div id="sessionAttendanceChart"></div>
        </div>

        <div class="chart-container">
          <h3>Status Distribution</h3>
          <div id="statusDistributionChart"></div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('attendanceContent').innerHTML = content;
}

// Show attendance patterns
window.showAttendancePatterns = function() {
  const patterns = analyzeAttendancePatterns();
  renderAttendancePatterns(patterns);
};

// Analyze attendance patterns
function analyzeAttendancePatterns() {
  // Identify patterns: chronic absenteeism, late patterns, perfect attendance, etc.
  const patterns = {
    perfectAttendance: [],
    chronicAbsence: [],
    frequentlyLate: [],
    improving: [],
    declining: []
  };

  enrolledParticipants.forEach(participant => {
    const records = getParticipantAttendance(participant.id);
    const presentCount = records.filter(r => r.attendanceStatus === 'present').length;
    const absentCount = records.filter(r => r.attendanceStatus === 'absent').length;
    const lateCount = records.filter(r => r.attendanceStatus === 'late').length;
    const total = records.length;

    if (total === 0) return;

    const attendanceRate = (presentCount / total) * 100;

    if (attendanceRate === 100) {
      patterns.perfectAttendance.push(participant);
    } else if (attendanceRate < 60) {
      patterns.chronicAbsence.push({ ...participant, rate: attendanceRate });
    }

    if (lateCount >= 3) {
      patterns.frequentlyLate.push({ ...participant, lateCount });
    }
  });

  return patterns;
};

// Render attendance patterns
function renderAttendancePatterns(patterns) {
  const content = `
    <div class="attendance-patterns">
      <div class="pattern-section">
        <h3>🌟 Perfect Attendance (${patterns.perfectAttendance.length})</h3>
        ${patterns.perfectAttendance.length > 0 ? `
          <ul class="pattern-list">
            ${patterns.perfectAttendance.map(p => `
              <li>${p.firstName} ${p.lastName}</li>
            `).join('')}
          </ul>
        ` : '<p>No students with perfect attendance yet.</p>'}
      </div>

      <div class="pattern-section warning">
        <h3>⚠️ At-Risk Students (${patterns.chronicAbsence.length})</h3>
        <p class="section-note">Students with attendance below 60%</p>
        ${patterns.chronicAbsence.length > 0 ? `
          <ul class="pattern-list">
            ${patterns.chronicAbsence.map(p => `
              <li>
                ${p.firstName} ${p.lastName}
                <span class="attendance-rate">${Math.round(p.rate)}%</span>
              </li>
            `).join('')}
          </ul>
        ` : '<p>No at-risk students identified.</p>'}
      </div>

      <div class="pattern-section">
        <h3>⏰ Frequently Late (${patterns.frequentlyLate.length})</h3>
        <p class="section-note">Students with 3+ late arrivals</p>
        ${patterns.frequentlyLate.length > 0 ? `
          <ul class="pattern-list">
            ${patterns.frequentlyLate.map(p => `
              <li>
                ${p.firstName} ${p.lastName}
                <span class="late-count">${p.lateCount} times</span>
              </li>
            `).join('')}
          </ul>
        ` : '<p>No frequent lateness patterns identified.</p>'}
      </div>
    </div>
  `;

  document.getElementById('attendanceContent').innerHTML = content;
}

// Export attendance
window.exportAttendance = function() {
  window.location.href = `/api/attendance/cohort/${currentCohortId}/export`;
};

// Utility functions
function getParticipantName(participantId) {
  const participant = enrolledParticipants.find(p => p.id === participantId);
  return participant ? `${participant.firstName} ${participant.lastName}` : 'Unknown';
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatShortDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

function truncate(str, length) {
  return str.length > length ? str.substring(0, length) + '...' : str;
}

// Setup event listeners
function setupEventListeners() {
  // Add any global event listeners
}

export {
  showAttendanceTracker
};
