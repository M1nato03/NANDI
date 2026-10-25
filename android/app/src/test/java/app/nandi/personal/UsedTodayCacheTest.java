package app.nandi.personal;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class UsedTodayCacheTest {
    private static final long DAY = 1_000_000L;

    @Test public void goodReadIsCachedAndGrowsForAMinute() {
        UsedTodayCache cache = new UsedTodayCache();
        assertEquals(10_000, cache.get(100_000, DAY, () -> 10_000));
        assertEquals(40_000, cache.get(130_000, DAY, () -> { throw new AssertionError("no read inside the minute"); }));
    }

    @Test public void unknownReadKeepsTheTotalFrozenAndTheNextGoodReadDecides() {
        UsedTodayCache cache = new UsedTodayCache();
        assertEquals(10_000, cache.get(100_000, DAY, () -> 10_000));
        // Ten minutes later the log cannot be read: wall time is not added (Codex A item 73).
        assertEquals(10_000, cache.get(700_000, DAY, () -> -1));
        assertEquals(10_000, cache.get(760_000, DAY, () -> -1));
        // The last-read mark did not move, so the very next tick reads again and the real events decide.
        assertEquals(15_000, cache.get(761_000, DAY, () -> 15_000));
    }

    @Test public void aNewDayStartsFromZeroEvenWhenTheLogIsUnreadable() {
        UsedTodayCache cache = new UsedTodayCache();
        assertEquals(50_000, cache.get(100_000, DAY, () -> 50_000));
        assertEquals(0, cache.get(200_000, DAY * 2, () -> -1));
    }

    @Test public void invalidateReadsAgain() {
        UsedTodayCache cache = new UsedTodayCache();
        cache.get(100_000, DAY, () -> 10_000);
        cache.invalidate();
        assertEquals(12_000, cache.get(101_000, DAY, () -> 12_000));
    }
}
