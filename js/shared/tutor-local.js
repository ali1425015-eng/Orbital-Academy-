/* Offline tutor: builds an explanation from the generator's misconception
   note for the chosen wrong option + the worked solution + the concept rule.
   Used when no LLM key is configured, when the network fails, and in the
   static (GitHub Pages) build. Also builds the prompt sent to the LLM. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./concepts.js'));
  else (root.OA = root.OA || {}).TutorLocal = factory(root.OA.Concepts);
})(typeof self !== 'undefined' ? self : this, function (C) {
  var OPEN = ['يا قائد، محاولة جيدة! ', 'لا بأس يا قائد، هذا خطأ شائع جدًا. ', 'تمهّل يا قائد، لنراجع معًا. ', 'عظيم أنك حاولت يا قائد! '];
  function strip(s) { return String(s || '').replace(/`/g, ''); }

  function explain(q, selected, grade) {
    var c = C.ALL[q.conceptTag] || {};
    var parts = [];
    var seed = (q.questionId || '').length + (selected || 0);
    parts.push(OPEN[seed % OPEN.length]);
    if (selected === -1) parts.push('انتهى الوقت قبل أن تجيب. ');
    else if (q.optionNotes && q.optionNotes[selected]) parts.push('اخترت «' + strip(q.options[selected]) + '»: ' + q.optionNotes[selected] + ' ');
    parts.push('\nالإجابة الصحيحة: «' + strip(q.options[q.correctOptionIndex]) + '». ');
    if (q.explanation) parts.push('\nالحل: ' + strip(q.explanation) + ' ');
    if (c.lesson) parts.push('\n📌 القاعدة: ' + c.lesson);
    return parts.join('');
  }

  /* The prompt follows the project spec (grade, question, correct answer,
     student answer, ≤3 short Arabic sentences, encouraging sci-fi tone) and
     adds the curriculum rule + the known misconception so the model stays
     accurate and on-curriculum. */
  function prompt(q, selected, grade) {
    var c = C.ALL[q.conceptTag] || {};
    var subj = (C.SUBJECTS[q.subject] || {}).ar || q.subject;
    return [
      'You are a friendly AI tutor inside a sci-fi space learning game for Egyptian school students.',
      'The student is in grade ' + grade + ' (' + (C.gradeAr[grade] || '') + '), subject: ' + subj + ', concept: ' + (c.ar || q.conceptTag) + '.',
      'They were asked: "' + strip(q.questionText) + '".',
      'Options: ' + q.options.map(function (o, i) { return (i + 1) + ') ' + strip(o); }).join('  '),
      'The correct answer is: "' + strip(q.options[q.correctOptionIndex]) + '".',
      selected === -1 ? 'The student ran out of time without answering.' : 'The student answered: "' + strip(q.options[selected]) + '".',
      q.optionNotes && q.optionNotes[selected] ? 'Likely misconception (from the curriculum team): ' + q.optionNotes[selected] : '',
      'Curriculum rule: ' + (c.lesson || '') + '  Worked solution: ' + strip(q.explanation),
      'Explain briefly (maximum 3 short sentences, in Arabic' + (q.subject === 'english' ? ', you may quote the English words' : '') + ') why their answer is wrong and what the correct concept is.',
      'Keep the tone encouraging and sci-fi themed (e.g. "يا قائد"، "عظيم محاولتك"). Do not use markdown headings. Do not add new facts outside the school curriculum.'
    ].filter(Boolean).join('\n');
  }

  function followupPrompt(q, grade, message, before) {
    var c = C.ALL[q.conceptTag] || {};
    var lines = [
      'You are a friendly AI tutor in a sci-fi space learning game for Egyptian school students (grade ' + grade + ').',
      'Context question: "' + strip(q.questionText) + '". Options: ' + q.options.map(function (o, i) { return (i + 1) + ') ' + strip(o); }).join('  ') + '.',
      'Curriculum rule for this concept: ' + (c.lesson || '')
    ];
    if (before) lines.push('IMPORTANT: the student has NOT answered yet. NEVER reveal or hint which option is correct and never compute the final answer for them. Explain the concept and the method step by step, give a similar mini-example with different numbers, and encourage them to try.');
    else lines.push('The student has already answered. The correct answer is "' + strip(q.options[q.correctOptionIndex]) + '". Worked solution: ' + strip(q.explanation));
    lines.push('The student asks: "' + String(message).slice(0, 300) + '"');
    lines.push('Answer in Arabic in at most 4 short sentences, at a grade-' + grade + ' level, in an encouraging sci-fi tone. Only discuss this school topic; if the message is unrelated or inappropriate, politely steer back to the lesson.');
    return lines.join('\n');
  }

  /* Offline replacement for the chat: no free conversation, but still useful and never leaks the answer early. */
  function askLocal(q, grade, before) {
    var c = C.ALL[q.conceptTag] || {};
    if (before) return 'يا قائد، لن أكشف لك الحل قبل أن تحاول 😉 لكن إليك القاعدة:\n📌 ' + strip(c.lesson || 'راجع المفهوم الأساسي في درسك.') + '\nطبّق القاعدة خطوة بخطوة على السؤال ثم اختر إجابتك.\n(المحادثة الحرة مع المدرس الذكي تعمل عند تفعيل مفتاح الذكاء الاصطناعي على الخادم.)';
    return '✔ الإجابة الصحيحة: «' + strip(q.options[q.correctOptionIndex]) + '»\nالحل: ' + strip(q.explanation) + '\n📌 القاعدة: ' + strip(c.lesson || '') + '\n(للمحادثة الحرة فعّل مفتاح الذكاء الاصطناعي على الخادم.)';
  }
  return { explain: explain, prompt: prompt, followupPrompt: followupPrompt, askLocal: askLocal };
});
