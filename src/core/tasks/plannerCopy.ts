export function minutesInWords(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export function weekInWords(weekKey: string): string {
  const [, month = 1, day = 1] = weekKey.split('-').map(Number);
  return `${day} ${new Date(2000, month - 1, 1).toLocaleString('en', { month: 'short' })}`;
}

export function weekInWordsSummary(done: number, training: number, nights: number): string {
  const parts = [
    done ? `finished ${done} ${done === 1 ? 'task' : 'tasks'}` : '',
    training ? `trained ${training} ${training === 1 ? 'time' : 'times'}` : '',
    nights ? `kept ${nights} ${nights === 1 ? 'night' : 'nights'} on plan` : '',
  ].filter(Boolean);
  if (!parts.length) return "A quiet week. That's data, not a verdict.";
  return `You ${parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`}.`;
}

export function moveReasonInWords(reason: string): string {
  const labels: Record<string, string> = {
    underestimated: 'it needed more time',
    blocked: 'something got in the way',
    lowEnergy: 'energy was low',
    'low energy': 'energy was low',
    avoided: 'it was hard to start',
    'avoided it': 'it was hard to start',
  };
  return labels[reason] ?? reason;
}
