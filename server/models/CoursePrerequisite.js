const { query } = require('../config/database');

class CoursePrerequisite {
  // Create a prerequisite relationship
  static async create(courseId, prerequisiteCourseId) {
    const result = await query(
      'INSERT INTO course_prerequisites (course_id, prerequisite_course_id) VALUES ($1, $2) RETURNING *',
      [courseId, prerequisiteCourseId]
    );
    return result.rows[0];
  }

  // Get all prerequisites for a course
  static async getPrerequisites(courseId) {
    const result = await query(`
      SELECT c.*
      FROM courses c
      INNER JOIN course_prerequisites cp ON cp.prerequisite_course_id = c.id
      WHERE cp.course_id = $1
      ORDER BY c.title
    `, [courseId]);
    return result.rows;
  }

  // Get all courses that require this course as prerequisite
  static async getDependentCourses(courseId) {
    const result = await query(`
      SELECT c.*
      FROM courses c
      INNER JOIN course_prerequisites cp ON cp.course_id = c.id
      WHERE cp.prerequisite_course_id = $1
      ORDER BY c.title
    `, [courseId]);
    return result.rows;
  }

  // Delete a prerequisite relationship
  static async delete(courseId, prerequisiteCourseId) {
    const result = await query(
      'DELETE FROM course_prerequisites WHERE course_id = $1 AND prerequisite_course_id = $2 RETURNING *',
      [courseId, prerequisiteCourseId]
    );
    return result.rows[0];
  }

  // Check if user has completed prerequisites for a course
  static async checkUserPrerequisites(userId, courseId) {
    const result = await query(`
      SELECT
        cp.prerequisite_course_id,
        c.title as prerequisite_title,
        COALESCE(pt.completion_percentage, 0) as completion_percentage,
        CASE
          WHEN pt.completion_percentage >= 100 THEN true
          ELSE false
        END as is_completed
      FROM course_prerequisites cp
      INNER JOIN courses c ON c.id = cp.prerequisite_course_id
      LEFT JOIN (
        SELECT
          e.course_id,
          AVG(
            CASE
              WHEN m.total_modules > 0 THEN (m.completed_modules::float / m.total_modules * 100)
              ELSE 0
            END
          ) as completion_percentage
        FROM enrollments e
        LEFT JOIN (
          SELECT
            course_id,
            COUNT(*) as total_modules,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_modules
          FROM progress_tracking
          WHERE user_id = $1
          GROUP BY course_id
        ) m ON m.course_id = e.course_id
        WHERE e.user_id = $1
        GROUP BY e.course_id
      ) pt ON pt.course_id = cp.prerequisite_course_id
      WHERE cp.course_id = $2
    `, [userId, courseId]);

    const prerequisites = result.rows;
    const allCompleted = prerequisites.length === 0 || prerequisites.every(p => p.is_completed);

    return {
      hasAccess: allCompleted,
      prerequisites,
      missingCount: prerequisites.filter(p => !p.is_completed).length
    };
  }
}

module.exports = CoursePrerequisite;
