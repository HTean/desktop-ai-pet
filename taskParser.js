// taskParser.js
// Parse English + Simplified Chinese natural-language tasks
// Supports recurring tasks: daily / weekly / monthly

const chrono = require('chrono-node');


// =====================================================
// Date → local datetime
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
// Detect Chinese
// =====================================================

function containsChinese(text) {

  return /[\u3400-\u9FFF]/u.test(text);
}


// =====================================================
// Detect recurrence
//
// Important:
// We also create parseText.
// Recurrence words are removed/converted before Chrono
// parses the actual date/time.
// =====================================================

function detectRecurrence(text, isChinese) {

  let recurrence = 'none';
  let parseText = text;


  // ===================================================
  // Chinese
  // ===================================================

  if (isChinese) {

    // -------------------------
    // Daily
    // 每天早上9点吃药
    // -------------------------

    if (
      /每天|每日/u.test(parseText)
    ) {

      recurrence = 'daily';

      parseText =
        parseText.replace(
          /每天|每日/gu,
          ''
        );
    }


    // -------------------------
    // Weekly
    // 每周一下午6点健身
    //
    // Convert:
    // 每周一 → 周一
    // so Chrono can still detect Monday
    // -------------------------

    else if (
      /每周|每星期|每礼拜/u.test(parseText)
    ) {

      recurrence = 'weekly';


      // 每周一 → 周一
      // 每星期五 → 周五
      // 每礼拜天 → 周天
      parseText =
        parseText.replace(
          /(?:每周|每星期|每礼拜)(?=[一二三四五六日天])/gu,
          '周'
        );


      // If no weekday follows:
      // 每周下午6点 → 下午6点
      parseText =
        parseText.replace(
          /每周|每星期|每礼拜/gu,
          ''
        );
    }


    // -------------------------
    // Monthly
    // 每月1号交房租
    // -------------------------

    else if (
      /每个月|每月/u.test(parseText)
    ) {

      recurrence = 'monthly';

      parseText =
        parseText.replace(
          /每个月|每月/gu,
          ''
        );
    }
  }


  // ===================================================
  // English
  // ===================================================

  else {

    // -------------------------
    // Daily
    // every day at 9am
    // daily at 9am
    // -------------------------

    if (
      /\bevery day\b|\bdaily\b/i.test(
        parseText
      )
    ) {

      recurrence = 'daily';

      parseText =
        parseText.replace(
          /\bevery day\b|\bdaily\b/gi,
          ''
        );
    }


    // -------------------------
    // Weekly
    // every Monday at 6pm
    // every week at 6pm
    // weekly at 6pm
    // -------------------------

    else if (
      /\bevery\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i
        .test(parseText) ||
      /\bevery week\b|\bweekly\b/i
        .test(parseText)
    ) {

      recurrence = 'weekly';


      // every Monday → Monday
      parseText =
        parseText.replace(
          /\bevery\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
          '$1'
        );


      parseText =
        parseText.replace(
          /\bevery week\b|\bweekly\b/gi,
          ''
        );
    }


    // -------------------------
    // Monthly
    // every month on the 1st
    // monthly on the 1st
    // -------------------------

    else if (
      /\bevery month\b|\bmonthly\b/i
        .test(parseText)
    ) {

      recurrence = 'monthly';

      parseText =
        parseText.replace(
          /\bevery month\b|\bmonthly\b/gi,
          ''
        );
    }
  }


  return {
    recurrence,
    parseText: parseText.trim()
  };
}


// =====================================================
// Clean task title
// =====================================================

function cleanTaskTitle(title, isChinese) {

  title =
    title
      .replace(/\s+/g, ' ')
      .trim();


  // ===================================================
  // Chinese
  // ===================================================

  if (isChinese) {

    return title

      .replace(
        /^(?:请)?(?:提醒我|帮我提醒|记得|帮我记得)\s*/u,
        ''
      )

      .replace(
        /^我(?:需要|要|得|必须|想要?)\s*/u,
        ''
      )

      .replace(
        /^(?:需要|要|得|必须)\s*/u,
        ''
      )

      .replace(
        /^添加任务[:：]?\s*/u,
        ''
      )

      .replace(
        /^[，,。.!！?？\s]+|[，,。.!！?？\s]+$/gu,
        ''
      )

      .trim();
  }


  // ===================================================
  // English
  // ===================================================

  return title

    .replace(
      /^please remind me to\s+/i,
      ''
    )

    .replace(
      /^remind me to\s+/i,
      ''
    )

    .replace(
      /^remember to\s+/i,
      ''
    )

    .replace(
      /^i need to\s+/i,
      ''
    )

    .replace(
      /^i have to\s+/i,
      ''
    )

    .replace(
      /^i must\s+/i,
      ''
    )

    .replace(
      /^add task\s+/i,
      ''
    )

    .trim();
}


// =====================================================
// Parse task text
// =====================================================

function parseTaskText(text) {

  const originalText =
    text.trim();


  if (!originalText) {

    return {
      title: '',
      description: '',
      dueAt: null,
      priority: 'normal',
      recurrence: 'none'
    };
  }


  const isChinese =
    containsChinese(originalText);


  // ===================================================
  // Step 1:
  // Detect recurrence first
  // ===================================================

  const recurrenceResult =
    detectRecurrence(
      originalText,
      isChinese
    );


  const recurrence =
    recurrenceResult.recurrence;


  let workingText =
    recurrenceResult.parseText;


  // ===================================================
  // Step 2:
  // Parse actual date/time
  // ===================================================

  const parser =
    isChinese
      ? chrono.zh.hans
      : chrono.en;


  const results =
    parser.parse(
      workingText,
      new Date(),
      {
        forwardDate: true
      }
    );


  let title =
    workingText;

  let dueAt =
    null;


  // ===================================================
  // Date/time found
  // ===================================================

  if (results.length > 0) {

    const result =
      results[0];


    dueAt =
      formatLocalDateTime(
        result.start.date()
      );


    // Remove date/time portion
    // from task title
    title = (
      workingText.slice(
        0,
        result.index
      ) +

      workingText.slice(
        result.index +
        result.text.length
      )
    )
      .replace(/\s+/g, ' ')
      .trim();
  }


  // ===================================================
  // Clean title
  // ===================================================

  title =
    cleanTaskTitle(
      title,
      isChinese
    );


  return {

    title,

    description: '',

    dueAt,

    priority: 'normal',

    recurrence
  };
}


// =====================================================
// Export
// =====================================================

module.exports = {
  parseTaskText
};