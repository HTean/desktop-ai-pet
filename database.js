// database.js
// Local SQLite database for Desktop AI Pet

const { DatabaseSync } = require('node:sqlite');
const path = require('path');

let db = null;


// =====================================================
// Format JavaScript Date → local datetime string
// Example: 2026-08-11T18:00
// =====================================================

function formatLocalDateTime(date) {

  const pad = (number) =>
    String(number).padStart(2, '0');

  return (
    date.getFullYear() +
    '-' +
    pad(date.getMonth() + 1) +
    '-' +
    pad(date.getDate()) +
    'T' +
    pad(date.getHours()) +
    ':' +
    pad(date.getMinutes())
  );
}


// =====================================================
// Calculate next recurring due date
// =====================================================

function getNextDueAt(dueAt, recurrence) {

  if (!dueAt || recurrence === 'none') {
    return null;
  }

  const date = new Date(dueAt);

  if (Number.isNaN(date.getTime())) {
    return null;
  }


  // Daily
  if (recurrence === 'daily') {

    date.setDate(
      date.getDate() + 1
    );
  }


  // Weekly
  else if (recurrence === 'weekly') {

    date.setDate(
      date.getDate() + 7
    );
  }


  // Monthly
  else if (recurrence === 'monthly') {

    const originalDay =
      date.getDate();

    // Move to day 1 first to prevent overflow
    date.setDate(1);

    date.setMonth(
      date.getMonth() + 1
    );

    // Last valid day of target month
    const lastDay =
      new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0
      ).getDate();

    date.setDate(
      Math.min(originalDay, lastDay)
    );
  }


  else {

    return null;
  }


  return formatLocalDateTime(date);
}


// =====================================================
// Initialize database
// =====================================================

function initDatabase(userDataPath) {

  const dbPath =
    path.join(
      userDataPath,
      'pet.db'
    );


  // Open database
  db = new DatabaseSync(dbPath);


  // Create table for new installations
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (

      id INTEGER PRIMARY KEY AUTOINCREMENT,

      title TEXT NOT NULL,

      description TEXT,

      due_at TEXT,

      priority TEXT DEFAULT 'normal',

      status TEXT DEFAULT 'pending',

      recurrence TEXT DEFAULT 'none',

      created_at TEXT DEFAULT CURRENT_TIMESTAMP,

      completed_at TEXT
    )
  `);


  // ===================================================
  // Migration for existing databases
  // Existing users already have tasks table without
  // recurrence column.
  // ===================================================

  const columns =
    db.prepare(
      `PRAGMA table_info(tasks)`
    ).all();


  const hasRecurrence =
    columns.some(
      column =>
        column.name === 'recurrence'
    );


  if (!hasRecurrence) {

    db.exec(`
      ALTER TABLE tasks
      ADD COLUMN recurrence TEXT DEFAULT 'none'
    `);

    console.log(
      'Database migrated: recurrence column added'
    );
  }


  console.log(
    'Database ready:',
    dbPath
  );
}


// =====================================================
// Add task
// =====================================================

function addTask(
  title,
  description = null,
  dueAt = null,
  priority = 'normal',
  recurrence = 'none'
) {

  const statement =
    db.prepare(`
      INSERT INTO tasks (
        title,
        description,
        due_at,
        priority,
        recurrence
      )
      VALUES (?, ?, ?, ?, ?)
    `);


  const result =
    statement.run(
      title,
      description,
      dueAt,
      priority,
      recurrence
    );


  return {

    id: Number(
      result.lastInsertRowid
    ),

    title,

    description,

    due_at: dueAt,

    priority,

    recurrence,

    status: 'pending'
  };
}


// =====================================================
// Get all tasks
// =====================================================

function getTasks() {

  const statement =
    db.prepare(`
      SELECT *
      FROM tasks
      ORDER BY
        status ASC,
        due_at ASC,
        created_at DESC
    `);

  return statement.all();
}


// =====================================================
// Update task
// =====================================================

function updateTask(
  id,
  title,
  description = null,
  dueAt = null,
  priority = 'normal',
  recurrence = 'none'
) {

  const statement =
    db.prepare(`
      UPDATE tasks
      SET
        title = ?,
        description = ?,
        due_at = ?,
        priority = ?,
        recurrence = ?
      WHERE id = ?
    `);


  const result =
    statement.run(
      title,
      description,
      dueAt,
      priority,
      recurrence,
      id
    );


  return result.changes > 0;
}


// =====================================================
// Complete task
// =====================================================

function completeTask(id) {

  // First get the current task
  const task =
    db.prepare(`
      SELECT *
      FROM tasks
      WHERE id = ?
    `).get(id);


  if (!task) {
    return false;
  }


  db.exec('BEGIN');


  try {

    // Mark current occurrence completed
    const result =
      db.prepare(`
        UPDATE tasks
        SET
          status = 'completed',
          completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(id);


    if (result.changes === 0) {

      db.exec('ROLLBACK');

      return false;
    }


    // ===============================================
    // Recurring task
    // Create next occurrence
    // ===============================================

    if (
      task.recurrence &&
      task.recurrence !== 'none' &&
      task.due_at
    ) {

      const nextDueAt =
        getNextDueAt(
          task.due_at,
          task.recurrence
        );


      if (nextDueAt) {

        db.prepare(`
          INSERT INTO tasks (
            title,
            description,
            due_at,
            priority,
            recurrence
          )
          VALUES (?, ?, ?, ?, ?)
        `).run(
          task.title,
          task.description,
          nextDueAt,
          task.priority,
          task.recurrence
        );
      }
    }


    db.exec('COMMIT');

    return true;

  } catch (error) {

    db.exec('ROLLBACK');

    throw error;
  }
}


// =====================================================
// Delete task
// =====================================================

function deleteTask(id) {

  const statement =
    db.prepare(`
      DELETE FROM tasks
      WHERE id = ?
    `);


  const result =
    statement.run(id);


  return result.changes > 0;
}


// =====================================================
// Export database functions
// =====================================================

module.exports = {
  initDatabase,
  addTask,
  getTasks,
  updateTask,
  completeTask,
  deleteTask
};