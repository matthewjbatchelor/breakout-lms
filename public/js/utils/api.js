/**
 * API Utility
 * Wrapper around fetch for consistent API calls
 */

class API {
  /**
   * Make a GET request
   * @param {string} url - API endpoint
   * @returns {Promise<Object>} Response data
   */
  static async get(url) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return await this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Make a POST request
   * @param {string} url - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise<Object>} Response data
   */
  static async post(url, data) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      return await this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Make a PUT request
   * @param {string} url - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise<Object>} Response data
   */
  static async put(url, data) {
    try {
      const response = await fetch(url, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      return await this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Make a DELETE request
   * @param {string} url - API endpoint
   * @returns {Promise<Object>} Response data
   */
  static async delete(url) {
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return await this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Upload a file
   * @param {string} url - API endpoint
   * @param {FormData} formData - Form data with file
   * @returns {Promise<Object>} Response data
   */
  static async upload(url, formData) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        body: formData // Don't set Content-Type header - browser will set it with boundary
      });

      return await this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle fetch response
   * @param {Response} response - Fetch response
   * @returns {Promise<Object>} Parsed JSON data
   */
  static async handleResponse(response) {
    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        message: data.error || 'Request failed',
        errors: data.errors || []
      };
    }

    return data;
  }

  /**
   * Handle fetch error
   * @param {Error} error - Error object
   * @returns {Object} Formatted error
   */
  static handleError(error) {
    console.error('API Error:', error);

    if (error.status) {
      return error;
    }

    return {
      status: 0,
      message: 'Network error. Please check your connection.',
      errors: []
    };
  }

  /**
   * Download a file
   * @param {string} url - Download URL
   * @param {string} filename - File name for download
   */
  static async download(url, filename) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }
}

// Export for use in other modules (Node.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API;
}

// Make globally available in browser
if (typeof window !== 'undefined') {
  window.API = API;
}
