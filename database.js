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
// Calculate next recurring reminder time
// Keep the same offset from task time
// =====================================================

function getNextReminderAt(
  currentDueAt,
  currentRemindAt,
  nextDueAt
) {

  if (
    !currentDueAt ||
    !currentRemindAt ||
    !nextDueAt
  ) {
    return null;
  }

  const currentDue =
    new Date(currentDueAt);

  const currentReminder =
    new Date(currentRemindAt);

  const nextDue =
    new Date(nextDueAt);

  if (
    Number.isNaN(currentDue.getTime()) ||
    Number.isNaN(currentReminder.getTime()) ||
    Number.isNaN(nextDue.getTime())
  ) {
    return null;
  }


  // Example:
  // Task = 15:00
  // Reminder = 14:45
  // Offset = 15 minutes
  const offset =
    currentDue.getTime() -
    currentReminder.getTime();


  const nextReminder =
    new Date(
      nextDue.getTime() - offset
    );


  return formatLocalDateTime(
    nextReminder
  );
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

  db.exec('PRAGMA foreign_keys = ON');


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

    // =====================================================
    // Create reminders table
    // =====================================================

    db.exec(`
    CREATE TABLE IF NOT EXISTS reminders (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    task_id INTEGER NOT NULL,

    remind_at TEXT NOT NULL,

    status TEXT DEFAULT 'pending',

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    fired_at TEXT,

    FOREIGN KEY (task_id)
        REFERENCES tasks(id)
        ON DELETE CASCADE
    )
    `);

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

  // Get current task
  const task =
    db.prepare(`
      SELECT *
      FROM tasks
      WHERE id = ?
    `).get(id);


  if (!task) {
    return false;
  }


  // Get current pending reminder before changing anything
  const currentReminder =
    db.prepare(`
      SELECT *
      FROM reminders
      WHERE
        task_id = ?
        AND status = 'pending'
      ORDER BY id DESC
      LIMIT 1
    `).get(id);


  db.exec('BEGIN');


  try {

    // Mark current task completed
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
    // Recurring task → create next occurrence
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

        const nextTaskResult =
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


        const nextTaskId =
          Number(
            nextTaskResult.lastInsertRowid
          );


        // ===========================================
        // Copy reminder to next recurring task
        // ===========================================

        if (currentReminder) {

          const nextRemindAt =
            getNextReminderAt(
              task.due_at,
              currentReminder.remind_at,
              nextDueAt
            );


          if (nextRemindAt) {

            db.prepare(`
              INSERT INTO reminders (
                task_id,
                remind_at
              )
              VALUES (?, ?)
            `).run(
              nextTaskId,
              nextRemindAt
            );
          }
        }
      }
    }


    // ===============================================
    // Current task is finished:
    // delete any remaining pending reminder
    // ===============================================

    db.prepare(`
    DELETE FROM reminders
    WHERE task_id = ?
    `).run(id);


    db.exec('COMMIT');

    return true;

  } catch (error) {

    db.exec('ROLLBACK');

    throw error;
  }
}

// =====================================================
// Add reminder
// =====================================================

function addReminder(
  taskId,
  remindAt
) {

  const statement =
    db.prepare(`
      INSERT INTO reminders (
        task_id,
        remind_at
      )
      VALUES (?, ?)
    `);

  const result =
    statement.run(
      taskId,
      remindAt
    );

  return {
    id: Number(result.lastInsertRowid),
    task_id: taskId,
    remind_at: remindAt,
    status: 'pending'
  };
}


// =====================================================
// Get pending reminders
// =====================================================

function getPendingReminders() {

  const statement =
    db.prepare(`
      SELECT
        reminders.*,
        tasks.title AS task_title,
        tasks.description AS task_description

      FROM reminders

      JOIN tasks
        ON tasks.id = reminders.task_id

      WHERE reminders.status = 'pending'

      ORDER BY reminders.remind_at ASC
    `);

  return statement.all();
}

// =====================================================
// Get active reminder for one task
// =====================================================

function getReminderForTask(taskId) {

  const statement =
    db.prepare(`
      SELECT *
      FROM reminders
      WHERE
        task_id = ?
        AND status = 'pending'
      ORDER BY id DESC
      LIMIT 1
    `);

  return statement.get(taskId) || null;
}


// =====================================================
// Update reminder
// =====================================================

function updateReminder(
  id,
  remindAt
) {

  const statement =
    db.prepare(`
      UPDATE reminders
      SET
        remind_at = ?,
        status = 'pending',
        fired_at = NULL
      WHERE id = ?
    `);

  const result =
    statement.run(
      remindAt,
      id
    );

  return result.changes > 0;
}


// =====================================================
// Delete reminder
// =====================================================

function deleteReminder(id) {

  const statement =
    db.prepare(`
      DELETE FROM reminders
      WHERE id = ?
    `);

  const result =
    statement.run(id);

  return result.changes > 0;
}

// =====================================================
// Mark reminder fired
// =====================================================

function markReminderFired(id) {

  const statement =
    db.prepare(`
      UPDATE reminders
      SET
        status = 'fired',
        fired_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

  const result =
    statement.run(id);

  return result.changes > 0;
}


// =====================================================
// Snooze reminder
// =====================================================

function snoozeReminder(
  id,
  remindAt
) {

  const statement =
    db.prepare(`
      UPDATE reminders
      SET
        remind_at = ?,
        status = 'pending',
        fired_at = NULL
      WHERE id = ?
    `);

  const result =
    statement.run(
      remindAt,
      id
    );

  return result.changes > 0;
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
    deleteTask,

    addReminder,
    getPendingReminders,
    getReminderForTask,
    updateReminder,
    deleteReminder,
    markReminderFired,
    snoozeReminder
};