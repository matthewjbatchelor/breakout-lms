/**
 * Course Management UI
 * Admin interface for managing courses and modules
 */

let coursesTable = null;
let allCourses = [];
let allProgrammes = [];

/**
 * Initialize the courses view
 */
async function initCoursesView() {
  const mainContent = document.getElementById('mainContent');

  mainContent.innerHTML = `
    <div class="view-header">
      <div>
        <h1>Courses & Modules</h1>
        <p>Manage learning content and curriculum</p>
      </div>
      <div class="view-actions">
        <button onclick="showAddCourseModal()" class="btn btn-primary">
          <span>+ Add Course</span>
        </button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value" id="totalCourses">-</div>
        <div class="stat-label">Total Courses</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="totalModules">-</div>
        <div class="stat-label">Total Modules</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="publishedCourses">-</div>
        <div class="stat-label">Published</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="draftCourses">-</div>
        <div class="stat-label">Draft</div>
      </div>
    </div>

    <div class="table-container">
      <table id="coursesTable">
        <thead>
          <tr>
            <th data-sortable="title">Course Title</th>
            <th data-sortable="programmeName">Programme</th>
            <th data-sortable="moduleCount">Modules</th>
            <th data-sortable="orderIndex">Order</th>
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
  coursesTable = new TableManager('coursesTable', {
    sortable: true,
    filterable: true,
    searchPlaceholder: 'Search courses...',
    renderRow: renderCourseRow
  });

  // Load data
  await loadProgrammes();
  await loadCourses();
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
 * Load all courses
 */
async function loadCourses() {
  try {
    const courses = await API.get('/api/courses');
    allCourses = courses;

    // Calculate stats
    const moduleCount = courses.reduce((sum, c) => sum + (c.moduleCount || 0), 0);
    const published = courses.filter(c => c.isPublished).length;

    document.getElementById('totalCourses').textContent = courses.length;
    document.getElementById('totalModules').textContent = moduleCount;
    document.getElementById('publishedCourses').textContent = published;
    document.getElementById('draftCourses').textContent = courses.length - published;

    // Set table data
    coursesTable.setData(courses);
  } catch (error) {
    console.error('Error loading courses:', error);
    showNotification('Failed to load courses', 'error');
  }
}

/**
 * Render a course row
 */
function renderCourseRow(course) {
  const tr = document.createElement('tr');

  tr.innerHTML = `
    <td>
      <div style="font-weight: 500;">${course.title || ''}</div>
      ${course.description ? `<div style="font-size: 0.75rem; color: #666;">${course.description.substring(0, 60)}...</div>` : ''}
    </td>
    <td>${course.programmeName || '-'}</td>
    <td>${course.moduleCount || 0} modules</td>
    <td>${course.orderIndex || 0}</td>
    <td>${formatDate(course.createdAt)}</td>
    <td class="col-actions">
      <div class="table-actions">
        <button class="btn btn-sm btn-secondary" onclick="viewCourseModules(${course.id})">Modules</button>
        <button class="btn btn-sm btn-primary" onclick="showEditCourseModal(${course.id})">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteCourse(${course.id})">Delete</button>
      </div>
    </td>
  `;

  return tr;
}

/**
 * Show add course modal
 */
function showAddCourseModal() {
  const modal = new Modal();

  modal.show({
    title: 'Add Course',
    size: 'medium',
    content: getCourseFormHTML(),
    submitText: 'Create Course',
    onSubmit: async (modalInstance) => {
      const formData = modalInstance.getFormData();

      // Validation
      if (!formData.title || !formData.programmeId) {
        modalInstance.showError('Please fill in all required fields');
        return false;
      }

      // Convert IDs to integers
      formData.programmeId = parseInt(formData.programmeId);
      if (formData.orderIndex) formData.orderIndex = parseInt(formData.orderIndex);
      formData.isPublished = formData.isPublished === 'on' || formData.isPublished === true;

      modalInstance.setLoading(true);

      try {
        await API.post('/api/courses', formData);
        showNotification('Course created successfully', 'success');
        await loadCourses();
        return true;
      } catch (error) {
        modalInstance.setLoading(false);
        modalInstance.showError(error.message || 'Failed to create course');
        return false;
      }
    }
  });
}

/**
 * Show edit course modal
 */
async function showEditCourseModal(courseId) {
  try {
    const course = await API.get(`/api/courses/${courseId}`);
    const modal = new Modal();

    modal.show({
      title: 'Edit Course',
      size: 'medium',
      content: getCourseFormHTML(course),
      submitText: 'Update Course',
      onSubmit: async (modalInstance) => {
        const formData = modalInstance.getFormData();

        // Validation
        if (!formData.title || !formData.programmeId) {
          modalInstance.showError('Please fill in all required fields');
          return false;
        }

        // Convert IDs to integers
        formData.programmeId = parseInt(formData.programmeId);
        if (formData.orderIndex) formData.orderIndex = parseInt(formData.orderIndex);
        formData.isPublished = formData.isPublished === 'on' || formData.isPublished === true;

        modalInstance.setLoading(true);

        try {
          await API.put(`/api/courses/${courseId}`, formData);
          showNotification('Course updated successfully', 'success');
          await loadCourses();
          return true;
        } catch (error) {
          modalInstance.setLoading(false);
          modalInstance.showError(error.message || 'Failed to update course');
          return false;
        }
      }
    });
  } catch (error) {
    showNotification('Failed to load course', 'error');
  }
}

/**
 * Get course form HTML
 */
function getCourseFormHTML(course = null) {
  const isEdit = course !== null;

  return `
    <form>
      <div class="form-group required">
        <label for="title">Course Title</label>
        <input
          type="text"
          id="title"
          name="title"
          class="form-input"
          value="${isEdit ? course.title : ''}"
          required
        >
      </div>

      <div class="form-group required">
        <label for="programmeId">Programme</label>
        <select id="programmeId" name="programmeId" class="form-select" required>
          <option value="">Select programme...</option>
          ${allProgrammes.map(p => `
            <option value="${p.id}" ${isEdit && course.programmeId === p.id ? 'selected' : ''}>
              ${p.name}
            </option>
          `).join('')}
        </select>
      </div>

      <div class="form-group">
        <label for="description">Description</label>
        <textarea
          id="description"
          name="description"
          class="form-textarea"
          rows="3"
        >${isEdit && course.description ? course.description : ''}</textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="orderIndex">Order</label>
          <input
            type="number"
            id="orderIndex"
            name="orderIndex"
            class="form-input"
            min="0"
            value="${isEdit && course.orderIndex !== null ? course.orderIndex : 0}"
          >
          <small class="form-help">Display order (0 = first)</small>
        </div>

        <div class="form-group">
          <div class="form-checkbox-group" style="margin-top: 1.8rem;">
            <input
              type="checkbox"
              id="isPublished"
              name="isPublished"
              ${isEdit && course.isPublished ? 'checked' : ''}
            >
            <label for="isPublished">Published</label>
          </div>
        </div>
      </div>
    </form>
  `;
}

/**
 * View course modules
 */
async function viewCourseModules(courseId) {
  try {
    const course = await API.get(`/api/courses/${courseId}`);
    const modules = course.modules || [];

    const modal = new Modal();
    modal.show({
      title: `Modules - ${course.title}`,
      size: 'large',
      content: `
        <div style="margin-bottom: 1rem;">
          <button onclick="showAddModuleModal(${courseId})" class="btn btn-sm btn-primary">
            + Add Module
          </button>
        </div>
        <table style="width: 100%;">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${modules.length > 0 ? modules.map(m => `
              <tr>
                <td>${m.title}</td>
                <td>${m.contentType || '-'}</td>
                <td>${m.orderIndex || 0}</td>
                <td>
                  <button class="btn btn-sm btn-primary" onclick="editModule(${m.id})">Edit</button>
                  <button class="btn btn-sm btn-danger" onclick="deleteModule(${m.id}, ${courseId})">Delete</button>
                </td>
              </tr>
            `).join('') : '<tr><td colspan="4" style="text-align: center;">No modules found</td></tr>'}
          </tbody>
        </table>
      `,
      showFooter: false
    });
  } catch (error) {
    showNotification('Failed to load modules', 'error');
  }
}

/**
 * Delete a course
 */
async function deleteCourse(courseId) {
  const confirmed = await confirmDialog(
    'Are you sure you want to delete this course? This will also delete all associated modules.',
    'Delete Course'
  );

  if (!confirmed) return;

  try {
    await API.delete(`/api/courses/${courseId}`);
    showNotification('Course deleted successfully', 'success');
    await loadCourses();
  } catch (error) {
    showNotification(error.message || 'Failed to delete course', 'error');
  }
}

// Make functions globally available
window.initCoursesView = initCoursesView;
window.showAddCourseModal = showAddCourseModal;
window.showEditCourseModal = showEditCourseModal;
window.viewCourseModules = viewCourseModules;
window.deleteCourse = deleteCourse;
