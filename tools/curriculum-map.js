#!/usr/bin/env node
/* Writes docs/CURRICULUM_MAP.md: which concept is taught in which grade, with question counts.
   The grade of every concept is defined in js/shared/concepts.js (add('tag', subject, firstGrade, lastGrade, ...)).
   A teacher should review this table against the official books and edit concepts.js if needed. */
'use strict';
const fs = require('fs');
const path = require('path');
const C = require('../js/shared/concepts.js');
const bank = require('../data/questions.json');
const ROOT = path.join(__dirname, '..');

const cnt = {};
bank.forEach(q => { const k = q.conceptTag + '|' + q.gradeLevel; cnt[k] = (cnt[k] || 0) + 1; });
let md = '# خريطة المنهج — أي مفهوم يُدرَّس في أي صف\n\n' +
  '> هذه الخريطة **من وضع المطوّر** وليست منقولة حرفياً من الكتب المدرسية الرسمية. **يرجى مراجعتها مع معلم المادة**، ثم تعديل الصفوف في `js/shared/concepts.js` (الرقمان بعد اسم المادة هما أول صف وآخر صف) وتشغيل `npm run build`.\n' +
  '> يعرض النظام لكل طالب أسئلة **صفه فقط**.\n\n';
C.CURRICULUM.forEach(s => {
  md += '## ' + C.SUBJECTS[s].icon + ' ' + C.SUBJECTS[s].ar + '\n\n| المفهوم | الصفوف | ' + C.GRADES.map(g => 'ص' + g).join(' | ') + ' |\n|---|---|' + C.GRADES.map(() => '---').join('|') + '|\n';
  C.forSubject(s).forEach(t => {
    const c = C.ALL[t], row = C.GRADES.map(g => cnt[t + '|' + g] || '·');
    if (row.every(x => x === '·')) return;
    md += '| ' + c.ar + ' (`' + t + '`) | ' + c.grades[0] + (c.grades[1] !== c.grades[0] ? '–' + c.grades[1] : '') + ' | ' + row.join(' | ') + ' |\n';
  });
  md += '| **المجموع** | | ' + C.GRADES.map(g => bank.filter(q => q.subject === s && q.gradeLevel === g).length).join(' | ') + ' |\n\n';
});
md += '(الأرقام = عدد الأسئلة؛ الصف 7 = الأول الإعدادي … الصف 12 = الثالث الثانوي)\n';
fs.writeFileSync(path.join(ROOT, 'docs', 'CURRICULUM_MAP.md'), md);
console.log('docs/CURRICULUM_MAP.md written');
