// Global variable to store current user
window.currentUser = null;

// Check session on page load
document.addEventListener('DOMContentLoaded', async () => {
  await checkSession();
  setupEventListeners();
});

// Check if user has an active session
async function checkSession() {
  try {
    const response = await fetch('/api/auth/session', {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to check session');
    }

    const data = await response.json();

    if (data.authenticated) {
      window.currentUser = data.user;
      showAppScreen();
    } else {
      showLoginScreen();
    }
  } catch (error) {
    console.error('Session check error:', error);
    showLoginScreen();
  }
}

// Setup event listeners
function setupEventListeners() {
  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Logout button
  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
  }
}

// Handle login form submission
async function handleLogin(event) {
  event.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  // Show loading state
  setLoginLoading(true);
  hideLoginError();

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    // Store user data
    window.currentUser = data.user;

    // Show success notification
    showNotification('Login successful!', 'success');

    // Switch to app screen
    showAppScreen();
  } catch (error) {
    console.error('Login error:', error);
    showLoginError(error.message);
  } finally {
    setLoginLoading(false);
  }
}

// Handle logout
async function handleLogout() {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Logout failed');
    }

    window.currentUser = null;
    showNotification('Logged out successfully', 'success');
    showLoginScreen();
  } catch (error) {
    console.error('Logout error:', error);
    showNotification('Logout failed: ' + error.message, 'error');
  }
}

// Show login screen
function showLoginScreen() {
  document.getElementById('loginScreen').classList.add('active');
  document.getElementById('appScreen').classList.remove('active');

  // Clear form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.reset();
  }
}

// Show app screen
function showAppScreen() {
  document.getElementById('loginScreen').classList.remove('active');
  document.getElementById('appScreen').classList.add('active');

  // Update user info in navbar
  updateNavbarUserInfo();

  // Populate sidebar based on role
  populateSidebar();

  // Show default dashboard
  showDashboard();
}

// Update navbar with user information
function updateNavbarUserInfo() {
  const userDisplayName = document.getElementById('userDisplayName');
  const userRole = document.getElementById('userRole');

  if (window.currentUser) {
    const fullName = [window.currentUser.firstName, window.currentUser.lastName]
      .filter(Boolean)
      .join(' ') || window.currentUser.username;

    userDisplayName.textContent = fullName;
    userRole.textContent = window.currentUser.role.toUpperCase();
    userRole.className = `role-badge role-${window.currentUser.role}`;
  }
}

// Populate sidebar based on user role
function populateSidebar() {
  const sidebar = document.getElementById('sidebar');
  const role = window.currentUser?.role;

  let menuItems = [];

  if (role === 'admin') {
    menuItems = [
      { icon: '📊', text: 'Dashboard', id: 'dashboard' },
      { icon: '📚', text: 'Programmes', id: 'programmes' },
      { icon: '👥', text: 'Cohorts', id: 'cohorts' },
      { icon: '📖', text: 'Courses', id: 'courses' },
      { icon: '👤', text: 'Users', id: 'users' },
      { icon: '✓', text: 'Enrollments', id: 'enrollments' },
      { icon: '📅', text: 'Attendance', id: 'attendance' },
      { icon: '📈', text: 'Analytics', id: 'analytics' },
      { icon: '📥', text: 'Import Data', id: 'import' }
    ];
  } else if (role === 'mentor') {
    menuItems = [
      { icon: '📊', text: 'Dashboard', id: 'dashboard' },
      { icon: '👥', text: 'My Cohorts', id: 'my-cohorts' },
      { icon: '📅', text: 'Attendance', id: 'attendance' },
      { icon: '📈', text: 'Progress', id: 'progress' }
    ];
  } else if (role === 'participant') {
    menuItems = [
      { icon: '📊', text: 'Dashboard', id: 'dashboard' },
      { icon: '📖', text: 'My Courses', id: 'my-courses' },
      { icon: '📈', text: 'My Progress', id: 'my-progress' }
    ];
  } else if (role === 'viewer') {
    menuItems = [
      { icon: '📊', text: 'Dashboard', id: 'dashboard' },
      { icon: '📈', text: 'Analytics', id: 'analytics' },
      { icon: '📄', text: 'Reports', id: 'reports' }
    ];
  }

  sidebar.innerHTML = `
    <ul class="sidebar-menu">
      ${menuItems.map(item => `
        <li>
          <a href="#" data-view="${item.id}" class="sidebar-link">
            <span class="sidebar-icon">${item.icon}</span>
            <span class="sidebar-text">${item.text}</span>
          </a>
        </li>
      `).join('')}
    </ul>
  `;

  // Add click handlers for sidebar links
  sidebar.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const viewId = e.currentTarget.dataset.view;
      loadView(viewId);
    });
  });
}

