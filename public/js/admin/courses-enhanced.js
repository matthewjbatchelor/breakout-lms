// Enhanced Course Management with Prerequisites
import { fetchAPI } from '../utils/api.js';
import { showModal, closeModal } from '../shared/modal.js';

let currentCourseId = null;
let allCourses = [];

// Initialize enhanced course management
export async function initCoursesEnhanced() {
  await loadCourses();
  setupEventListeners();
}

// Load all courses
async function loadCourses() {
  try {
    allCourses = await fetchAPI('/api/courses');
    displayCourses(allCourses);
  } catch (error) {
    console.error('Failed to load courses:', error);
    alert('Failed to load courses');
  }
}

// Display courses
function displayCourses(courses) {
  const container = document.getElementById('coursesContainer');
  if (!container) return;

  if (courses.length === 0) {
    container.innerHTML = '<p class="empty-state">No courses found. Create one to get started.</p>';
    return;
  }

  container.innerHTML = courses.map(course => `
    <div class="course-card" data-course-id="${course.id}">
      <div class="course-header">
        <h3>${course.title}</h3>
        <span class="course-status">${course.status || 'draft'}</span>
      </div>

      ${course.description ? `<p class="course-description">${course.description}</p>` : ''}

      <div class="course-meta">
        <span>📚 ${course.moduleCount || 0} modules</span>
        <span>⏱️ ${course.durationHours || 0} hours</span>
      </div>

      <div class="course-actions">
        <button class="btn btn-primary" onclick="managePrerequisites(${course.id})">
          🔗 Prerequisites
        </button>
        <button class="btn btn-secondary" onclick="viewCourseModules(${course.id})">
          📑 Modules
        </button>
        <button class="btn btn-secondary" onclick="editCourse(${course.id})">
          ✏️ Edit
        </button>
      </div>
    </div>
  `).join('');
}

// Manage course prerequisites
window.managePrerequisites = async function(courseId) {
  currentCourseId = courseId;

  try {
    const [course, prerequisites, dependents] = await Promise.all([
      fetchAPI(`/api/courses/${courseId}`),
      fetchAPI(`/api/courses/${courseId}/prerequisites`),
      fetchAPI(`/api/courses/${courseId}/dependents`)
    ]);

    showPrerequisitesModal(course, prerequisites, dependents);
  } catch (error) {
    console.error('Failed to load prerequisites:', error);
    alert('Failed to load prerequisites');
  }
};

