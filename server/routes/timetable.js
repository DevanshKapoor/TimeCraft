const express = require('express');
const router = express.Router();
const { authenticateToken, isProfessor } = require('../middleware/auth');
const pool = require('../config/db');


router.get('/timetable', authenticateToken, async (req, res) => {
    try {
      console.log('Timetable request received');
      console.log('User:', req.user);
      
      let query;
      const currentDate = new Date().toISOString().split('T')[0];
      console.log('Current date:', currentDate);
  
      if (req.user.role === 'student') {
        console.log('Fetching student timetable for batch:', req.user.batch);
        query = `
          SELECT 
            rt.*, 
            c.course_name, 
            c.course_code,
            cl.room_number,
            cl.building,
            u.username AS faculty_name,
            mc.modification_type, 
            mc.new_date, 
            mc.new_start_time, 
            mc.new_end_time
          FROM regular_timetable rt
          JOIN courses c ON rt.course_id = c.id
          JOIN users u ON c.professor_id = u.id
          LEFT JOIN classrooms cl ON rt.classroom_id = cl.id
          LEFT JOIN modified_classes mc ON rt.id = mc.regular_class_id
          WHERE rt.batch = ?
          AND (mc.valid_until >= ? OR mc.id IS NULL)
        `;
      } else {
        console.log('Fetching professor timetable for ID:', req.user.id);
        query = `
        SELECT 
          rt.*, 
          c.course_name, 
          c.course_code,
          rt.batch,
          cl.room_number,
          cl.building,
          mc.modification_type, 
          mc.new_date, 
          mc.new_start_time, 
          mc.new_end_time
        FROM regular_timetable rt
        JOIN courses c ON rt.course_id = c.id
        LEFT JOIN classrooms cl ON rt.classroom_id = cl.id
        LEFT JOIN modified_classes mc ON rt.id = mc.regular_class_id
        WHERE c.professor_id = ?
        AND (mc.valid_until >= ? OR mc.id IS NULL)
      `;

      }
  
      const params = req.user.role === 'student' 
        ? [req.user.batch, currentDate]
        : [req.user.id, currentDate];
  
      console.log('Executing query with params:', params);
      
      const [results] = await pool.execute(query, params);
      console.log('Query results:', results);
  
      res.json(results);
    } catch (error) {
      console.error('Error in timetable route:', error);
      res.status(500).json({ 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
  router.post('/cancel-class', authenticateToken, isProfessor, async (req, res) => {
    try {
      const { classId } = req.body;
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + (7 - validUntil.getDay()));
      

      // First, verify no scheduling conflict
      const [professorQuery] = await pool.query(`
        SELECT c.professor_id
        FROM regular_timetable rt
        JOIN courses c ON rt.course_id = c.id
        WHERE rt.id = ?
      `, [classId]);
  
      if (professorQuery.length === 0) {
        return res.status(400).json({ error: 'Invalid class' });
      }

      
      await pool.execute(
        `INSERT INTO modified_classes 
         (regular_class_id, modification_type, valid_until)
         VALUES (?, 'cancelled', ?)`,
        [classId, validUntil]
      );
  
      res.json({ message: 'Class cancelled successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });


  router.get('/class/:id', authenticateToken, async (req, res) => {
    try {
      const classId = req.params.id;
      
      const [classDetails] = await pool.query(`
        SELECT rt.*, c.course_name, cl.room_number
        FROM regular_timetable rt
        JOIN courses c ON rt.course_id = c.id
        JOIN classrooms cl ON rt.classroom_id = cl.id
        WHERE rt.id = ?
      `, [classId]);
      
      if (!classDetails) {
        return res.status(404).json({ error: 'Class not found' });
      }
      
      res.json(classDetails);
    } catch (error) {
      console.error('Error getting class details:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get available rooms
router.post('/available-rooms', authenticateToken, async (req, res) => {
    try {
      const { date, startTime, endTime } = req.body;
      
      // Get all rooms except those that are booked for the given time slot
      const [availableRooms] = await pool.query(`
        SELECT DISTINCT c.*
        FROM classrooms c
        WHERE c.id NOT IN (
          -- Regular bookings for the same day of week
          SELECT rt.classroom_id
          FROM regular_timetable rt
          WHERE DAYOFWEEK(?) = rt.day_of_week
          AND (
            (? BETWEEN rt.start_time AND rt.end_time)
            OR (? BETWEEN rt.start_time AND rt.end_time)
            OR (rt.start_time BETWEEN ? AND ?)
          )
          
          UNION
          
          -- Modified classes for the specific date
          SELECT mc.new_classroom_id
          FROM modified_classes mc
          WHERE mc.new_date = ?
          AND mc.modification_type = 'postponed'
          AND (
            (? BETWEEN mc.new_start_time AND mc.new_end_time)
            OR (? BETWEEN mc.new_start_time AND mc.new_end_time)
            OR (mc.new_start_time BETWEEN ? AND ?)
          )
        )
      `, [date, startTime, endTime, startTime, endTime, date, startTime, endTime, startTime, endTime]);
      
      res.json(availableRooms);
    } catch (error) {
      console.error('Error getting available rooms:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
});


router.post('/postpone-class', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const { classId, newDate, newStartTime, newEndTime, newClassroomId, validUntil } = req.body;
      
      // Validate input
      if (!classId || !newDate || !newStartTime || !newEndTime || !newClassroomId || !validUntil) {
        throw new Error('Missing required fields');
      }
       // First, get the professor for this class
       const [professorQuery] = await connection.query(`
        SELECT c.professor_id
        FROM regular_timetable rt
        JOIN courses c ON rt.course_id = c.id
        WHERE rt.id = ?
      `, [classId]);
      
      if (professorQuery.length === 0) {
        throw new Error('Professor not found for this class');
      }
      
      const professorId = professorQuery[0].professor_id;
      
      // Check for professor schedule conflicts
      const [professorConflicts] = await connection.query(`
        SELECT rt.id
        FROM regular_timetable rt
        JOIN courses c ON rt.course_id = c.id
        WHERE c.professor_id = ?
        AND (
          (? = rt.day_of_week AND 
           (
             (? BETWEEN rt.start_time AND rt.end_time) OR
             (? BETWEEN rt.start_time AND rt.end_time) OR
             (rt.start_time BETWEEN ? AND ?)
           )
          )
          OR
          (SELECT 1 FROM modified_classes mc 
           WHERE mc.regular_class_id = rt.id 
           AND mc.modification_type = 'postponed'
           AND mc.new_date = ?
           AND (
             (? BETWEEN mc.new_start_time AND mc.new_end_time) OR
             (? BETWEEN mc.new_start_time AND mc.new_end_time) OR
             (mc.new_start_time BETWEEN ? AND ?)
           )
          )
        )
      `, [
        professorId, 
        new Date(newDate).getDay(), 
        newStartTime, newEndTime, 
        newStartTime, newEndTime,
        newDate,
        newStartTime, newEndTime, 
        newStartTime, newEndTime
      ]);
      
      if (professorConflicts.length > 0) {
        throw new Error('Professor has a scheduling conflict during this time');
      }
      // Check if the original class exists
      const [originalClass] = await connection.query(
        'SELECT * FROM regular_timetable WHERE id = ?', 
        [classId]
      );
      
      if (originalClass.length === 0) {
        throw new Error('Original class not found');
      }
      
      // Check room availability
      const [conflicts] = await connection.query(`
        SELECT 1
        FROM regular_timetable rt
        WHERE rt.classroom_id = ?
        AND DAYOFWEEK(?) = rt.day_of_week
        AND (
          (? BETWEEN rt.start_time AND rt.end_time)
          OR (? BETWEEN rt.start_time AND rt.end_time)
          OR (rt.start_time BETWEEN ? AND ?)
        )
        UNION
        SELECT 1
        FROM modified_classes mc
        WHERE mc.new_classroom_id = ?
        AND mc.new_date = ?
        AND (
          (? BETWEEN mc.new_start_time AND mc.new_end_time)
          OR (? BETWEEN mc.new_start_time AND mc.new_end_time)
          OR (mc.new_start_time BETWEEN ? AND ?)
        )
      `, [
        newClassroomId, newDate, 
        newStartTime, newEndTime, 
        newStartTime, newEndTime,
        newClassroomId, newDate, 
        newStartTime, newEndTime, 
        newStartTime, newEndTime
      ]);
      
      if (conflicts.length > 0) {
        throw new Error('Selected room is not available for the chosen time slot');
      }
      
      // Insert postponement record
      await connection.query(`
        INSERT INTO modified_classes (
          regular_class_id,
          modification_type,
          new_date,
          new_start_time,
          new_end_time,
          new_classroom_id,
          valid_until
        ) VALUES (?, 'postponed', ?, ?, ?, ?, ?)
      `, [classId, newDate, newStartTime, newEndTime, newClassroomId, validUntil]);
      
      await connection.commit();
      res.json({ message: 'Class successfully postponed' });
    } catch (error) {
      await connection.rollback();
      console.error('Error postponing class:', error);
      res.status(400).json({ error: error.message });
    } finally {
      connection.release();
    }
  });
  router.post('/confirm-postpone', authenticateToken, isProfessor, async (req, res) => {
    try {
      const { classId, newDate, newStartTime, newEndTime, newClassroomId } = req.body;
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + (7 - validUntil.getDay()));
  
      await pool.execute(
        `INSERT INTO modified_classes 
         (regular_class_id, modification_type, new_date, new_start_time, 
          new_end_time, new_classroom_id, valid_until)
         VALUES (?, 'postponed', ?, ?, ?, ?, ?)`,
        [classId, newDate, newStartTime, newEndTime, newClassroomId, validUntil]
      );
  
      res.json({ message: 'Class postponed successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  module.exports = router;