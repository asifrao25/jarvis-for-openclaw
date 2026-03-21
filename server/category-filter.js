export function categorize(chatEvent) {
  const text = extractText(chatEvent);
  return categorizeText(text);
}

export function categorizeText(text) {
  const firstLine = text.trimStart().split('\n')[0];
  if (/^[^\[]{0,10}\[ALERT\]/i.test(firstLine)) return 'alert';
  if (/^[^\[]{0,10}\[REPORT\]/i.test(firstLine)) return 'report';
  return 'chat';
}

export function extractText(chatEvent) {
  const content = chatEvent.payload?.message?.content || [];
  return content.filter(c => c.type === 'text').map(c => c.text).join('');
}
