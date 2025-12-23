/**
 * User Management UI
 * Admin interface for managing users
 */

let usersTable = null;
let allUsers = [];
let currentRoleFilter = 'all';

/**
 * Initialize the users view
 */
async function initUsersView() {
  const mainContent = document.getElementById('mainContent');

  mainContent.innerHTML = `
    <div class="view-header">
      <div>
        <h1>Users</h1>
        <p>Manage system users and access control</p>
      </div>
      <div class="view-actions">
        <button onclick="showAddUserModal()" class="btn btn-primary">
          <span>+ Add User</span>
        </button>
      </div>
    </div>

    <div class="stats-grid" id="usersStats">
      <div class="stat-card">
        <div class="stat-value" id="totalUsers">-</div>
        <div class="stat-label">Total Users</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="activeUsers">-</div>
        <div class="stat-label">Active Users</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="adminCount">-</div>
        <div class="stat-label">Administrators</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="participantCount">-</div>
        <div class="stat-label">Participants</div>
      </div>
    </div>

    <div class="filter-tabs">
      <button class="filter-tab active" data-role="all" onclick="filterUsersByRole('all')">
        All <span class="count" id="countAll">0</span>
      </button>
      <button class="filter-tab" data-role="admin" onclick="filterUsersByRole('admin')">
        Admin <span class="count" id="countAdmin">0</span>
      </button>
      <button class="filter-tab" data-role="mentor" onclick="filterUsersByRole('mentor')">
        Mentor <span class="count" id="countMentor">0</span>
      </button>
      <button class="filter-tab" data-role="participant" onclick="filterUsersByRole('participant')">
        Participant <span class="count" id="countParticipant">0</span>
      </button>
      <button class="filter-tab" data-role="viewer" onclick="filterUsersByRole('viewer')">
        Viewer <span class="count" id="countViewer">0</span>
      </button>
    </div>

    <div class="table-container">
      <table id="usersTable">
        <thead>
          <tr>
            <th data-sortable="firstName">Name</th>
            <th data-sortable="email">Email</th>
            <th data-sortable="role">Role</th>
            <th data-sortable="organization">Organization</th>
            <th data-sortable="isActive">Status</th>
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
  usersTable = new TableManager('usersTable', {
    sortable: true,
    filterable: true,
    searchPlaceholder: 'Search users...',
    renderRow: renderUserRow
  });

  // Load users
  await loadUsers();
}

/**
 * Load all users
 */
async function loadUsers() {
  try {
    const users = await API.get('/api/users');
    allUsers = users;

    // Update stats
    const stats = calculateUserStats(users);
    document.getElementById('totalUsers').textContent = stats.total;
    document.getElementById('activeUsers').textContent = stats.active;
    document.getElementById('adminCount').textContent = stats.admin;
    document.getElementById('participantCount').textContent = stats.participant;

    // Update filter counts
    document.getElementById('countAll').textContent = stats.total;
    document.getElementById('countAdmin').textContent = stats.admin;
    document.getElementById('countMentor').textContent = stats.mentor;
    document.getElementById('countParticipant').textContent = stats.participant;
    document.getElementById('countViewer').textContent = stats.viewer;

    // Set table data
    usersTable.setData(users);
  } catch (error) {
    console.error('Error loading users:', error);
    showNotification('Failed to load users', 'error');
  }
}

/**
 * Calculate user statistics
 */
function calculateUserStats(users) {
  return {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    admin: users.filter(u => u.role === 'admin').length,
    mentor: users.filter(u => u.role === 'mentor').length,
    participant: users.filter(u => u.role === 'participant').length,
    viewer: users.filter(u => u.role === 'viewer').length
  };
}

/**
 * Filter users by role
 */
function filterUsersByRole(role) {
  currentRoleFilter = role;

  // Update active tab
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.dataset.role === role) {
      tab.classList.add('active');
    }
  });

  // Filter data
  let filteredData = allUsers;
  if (role !== 'all') {
    filteredData = allUsers.filter(u => u.role === role);
  }

  usersTable.setData(filteredData);
}

/**
 * Render a user row
 */
function renderUserRow(user) {
  const tr = document.createElement('tr');

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username;

  tr.innerHTML = `
    <td>
      <div style="font-weight: 500;">${fullName}</div>
      <div style="font-size: 0.75rem; color: #666;">@${user.username}</div>
    </td>
    <td>${user.email || '-'}</td>
    <td><span class="role-badge role-${user.role}">${user.role.toUpperCase()}</span></td>
    <td>${user.organization || '-'}</td>
    <td>
      <span class="status-badge ${user.isActive ? 'active' : 'inactive'}">
        ${user.isActive ? 'Active' : 'Inactive'}
      </span>
    </td>
    <td>${formatDate(user.createdAt)}</td>
    <td class="col-actions">
      <div class="table-actions">
        <button class="btn btn-sm btn-primary" onclick="showEditUserModal(${user.id})">Edit</button>
        <button class="btn btn-sm btn-secondary" onclick="toggleUserActive(${user.id}, ${user.isActive})">
          ${user.isActive ? 'Deactivate' : 'Activate'}
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">Delete</button>
      </div>
    </td>
  `;

  return tr;
}

/**
 * Show add user modal
 */
function showAddUserModal() {
  const modal = new Modal();

  modal.show({
    title: 'Add User',
    size: 'medium',
    content: getUserFormHTML(),
    submitText: 'Create User',
    onSubmit: async (modalInstance) => {
      const formData = modalInstance.getFormData();

      // Validation
      if (!formData.username || !formData.email || !formData.password || !formData.role) {
        modalInstance.showError('Please fill in all required fields');
        return false;
      }

      // Convert isActive to boolean
      formData.isActive = formData.isActive === 'on' || formData.isActive === true;

      modalInstance.setLoading(true);

      try {
        await API.post('/api/users', formData);
        showNotification('User created successfully', 'success');
        await loadUsers();
        return true;
      } catch (error) {
        modalInstance.setLoading(false);
        modalInstance.showError(error.message || 'Failed to create user');
        return false;
      }
    }
  });
}

/**
 * Show edit user modal
 */
async function showEditUserModal(userId) {
  try {
    const user = await API.get(`/api/users/${userId}`);
    const modal = new Modal();

    modal.show({
      title: 'Edit User',
      size: 'medium',
      content: getUserFormHTML(user),
      submitText: 'Update User',
      onSubmit: async (modalInstance) => {
        const formData = modalInstance.getFormData();

        // Validation
        if (!formData.username || !formData.email || !formData.role) {
          modalInstance.showError('Please fill in all required fields');
          return false;
        }

        // Convert isActive to boolean
        formData.isActive = formData.isActive === 'on' || formData.isActive === true;

        // Remove password if empty (not changing)
        if (!formData.password) {
          delete formData.password;
        }

        modalInstance.setLoading(true);

        try {
          await API.put(`/api/users/${userId}`, formData);
          showNotification('User updated successfully', 'success');
          await loadUsers();
          return true;
        } catch (error) {
          modalInstance.setLoading(false);
          modalInstance.showError(error.message || 'Failed to update user');
          return false;
        }
      }
    });
  } catch (error) {
    showNotification('Failed to load user', 'error');
  }
}

/**
 * Get user form HTML
 */
function getUserFormHTML(user = null) {
  const isEdit = user !== null;

  return `
    <form>
      <div class="form-row">
        <div class="form-group required">
          <label for="firstName">First Name</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            class="form-input"
            value="${isEdit && user.firstName ? user.firstName : ''}"
          >
        </div>

        <div class="form-group required">
          <label for="lastName">Last Name</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            class="form-input"
            value="${isEdit && user.lastName ? user.lastName : ''}"
          >
        </div>
      </div>

      <div class="form-row">
        <div class="form-group required">
          <label for="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            class="form-input"
            value="${isEdit ? user.username : ''}"
            ${isEdit ? 'readonly' : ''}
            required
          >
          ${isEdit ? '<small class="form-help">Username cannot be changed</small>' : ''}
        </div>

        <div class="form-group required">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            class="form-input"
            value="${isEdit ? user.email : ''}"
            required
          >
        </div>
      </div>

      <div class="form-row">
        <div class="form-group ${isEdit ? '' : 'required'}">
          <label for="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            class="form-input"
            ${isEdit ? '' : 'required'}
          >
          ${isEdit ? '<small class="form-help">Leave blank to keep current password</small>' : ''}
        </div>

        <div class="form-group required">
          <label for="role">Role</label>
          <select id="role" name="role" class="form-select" required>
            <option value="">Select role...</option>
            <option value="admin" ${isEdit && user.role === 'admin' ? 'selected' : ''}>Admin</option>
            <option value="mentor" ${isEdit && user.role === 'mentor' ? 'selected' : ''}>Mentor</option>
            <option value="participant" ${isEdit && user.role === 'participant' ? 'selected' : ''}>Participant</option>
            <option value="viewer" ${isEdit && user.role === 'viewer' ? 'selected' : ''}>Viewer</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="organization">Organization</label>
          <input
            type="text"
            id="organization"
            name="organization"
            class="form-input"
            value="${isEdit && user.organization ? user.organization : ''}"
          >
        </div>

        <div class="form-group">
          <label for="jobTitle">Job Title</label>
          <input
            type="text"
            id="jobTitle"
            name="jobTitle"
            class="form-input"
            value="${isEdit && user.jobTitle ? user.jobTitle : ''}"
          >
        </div>
      </div>

      <div class="form-group">
        <label for="phone">Phone</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          class="form-input"
          value="${isEdit && user.phone ? user.phone : ''}"
        >
      </div>

      <div class="form-group">
        <div class="form-checkbox-group">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            ${isEdit && user.isActive ? 'checked' : (!isEdit ? 'checked' : '')}
          >
          <label for="isActive">Active User</label>
        </div>
        <small class="form-help">Inactive users cannot log in</small>
      </div>
    </form>
  `;
}

/**
 * Toggle user active status
 */
async function toggleUserActive(userId, currentStatus) {
  const action = currentStatus ? 'deactivate' : 'activate';
  const confirmed = await confirmDialog(
    `Are you sure you want to ${action} this user?`,
    `${action.charAt(0).toUpperCase() + action.slice(1)} User`
  );

  if (!confirmed) return;

  try {
    await API.put(`/api/users/${userId}/active`, { isActive: !currentStatus });
    showNotification(`User ${action}d successfully`, 'success');
    await loadUsers();
  } catch (error) {
    showNotification(error.message || `Failed to ${action} user`, 'error');
  }
}

/**
 * Delete a user
 */
async function deleteUser(userId) {
  const confirmed = await confirmDialog(
    'Are you sure you want to delete this user? This action cannot be undone.',
    'Delete User'
  );

  if (!confirmed) return;

  try {
    await API.delete(`/api/users/${userId}`);
    showNotification('User deleted successfully', 'success');
    await loadUsers();
  } catch (error) {
    showNotification(error.message || 'Failed to delete user', 'error');
  }
}

// Make functions globally available
window.initUsersView = initUsersView;
window.showAddUserModal = showAddUserModal;
window.showEditUserModal = showEditUserModal;
window.toggleUserActive = toggleUserActive;
window.deleteUser = deleteUser;
window.filterUsersByRole = filterUsersByRole;
