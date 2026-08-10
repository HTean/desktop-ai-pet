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
    delete: "Delete"
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
    delete: "删除"
  }

};


// =====================================================
// Development default
//
// For now:
// en = English
// zh = Chinese
//
// Later this will come from Settings / first-run setup.
// =====================================================

let currentLanguage = 'en';


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