// Load a specific view
function loadView(viewId) {
  const mainContent = document.getElementById('mainContent');

  // Remove active class from all links
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.classList.remove('active');
  });

  // Add active class to current link
  const activeLink = document.querySelector(`[data-view="${viewId}"]`);
  if (activeLink) {
    activeLink.classList.add('active');
  }

  // Load the appropriate view
  switch (viewId) {
    case 'dashboard':
      showDashboard();
      break;
    case 'programmes':
      showProgrammes();
      break;
    case 'cohorts':
      showCohorts();
      break;
    case 'courses':
      showCourses();
      break;
    case 'users':
      showUsers();
      break;
    case 'enrollments':
      showEnrollments();
      break;
    case 'attendance':
      showAttendance();
      break;
    case 'analytics':
      showAnalytics();
      break;
    case 'import':
      showImport();
      break;
    default:
      showDashboard();
  }
}

// Show dashboard
function showDashboard() {
  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = `
    <div id="dashboardView">
      <h1>Welcome, ${window.currentUser.firstName || window.currentUser.username}!</h1>
      <p>Role: <strong>${window.currentUser.role.toUpperCase()}</strong></p>

      <div class="dashboard-cards">
        <div class="card">
          <h3>Getting Started</h3>
          <p>Select an option from the sidebar to manage the LMS.</p>
        </div>

        <div class="card">
          <h3>Quick Stats</h3>
          <p>Dashboard statistics will appear here.</p>
        </div>
      </div>
    </div>
  `;
}

// Placeholder functions for different views (to be implemented)
function showProgrammes() {
  if (typeof initProgrammesView === 'function') {
    initProgrammesView();
  } else {
    document.getElementById('mainContent').innerHTML = '<h1>Programmes</h1><p>Programme management coming soon...</p>';
  }
}

function showCohorts() {
  if (typeof initCohortsView === 'function') {
    initCohortsView();
  } else {
    document.getElementById('mainContent').innerHTML = '<h1>Cohorts</h1><p>Cohort management coming soon...</p>';
  }
}

function showCourses() {
  document.getElementById('mainContent').innerHTML = '<h1>Courses</h1><p>Course management coming soon...</p>';
}

function showUsers() {
  if (typeof initUsersView === 'function') {
    initUsersView();
  } else {
    document.getElementById('mainContent').innerHTML = '<h1>Users</h1><p>User management coming soon...</p>';
  }
}

function showEnrollments() {
  document.getElementById('mainContent').innerHTML = '<h1>Enrollments</h1><p>Enrollment management coming soon...</p>';
}

function showAttendance() {
  document.getElementById('mainContent').innerHTML = '<h1>Attendance</h1><p>Attendance tracking coming soon...</p>';
}

function showAnalytics() {
  document.getElementById('mainContent').innerHTML = '<h1>Analytics</h1><p>Analytics dashboard coming soon...</p>';
}

function showImport() {
  document.getElementById('mainContent').innerHTML = '<h1>Import Data</h1><p>Data import tools coming soon...</p>';
}

// Set login loading state
function setLoginLoading(isLoading) {
  const button = document.querySelector('#loginForm button[type="submit"]');
  const buttonText = document.getElementById('loginButtonText');
  const spinner = document.getElementById('loginSpinner');

  if (isLoading) {
    button.disabled = true;
    buttonText.style.display = 'none';
    spinner.style.display = 'inline-block';
  } else {
    button.disabled = false;
    buttonText.style.display = 'inline';
    spinner.style.display = 'none';
  }
}

// Show login error
function showLoginError(message) {
  const errorDiv = document.getElementById('loginError');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

// Hide login error
function hideLoginError() {
  const errorDiv = document.getElementById('loginError');
  errorDiv.style.display = 'none';
}

// Show notification toast
function showNotification(message, type = 'info') {
  const toast = document.getElementById('notificationToast');
  toast.textContent = message;
  toast.className = `notification-toast notification-${type} active`;

  setTimeout(() => {
    toast.classList.remove('active');
  }, 3000);
}
