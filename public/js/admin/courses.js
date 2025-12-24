/**
 * Course Management UI
 * Admin interface for managing courses and modules
 */

console.log('✅ Courses.js loaded');

var coursesTable = null;
var coursesList = [];
var coursesProgrammes = [];

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
    coursesProgrammes = await API.get('/api/programmes');
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
    coursesList = courses;

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
        <button class="btn btn-sm btn-secondary" onclick="managePrerequisites(${course.id})">🔗 Prerequisites</button>
        <button class="btn btn-sm btn-secondary" onclick="viewCourseModules(${course.id})">📑 Modules</button>
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
          ${coursesProgrammes.map(p => `
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

/**
 * Manage course prerequisites
 */
async function managePrerequisites(courseId) {
  try {
    const [course, prerequisites, dependents] = await Promise.all([
      API.get(`/api/courses/${courseId}`),
      API.get(`/api/courses/${courseId}/prerequisites`),
      API.get(`/api/courses/${courseId}/dependents`)
    ]);

    const availableCourses = coursesList.filter(c =>
      c.id !== courseId && !prerequisites.some(p => p.id === c.id)
    );

    const modal = new Modal();

    modal.show({
      title: `Prerequisites - ${course.title}`,
      size: 'large',
      content: `
        <div class="prerequisites-modal">
          <div class="prerequisites-section">
            <h3>Current Prerequisites</h3>
            ${prerequisites.length === 0 ?
              '<p class="empty-state">No prerequisites set. This course can be taken without completing other courses first.</p>' :
              `<div class="prerequisite-list">
                ${prerequisites.map(prereq => `
                  <div class="prerequisite-item">
                    <div class="prerequisite-info">
                      <h4>${prereq.title}</h4>
                      ${prereq.description ? `<p>${prereq.description}</p>` : ''}
                    </div>
                    <button class="btn btn-danger btn-sm" onclick="removePrerequisite(${courseId}, ${prereq.id})">
                      Remove
                    </button>
                  </div>
                `).join('')}
              </div>`
            }

            ${availableCourses.length > 0 ? `
              <div class="add-prerequisite" style="margin-top: 1.5rem; padding: 1rem; background: #1a1a1a; border-radius: 8px;">
                <h4 style="margin: 0 0 1rem 0; color: #b8a67d;">Add Prerequisite</h4>
                <select id="prerequisiteSelect" class="form-select" style="margin-bottom: 1rem;">
                  <option value="">Select a course...</option>
                  ${availableCourses.map(c => `
                    <option value="${c.id}">${c.title}</option>
                  `).join('')}
                </select>
                <button class="btn btn-primary" onclick="addPrerequisite(${courseId})">
                  Add Prerequisite
                </button>
              </div>
            ` : ''}
          </div>

          ${dependents.length > 0 ? `
            <div class="dependents-section" style="margin-top: 2rem;">
              <h3 style="color: #b8a67d; margin-bottom: 1rem;">Courses that Require This Course</h3>
              <p class="info-text">The following courses require "${course.title}" as a prerequisite:</p>
              <div class="dependent-list">
                ${dependents.map(dep => `
                  <div class="dependent-item" style="padding: 0.75rem 1rem; background: #2a2a2a; border-radius: 6px; border-left: 3px solid #666; margin-bottom: 0.5rem;">
                    <span class="course-title">${dep.title}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `,
      showFooter: false
    });

    // Store current course for prerequisite operations
    window.currentPrereqCourseId = courseId;
  } catch (error) {
    console.error('Failed to load prerequisites:', error);
    showNotification('Failed to load prerequisites', 'error');
  }
}

/**
 * Add prerequisite
 */
async function addPrerequisite(courseId) {
  const select = document.getElementById('prerequisiteSelect');
  const prerequisiteId = select.value;

  if (!prerequisiteId) {
    showNotification('Please select a course', 'warning');
    return;
  }

  try {
    await API.post(`/api/courses/${courseId}/prerequisites`, {
      prerequisiteCourseId: parseInt(prerequisiteId)
    });

    showNotification('Prerequisite added successfully', 'success');
    managePrerequisites(courseId); // Reload
  } catch (error) {
    console.error('Failed to add prerequisite:', error);
    showNotification(error.message || 'Failed to add prerequisite', 'error');
  }
}

/**
 * Remove prerequisite
 */
async function removePrerequisite(courseId, prerequisiteId) {
  const confirmed = await confirmDialog(
    'Remove this prerequisite? Students will no longer need to complete this course first.',
    'Remove Prerequisite'
  );

  if (!confirmed) return;

  try {
    await API.delete(`/api/courses/${courseId}/prerequisites/${prerequisiteId}`);
    showNotification('Prerequisite removed successfully', 'success');
    managePrerequisites(courseId); // Reload
  } catch (error) {
    console.error('Failed to remove prerequisite:', error);
    showNotification('Failed to remove prerequisite', 'error');
  }
}

// Make functions globally available
window.initCoursesView = initCoursesView;
window.showAddCourseModal = showAddCourseModal;
window.showEditCourseModal = showEditCourseModal;
window.viewCourseModules = viewCourseModules;
window.deleteCourse = deleteCourse;
window.managePrerequisites = managePrerequisites;
window.addPrerequisite = addPrerequisite;
window.removePrerequisite = removePrerequisite;

console.log('✅ Courses functions exported:', typeof window.initCoursesView);
