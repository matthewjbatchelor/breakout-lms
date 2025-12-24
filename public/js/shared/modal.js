/**
 * Reusable Modal Component
 * Based on boardwave-profiles-v2 modal pattern
 */

class Modal {
  constructor() {
    this.modal = null;
    this.overlay = null;
  }

  /**
   * Create and show a modal
   * @param {Object} options - Modal configuration
   * @param {string} options.title - Modal title
   * @param {string} options.content - Modal HTML content
   * @param {Function} options.onSubmit - Submit callback (optional)
   * @param {Function} options.onClose - Close callback (optional)
   * @param {string} options.submitText - Submit button text (default: 'Submit')
   * @param {string} options.cancelText - Cancel button text (default: 'Cancel')
   * @param {boolean} options.showFooter - Show footer with buttons (default: true)
   * @param {string} options.size - Modal size: 'small', 'medium', 'large' (default: 'medium')
   */
  show(options) {
    const {
      title = 'Modal',
      content = '',
      onSubmit = null,
      onClose = null,
      submitText = 'Submit',
      cancelText = 'Cancel',
      showFooter = true,
      size = 'medium'
    } = options;

    // Remove existing modal if present
    this.close();

    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
        if (onClose) onClose();
      }
    });

    // Create modal
    this.modal = document.createElement('div');
    this.modal.className = `modal modal-${size}`;
    this.modal.innerHTML = `
      <div class="modal-header">
        <h2 class="modal-title">${title}</h2>
        <button type="button" class="modal-close" aria-label="Close">&times;</button>
      </div>
      <div class="modal-body">
        ${content}
      </div>
      ${showFooter ? `
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary modal-cancel">${cancelText}</button>
          <button type="button" class="btn btn-primary modal-submit">${submitText}</button>
        </div>
      ` : ''}
    `;

    this.overlay.appendChild(this.modal);
    document.body.appendChild(this.overlay);

    // Add event listeners
    const closeBtn = this.modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => {
      this.close();
      if (onClose) onClose();
    });

    if (showFooter) {
      const cancelBtn = this.modal.querySelector('.modal-cancel');
      cancelBtn.addEventListener('click', () => {
        this.close();
        if (onClose) onClose();
      });

      const submitBtn = this.modal.querySelector('.modal-submit');
      submitBtn.addEventListener('click', async () => {
        if (onSubmit) {
          const result = await onSubmit(this);
          // Only close if onSubmit returns true or doesn't return false
          if (result !== false) {
            this.close();
          }
        } else {
          this.close();
        }
      });
    }

    // Focus first input if present
    setTimeout(() => {
      const firstInput = this.modal.querySelector('input, textarea, select');
      if (firstInput) firstInput.focus();
    }, 100);

    // Handle Escape key
    this.escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.close();
        if (onClose) onClose();
      }
    };
    document.addEventListener('keydown', this.escapeHandler);

    // Animate in
    setTimeout(() => {
      this.overlay.classList.add('active');
      this.modal.classList.add('active');
    }, 10);
  }

  /**
   * Close and remove the modal
   */
  close() {
    if (this.overlay) {
      this.overlay.classList.remove('active');
      this.modal.classList.remove('active');

      setTimeout(() => {
        if (this.overlay && this.overlay.parentNode) {
          this.overlay.parentNode.removeChild(this.overlay);
        }
        this.overlay = null;
        this.modal = null;
      }, 300);
    }

    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
      this.escapeHandler = null;
    }
  }

  /**
   * Get form data from modal
   * @param {string} formSelector - Form selector (default: 'form')
   * @returns {Object} Form data as key-value pairs
   */
  getFormData(formSelector = 'form') {
    if (!this.modal) return {};

    const form = this.modal.querySelector(formSelector);
    if (!form) return {};

    const formData = new FormData(form);
    const data = {};

    for (let [key, value] of formData.entries()) {
      // Handle checkboxes
      if (form.elements[key] && form.elements[key].type === 'checkbox') {
        data[key] = form.elements[key].checked;
      } else {
        data[key] = value;
      }
    }

    return data;
  }

  /**
   * Show loading state on submit button
   * @param {boolean} loading - Whether to show loading state
   */
  setLoading(loading) {
    if (!this.modal) return;

    const submitBtn = this.modal.querySelector('.modal-submit');
    if (submitBtn) {
      submitBtn.disabled = loading;
      if (loading) {
        submitBtn.dataset.originalText = submitBtn.textContent;
        submitBtn.textContent = 'Loading...';
      } else if (submitBtn.dataset.originalText) {
        submitBtn.textContent = submitBtn.dataset.originalText;
        delete submitBtn.dataset.originalText;
      }
    }
  }

  /**
   * Show error message in modal
   * @param {string} message - Error message to display
   */
  showError(message) {
    if (!this.modal) return;

    let errorDiv = this.modal.querySelector('.modal-error');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'modal-error';
      const modalBody = this.modal.querySelector('.modal-body');
      modalBody.insertBefore(errorDiv, modalBody.firstChild);
    }

    errorDiv.textContent = message;
    errorDiv.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (errorDiv) errorDiv.style.display = 'none';
    }, 5000);
  }

  /**
   * Clear error message
   */
  clearError() {
    if (!this.modal) return;

    const errorDiv = this.modal.querySelector('.modal-error');
    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
  }
}

/**
 * Confirm dialog helper
 * @param {string} message - Confirmation message
 * @param {string} title - Dialog title (default: 'Confirm')
 * @returns {Promise<boolean>} True if confirmed, false if cancelled
 */
function confirmDialog(message, title = 'Confirm') {
  return new Promise((resolve) => {
    const modal = new Modal();
    modal.show({
      title,
      content: `<p>${message}</p>`,
      submitText: 'Confirm',
      cancelText: 'Cancel',
      size: 'small',
      onSubmit: () => {
        resolve(true);
      },
      onClose: () => {
        resolve(false);
      }
    });
  });
}

/**
 * Alert dialog helper
 * @param {string} message - Alert message
 * @param {string} title - Dialog title (default: 'Alert')
 * @returns {Promise<void>}
 */
function alertDialog(message, title = 'Alert') {
  return new Promise((resolve) => {
    const modal = new Modal();
    modal.show({
      title,
      content: `<p>${message}</p>`,
      submitText: 'OK',
      size: 'small',
      showFooter: true,
      onSubmit: () => {
        resolve();
      },
      onClose: () => {
        resolve();
      }
    });
  });
}

// Export for use in other modules (Node.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Modal, confirmDialog, alertDialog };
}

// Make globally available in browser
if (typeof window !== 'undefined') {
  window.Modal = Modal;
  window.confirmDialog = confirmDialog;
  window.alertDialog = alertDialog;
}
