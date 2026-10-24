package app.nandi.personal;

/**
 * The App pause day count between reads of the usage log (idea engine items 71 B4, 73). A good read is cached for a
 * minute and grows with the time since; an unknown read (-1: no access, phone still locked after a restart) keeps the
 * last good total for the same NANDI day, frozen, and does not move the last-read mark, so the next good read covers
 * the gap from real events instead of wall time. A new day starts from 0.
 */
final class UsedTodayCache {
    interface Reader { long read(); }

    private long usedMs = 0;
    private long usedAt = 0;
    private long day = Long.MIN_VALUE;

    /** Forces the next call to read the log again (a restart of the service). */
    void invalidate() { usedAt = 0; }

    long get(long now, long dayStart, Reader reader) {
        if (dayStart != day) { day = dayStart; usedMs = 0; usedAt = 0; }
        if (usedAt == 0 || now - usedAt > 60000 || now < usedAt) {
            long read = reader.read();
            if (read < 0) return usedMs;
            usedMs = read;
            usedAt = now;
            return usedMs;
        }
        return usedMs + (now - usedAt);
    }
}
