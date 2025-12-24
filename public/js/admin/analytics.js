/**
 * Analytics Dashboard
 * View analytics and reporting for the LMS
 */

/**
 * Initialize the analytics view
 */
async function initAnalyticsView() {
  const mainContent = document.getElementById('mainContent');

  mainContent.innerHTML = `
    <div class="view-header">
      <div>
        <h1>Analytics Dashboard</h1>
        <p>Overview of LMS performance and metrics</p>
      </div>
    </div>

    <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
      <div class="stat-card">
        <div class="stat-value" id="totalProgrammes">-</div>
        <div class="stat-label">Programmes</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="totalCohorts">-</div>
        <div class="stat-label">Cohorts</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="totalParticipants">-</div>
        <div class="stat-label">Participants</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="totalEnrollments">-</div>
        <div class="stat-label">Enrollments</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="completedEnrollments">-</div>
        <div class="stat-label">Completed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="avgCompletionRate">-</div>
        <div class="stat-label">Avg Completion</div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem; margin-top: 2rem;">
      <!-- Programme Status -->
      <div class="card">
        <h3>Programme Status</h3>
        <div id="programmeStatusChart" style="margin-top: 1rem;">
          <div class="chart-item">
            <div class="chart-label">Active</div>
            <div class="chart-bar-container">
              <div class="chart-bar" id="programmeActiveBar" style="width: 0%;"></div>
            </div>
            <div class="chart-value" id="programmeActiveValue">0</div>
          </div>
          <div class="chart-item">
            <div class="chart-label">Completed</div>
            <div class="chart-bar-container">
              <div class="chart-bar" id="programmeCompletedBar" style="width: 0%;"></div>
            </div>
            <div class="chart-value" id="programmeCompletedValue">0</div>
          </div>
          <div class="chart-item">
            <div class="chart-label">Draft</div>
            <div class="chart-bar-container">
              <div class="chart-bar chart-bar-secondary" id="programmeDraftBar" style="width: 0%;"></div>
            </div>
            <div class="chart-value" id="programmeDraftValue">0</div>
          </div>
        </div>
      </div>

      <!-- Enrollment Status -->
      <div class="card">
        <h3>Enrollment Status</h3>
        <div id="enrollmentStatusChart" style="margin-top: 1rem;">
          <div class="chart-item">
            <div class="chart-label">Active</div>
            <div class="chart-bar-container">
              <div class="chart-bar" id="enrollmentActiveBar" style="width: 0%;"></div>
            </div>
            <div class="chart-value" id="enrollmentActiveValue">0</div>
          </div>
          <div class="chart-item">
            <div class="chart-label">Completed</div>
            <div class="chart-bar-container">
              <div class="chart-bar" id="enrollmentCompletedBar" style="width: 0%;"></div>
            </div>
            <div class="chart-value" id="enrollmentCompletedValue">0</div>
          </div>
          <div class="chart-item">
            <div class="chart-label">Withdrawn</div>
            <div class="chart-bar-container">
              <div class="chart-bar chart-bar-warning" id="enrollmentWithdrawnBar" style="width: 0%;"></div>
            </div>
            <div class="chart-value" id="enrollmentWithdrawnValue">0</div>
          </div>
        </div>
      </div>
    </div>

    <div style="margin-top: 2rem;">
      <div class="card">
        <h3>Recent Activity</h3>
        <div id="recentActivityList" style="margin-top: 1rem;">
          <p style="text-align: center; color: #999;">Loading...</p>
        </div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 2rem;">
      <!-- Top Programmes -->
      <div class="card">
        <h3>Top Programmes by Enrollment</h3>
        <div id="topProgrammesList" style="margin-top: 1rem;">
          <p style="text-align: center; color: #999;">Loading...</p>
        </div>
      </div>

      <!-- User Breakdown -->
      <div class="card">
        <h3>User Roles</h3>
        <div id="userRolesChart" style="margin-top: 1rem;">
          <div class="chart-item">
            <div class="chart-label">Participants</div>
            <div class="chart-bar-container">
              <div class="chart-bar" id="participantBar" style="width: 0%;"></div>
            </div>
            <div class="chart-value" id="participantValue">0</div>
          </div>
          <div class="chart-item">
            <div class="chart-label">Mentors</div>
            <div class="chart-bar-container">
              <div class="chart-bar" id="mentorBar" style="width: 0%;"></div>
            </div>
            <div class="chart-value" id="mentorValue">0</div>
          </div>
          <div class="chart-item">
            <div class="chart-label">Admins</div>
            <div class="chart-bar-container">
              <div class="chart-bar chart-bar-secondary" id="adminBar" style="width: 0%;"></div>
            </div>
            <div class="chart-value" id="adminValue">0</div>
          </div>
          <div class="chart-item">
            <div class="chart-label">Viewers</div>
            <div class="chart-bar-container">
              <div class="chart-bar chart-bar-secondary" id="viewerBar" style="width: 0%;"></div>
            </div>
            <div class="chart-value" id="viewerValue">0</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Load analytics data
  await loadDashboardData();
}

/**
 * Load dashboard analytics data
 */
async function loadDashboardData() {
  try {
    const data = await API.get('/api/analytics/dashboard');

    // Update main stats
    document.getElementById('totalProgrammes').textContent = data.totalProgrammes || 0;
    document.getElementById('totalCohorts').textContent = data.activeCohorts || 0;
    document.getElementById('totalParticipants').textContent = data.totalParticipants || 0;
    document.getElementById('totalEnrollments').textContent = data.totalEnrollments || 0;
    document.getElementById('completedEnrollments').textContent = data.completedEnrollments || 0;
    document.getElementById('avgCompletionRate').textContent =
      (data.avgCompletionRate !== null && data.avgCompletionRate !== undefined)
        ? Math.round(data.avgCompletionRate) + '%'
        : '0%';

    // Load additional data
    await Promise.all([
      loadProgrammeStats(),
      loadEnrollmentStats(),
      loadUserStats(),
      loadTopProgrammes()
    ]);

  } catch (error) {
    console.error('Error loading dashboard data:', error);
    showNotification('Failed to load analytics data', 'error');
  }
}

/**
 * Load programme statistics
 */
async function loadProgrammeStats() {
  try {
    const programmes = await API.get('/api/programmes');

    const stats = {
      active: programmes.filter(p => p.status === 'active').length,
      completed: programmes.filter(p => p.status === 'completed').length,
      draft: programmes.filter(p => p.status === 'draft').length,
      total: programmes.length
    };

    const max = Math.max(stats.active, stats.completed, stats.draft, 1);

    // Update chart
    document.getElementById('programmeActiveValue').textContent = stats.active;
    document.getElementById('programmeActiveBar').style.width = ((stats.active / max) * 100) + '%';

    document.getElementById('programmeCompletedValue').textContent = stats.completed;
    document.getElementById('programmeCompletedBar').style.width = ((stats.completed / max) * 100) + '%';

    document.getElementById('programmeDraftValue').textContent = stats.draft;
    document.getElementById('programmeDraftBar').style.width = ((stats.draft / max) * 100) + '%';

  } catch (error) {
    console.error('Error loading programme stats:', error);
  }
}

/**
 * Load enrollment statistics
 */
async function loadEnrollmentStats() {
  try {
    const enrollments = await API.get('/api/enrollments');

    const stats = {
      active: enrollments.filter(e => e.enrollmentStatus === 'active').length,
      completed: enrollments.filter(e => e.enrollmentStatus === 'completed').length,
      withdrawn: enrollments.filter(e => e.enrollmentStatus === 'withdrawn').length,
      total: enrollments.length
    };

    const max = Math.max(stats.active, stats.completed, stats.withdrawn, 1);

    // Update chart
    document.getElementById('enrollmentActiveValue').textContent = stats.active;
    document.getElementById('enrollmentActiveBar').style.width = ((stats.active / max) * 100) + '%';

    document.getElementById('enrollmentCompletedValue').textContent = stats.completed;
    document.getElementById('enrollmentCompletedBar').style.width = ((stats.completed / max) * 100) + '%';

    document.getElementById('enrollmentWithdrawnValue').textContent = stats.withdrawn;
    document.getElementById('enrollmentWithdrawnBar').style.width = ((stats.withdrawn / max) * 100) + '%';

  } catch (error) {
    console.error('Error loading enrollment stats:', error);
  }
}

/**
 * Load user statistics
 */
async function loadUserStats() {
  try {
    const users = await API.get('/api/users');

    const stats = {
      participants: users.filter(u => u.role === 'participant').length,
      mentors: users.filter(u => u.role === 'mentor').length,
      admins: users.filter(u => u.role === 'admin').length,
      viewers: users.filter(u => u.role === 'viewer').length,
      total: users.length
    };

    const max = Math.max(stats.participants, stats.mentors, stats.admins, stats.viewers, 1);

    // Update chart
    document.getElementById('participantValue').textContent = stats.participants;
    document.getElementById('participantBar').style.width = ((stats.participants / max) * 100) + '%';

    document.getElementById('mentorValue').textContent = stats.mentors;
    document.getElementById('mentorBar').style.width = ((stats.mentors / max) * 100) + '%';

    document.getElementById('adminValue').textContent = stats.admins;
    document.getElementById('adminBar').style.width = ((stats.admins / max) * 100) + '%';

    document.getElementById('viewerValue').textContent = stats.viewers;
    document.getElementById('viewerBar').style.width = ((stats.viewers / max) * 100) + '%';

    // Show recent activity
    displayRecentActivity(users);

  } catch (error) {
    console.error('Error loading user stats:', error);
  }
}

/**
 * Load top programmes
 */
async function loadTopProgrammes() {
  try {
    const programmes = await API.get('/api/programmes?stats=true');

    // Sort by participant count
    const sorted = programmes
      .sort((a, b) => (b.participantCount || 0) - (a.participantCount || 0))
      .slice(0, 5);

    const listHtml = sorted.length > 0
      ? sorted.map(p => `
          <div class="list-item">
            <div class="list-item-title">${p.name}</div>
            <div class="list-item-meta">${p.cohortCount || 0} cohorts, ${p.participantCount || 0} participants</div>
          </div>
        `).join('')
      : '<p style="text-align: center; color: #999;">No programmes found</p>';

    document.getElementById('topProgrammesList').innerHTML = listHtml;

  } catch (error) {
    console.error('Error loading top programmes:', error);
  }
}

/**
 * Display recent activity
 */
function displayRecentActivity(users) {
  // Get 5 most recent users
  const recent = users
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const activityHtml = recent.length > 0
    ? recent.map(u => `
        <div class="list-item">
          <div class="list-item-title">${u.firstName} ${u.lastName} joined as ${u.role}</div>
          <div class="list-item-meta">${formatDateTime(u.createdAt)}</div>
        </div>
      `).join('')
    : '<p style="text-align: center; color: #999;">No recent activity</p>';

  document.getElementById('recentActivityList').innerHTML = activityHtml;
}

// Make function globally available
window.initAnalyticsView = initAnalyticsView;
