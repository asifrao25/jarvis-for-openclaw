export function categorize(chatEvent) {
  const text = extractText(chatEvent);
  if (text.startsWith('[ALERT]')) return 'alert';
  if (text.startsWith('[REPORT]')) return 'report';
  return 'chat';
}

export function extractText(chatEvent) {
  const content = chatEvent.payload?.message?.content || [];
  return content.filter(c => c.type === 'text').map(c => c.text).join('');
}