// Show prerequisites management modal
function showPrerequisitesModal(course, prerequisites, dependents) {
  const availableCourses = allCourses.filter(c =>
    c.id !== course.id && !prerequisites.some(p => p.id === c.id)
  );

  const modalContent = `
    <div class="prerequisites-modal">
      <div class="modal-header">
        <h2>Prerequisites for "${course.title}"</h2>
      </div>

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
                <button class="btn btn-danger btn-sm" onclick="removePrerequisite(${prereq.id})">
                  Remove
                </button>
              </div>
            `).join('')}
          </div>`
        }

        ${availableCourses.length > 0 ? `
          <div class="add-prerequisite">
            <h4>Add Prerequisite</h4>
            <select id="prerequisiteSelect" class="form-control">
              <option value="">Select a course...</option>
              ${availableCourses.map(c => `
                <option value="${c.id}">${c.title}</option>
              `).join('')}
            </select>
            <button class="btn btn-primary" onclick="addPrerequisite()">
              Add Prerequisite
            </button>
          </div>
        ` : ''}
      </div>

      ${dependents.length > 0 ? `
        <div class="dependents-section">
          <h3>Courses that Require This Course</h3>
          <p class="info-text">The following courses require "${course.title}" as a prerequisite:</p>
          <div class="dependent-list">
            ${dependents.map(dep => `
              <div class="dependent-item">
                <span class="course-title">${dep.title}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeModal()">Close</button>
      </div>
    </div>
  `;

  showModal(modalContent, 'large');
}

// Add prerequisite
window.addPrerequisite = async function() {
  const select = document.getElementById('prerequisiteSelect');
  const prerequisiteId = select.value;

  if (!prerequisiteId) {
    alert('Please select a course');
    return;
  }

  try {
    await fetchAPI(`/api/courses/${currentCourseId}/prerequisites`, {
      method: 'POST',
      body: JSON.stringify({ prerequisiteCourseId: parseInt(prerequisiteId) })
    });

    managePrerequisites(currentCourseId); // Reload
    alert('Prerequisite added successfully');
  } catch (error) {
    console.error('Failed to add prerequisite:', error);
    alert(error.message || 'Failed to add prerequisite');
  }
};

// Remove prerequisite
window.removePrerequisite = async function(prerequisiteId) {
  if (!confirm('Remove this prerequisite? Students will no longer need to complete this course first.')) {
    return;
  }

  try {
    await fetchAPI(`/api/courses/${currentCourseId}/prerequisites/${prerequisiteId}`, {
      method: 'DELETE'
    });

    managePrerequisites(currentCourseId); // Reload
    alert('Prerequisite removed successfully');
  } catch (error) {
    console.error('Failed to remove prerequisite:', error);
    alert('Failed to remove prerequisite');
  }
};

// View course modules
window.viewCourseModules = async function(courseId) {
  try {
    const course = await fetchAPI(`/api/courses/${courseId}`);
    showModulesModal(course);
  } catch (error) {
    console.error('Failed to load course modules:', error);
    alert('Failed to load modules');
  }
};

// Show modules modal
function showModulesModal(course) {
  const modules = course.modules || [];

  const modalContent = `
    <div class="modules-modal">
      <div class="modal-header">
        <h2>Modules in "${course.title}"</h2>
        <button class="btn btn-primary" onclick="showAddModuleForm(${course.id})">
          ➕ Add Module
        </button>
      </div>

      <div class="modules-list">
        ${modules.length === 0 ?
          '<p class="empty-state">No modules yet. Add a module to start building course content.</p>' :
          renderModulesList(modules)
        }
      </div>
    </div>
  `;

  showModal(modalContent, 'large');
}

// Render modules list with sequencing
function renderModulesList(modules) {
  const sorted = modules.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

  return `
    <div class="module-sequence">
      ${sorted.map((module, index) => `
        <div class="module-item" data-module-id="${module.id}">
          <div class="module-sequence-number">${index + 1}</div>
          <div class="module-details">
            <h4>${module.title}</h4>
            <div class="module-meta">
              <span class="module-type">${module.moduleType}</span>
              ${module.durationMinutes ? `<span>⏱️ ${module.durationMinutes} min</span>` : ''}
              ${module.isRequired ? '<span class="badge badge-required">Required</span>' : ''}
            </div>
            ${module.description ? `<p>${module.description}</p>` : ''}
          </div>
          <div class="module-actions">
            <button class="btn btn-sm" onclick="moveModuleUp(${module.id})" ${index === 0 ? 'disabled' : ''}>
              ↑
            </button>
            <button class="btn btn-sm" onclick="moveModuleDown(${module.id})" ${index === sorted.length - 1 ? 'disabled' : ''}>
              ↓
            </button>
            <button class="btn btn-sm btn-secondary" onclick="editModule(${module.id})">
              ✏️ Edit
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteModule(${module.id})">
              🗑️
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Module sequencing functions
window.moveModuleUp = async function(moduleId) {
  // Implementation for reordering modules
  console.log('Move module up:', moduleId);
  // Would update module sequence and reload
};

window.moveModuleDown = async function(moduleId) {
  // Implementation for reordering modules
  console.log('Move module down:', moduleId);
  // Would update module sequence and reload
};

// Setup event listeners
function setupEventListeners() {
  const addCourseBtn = document.getElementById('addCourseBtn');
  if (addCourseBtn) {
    addCourseBtn.addEventListener('click', () => {
      // Show add course modal
      window.location.hash = '#courses';
    });
  }
}

// Export functions
export {
  managePrerequisites,
  viewCourseModules
};
