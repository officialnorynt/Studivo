function stripMarker(line, re) {
  const m = line.match(re);
  return m ? line.slice(m[0].length).trim() : line.trim();
}

const QUESTION_START = /^(?:q(?:uestion)?\s*)?(\d{1,3})[\.\)]\s*/i;
const CHOICE_START = /^\(?([A-Za-z])[\.\)]\s*/;
const ANSWER_LINE = /^(?:correct\s*)?(?:answer|ans)\s*[:\-]?\s*\(?([A-Za-z])\)?/i;

export function parseQuestionsFromText(rawText) {
  const lines = (rawText || '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const blocks = [];
  let current = null;

  for (const line of lines) {
    if (QUESTION_START.test(line)) {
      if (current) blocks.push(current);
      current = { textLines: [stripMarker(line, QUESTION_START)], choiceLines: [], answerLetter: null };
    } else if (current && ANSWER_LINE.test(line)) {
      const m = line.match(ANSWER_LINE);
      current.answerLetter = m[1].toUpperCase();
    } else if (current && CHOICE_START.test(line)) {
      current.choiceLines.push(line);
    } else if (current && current.choiceLines.length === 0) {
      current.textLines.push(line);
    }
  }
  if (current) blocks.push(current);

  return blocks
    .map((b) => {
      const text = b.textLines.join(' ').trim();
      const choices = b.choiceLines.map((l) => stripMarker(l, CHOICE_START));
      while (choices.length < 4) choices.push('');
      let correctIndex = null;
      if (b.answerLetter) {
        const idx = b.answerLetter.charCodeAt(0) - 'A'.charCodeAt(0);
        if (idx >= 0 && idx < choices.length) correctIndex = idx;
      }
      return {
        id: Math.random().toString(36).slice(2),
        text,
        choices,
        correctIndex,
      };
    })
    .filter((q) => q.text || q.choices.some((c) => c));
}
