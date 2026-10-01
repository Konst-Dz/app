const OPENED_AT_FORMATTER = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatOpenedAt(openedAt: number): string {
  if (!Number.isInteger(openedAt) || openedAt <= 0) {
    return '';
  }
  return OPENED_AT_FORMATTER.format(new Date(openedAt * 1000));
}
