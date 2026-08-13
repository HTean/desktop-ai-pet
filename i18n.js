// i18n.js
// Central language file for Desktop AI Pet

const translations = {

  // ===================================================
  // English
  // ===================================================

  en: {
    petMessages: [
      "What?",
      "I'm here.",
      "What do you need to do today?",
      "Stop poking me.",
      "Hi 👀"
    ],

    chatPrompt: "What do you want to do?",
    chatPlaceholder: "Talk to Nainiu...",

    youSaid: "You said: {text}",

    taskAdded: "Added: {title}",
    addThisTask: "Add this task?",
    taskLabel: "Task",
    dueLabel: "Due",

    noPendingTasks: "You have no pending tasks.",
    onePendingTask: "You have 1 pending task.",
    multiplePendingTasks: "You have {count} pending tasks.",

    openingTasks: "Opening your tasks.",
    taskRejected: "Okay, I won't add it.",

    yes: "Yes",
    no: "No",

    // Tasks window
    tasksTitle: "Tasks",
    taskTitlePlaceholder: "What do you need to do?",
    taskDescriptionPlaceholder: "Description (optional)",

    lowPriority: "Low Priority",
    normalPriority: "Normal Priority",
    highPriority: "High Priority",

    addTask: "Add Task",
    saveChanges: "Save Changes",

    noTasksYet: "No tasks yet.",
    noDeadline: "No deadline",

    priorityLabel: "Priority",
    statusLabel: "Status",

    statusPending: "Pending",
    statusCompleted: "Completed",

    priorityLow: "Low",
    priorityNormal: "Normal",
    priorityHigh: "High",

    edit: "Edit",
    complete: "Complete",
    recurrenceLabel: "Repeat",
    recurrenceNone: "Does not repeat",
    recurrenceDaily: "Daily",
    recurrenceWeekly: "Weekly",
    recurrenceMonthly: "Monthly",
    delete: "Delete",

    reminderDue: "Time to do: {title}",
    reminderLater: "Later",
    snooze5: "5 min",
    snooze15: "15 min",
    snooze30: "30 min",
    snooze60: "1 hour",

    taskTimeLabel: "Task time",
    reminderLabel: "Reminder",
    reminderNone: "No reminder",
    reminderAtTime: "At task time",
    reminder5Minutes: "5 minutes before",
    reminder15Minutes: "15 minutes before",
    reminder30Minutes: "30 minutes before",
    reminder1Hour: "1 hour before",
    reminderCustom: "Custom time",
    customReminderLabel: "Custom reminder time",
    noReminder: "No reminder",
    reminderNeedsTaskTime: "Set a task time first.",
    customReminderRequired: "Choose a custom reminder time."
  },


  // ===================================================
  // Chinese
  // ===================================================

  zh: {
    petMessages: [
      "干嘛？",
      "我在呢。",
      "今天有什么要做的吗？",
      "别戳我。",
      "你好 👀"
    ],

    chatPrompt: "想让我帮你做什么？",
    chatPlaceholder: "和奶牛说点什么……",

    youSaid: "你说：{text}",

    taskAdded: "已添加：{title}",
    addThisTask: "要添加这个任务吗？",
    taskLabel: "任务",
    dueLabel: "截止时间",

    noPendingTasks: "你现在没有未完成的任务。",
    onePendingTask: "你有 1 个未完成的任务。",
    multiplePendingTasks: "你有 {count} 个未完成的任务。",

    openingTasks: "正在打开任务列表。",
    taskRejected: "好的，不添加这个任务。",

    yes: "是",
    no: "否",

    // 任务窗口
    tasksTitle: "任务",
    taskTitlePlaceholder: "你需要做什么？",
    taskDescriptionPlaceholder: "描述（可选）",

    lowPriority: "低优先级",
    normalPriority: "普通优先级",
    highPriority: "高优先级",

    addTask: "添加任务",
    saveChanges: "保存修改",

    noTasksYet: "还没有任务。",
    noDeadline: "无截止时间",

    priorityLabel: "优先级",
    statusLabel: "状态",

    statusPending: "未完成",
    statusCompleted: "已完成",

    priorityLow: "低",
    priorityNormal: "普通",
    priorityHigh: "高",

    edit: "编辑",
    complete: "完成",
    recurrenceLabel: "重复",
    recurrenceNone: "不重复",
    recurrenceDaily: "每天",
    recurrenceWeekly: "每周",
    recurrenceMonthly: "每月",
    delete: "删除",

    reminderDue: "该做：{title} 了。",
    reminderLater: "稍后",
    snooze5: "5分钟",
    snooze15: "15分钟",
    snooze30: "30分钟",
    snooze60: "1小时",

    taskTimeLabel: "任务时间",
    reminderLabel: "提醒",
    reminderNone: "不提醒",
    reminderAtTime: "准时提醒",
    reminder5Minutes: "提前5分钟",
    reminder15Minutes: "提前15分钟",
    reminder30Minutes: "提前30分钟",
    reminder1Hour: "提前1小时",
    reminderCustom: "自定义时间",
    customReminderLabel: "自定义提醒时间",
    noReminder: "不提醒",
    reminderNeedsTaskTime: "请先设置任务时间。",
    customReminderRequired: "请选择自定义提醒时间。"
  }

};


// =====================================================
// Language
// =====================================================

const requestedLanguage =
  new URLSearchParams(
    window.location.search
  ).get('lang');


let currentLanguage =
  translations[requestedLanguage]
    ? requestedLanguage
    : 'en';


// =====================================================
// Translate a text key
// Supports variables such as:
// t('taskAdded', { title: 'Buy groceries' })
// =====================================================

function t(key, variables = {}) {

  let text =
    translations[currentLanguage]?.[key] ??
    translations.en[key] ??
    key;


  // Arrays such as petMessages are returned directly
  if (Array.isArray(text)) {
    return text;
  }


  // Replace {variable} placeholders
  for (const [name, value] of Object.entries(variables)) {

    text = text.replaceAll(
      `{${name}}`,
      String(value)
    );
  }


  return text;
}


// =====================================================
// Change language
// Later Settings will call this.
// =====================================================

function setLanguage(language) {

  if (!translations[language]) {
    return false;
  }

  currentLanguage = language;

  return true;
}


// Make translation functions available to HTML pages
window.i18n = {
  t,
  setLanguage
};