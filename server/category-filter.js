export function categorize(chatEvent) {
  const content = chatEvent.payload?.message?.content || [];
  const text = content.filter(c => c.type === 'text').map(c => c.text).join('');
  if (text.includes('[ALERT]')) return 'alert';
  if (text.includes('[REPORT]')) return 'report';
  return 'chat';
}

export function extractText(chatEvent) {
  const content = chatEvent.payload?.message?.content || [];
  return content.filter(c => c.type === 'text').map(c => c.text).join('');
}
