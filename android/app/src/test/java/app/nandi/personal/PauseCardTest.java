package app.nandi.personal;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

/** Spec 39: the Pause card runs the watcher on its own, inside its window, behind the focus guard and the night. */
public class PauseCardTest {
    @Test public void thePauseCardAloneKeepsTheWatcherRunning() {
        assertTrue(NightPauseService.shouldRun(false, false, true, true));
        assertFalse(NightPauseService.shouldRun(false, false, true, false));
        assertFalse(NightPauseService.shouldRun(false, false, false, true));
    }

    @Test public void allDayMeansUntilTheNightWindow() {
        assertTrue(NightPauseService.inDayWindow(10 * 60, "", "", false));
        assertFalse(NightPauseService.inDayWindow(23 * 60, "", "", true));
    }

    @Test public void aWindowCountsFromItsStartToItsEnd() {
        assertTrue(NightPauseService.inDayWindow(9 * 60, "09:00", "21:00", false));
        assertTrue(NightPauseService.inDayWindow(20 * 60 + 59, "09:00", "21:00", false));
        assertFalse(NightPauseService.inDayWindow(21 * 60, "09:00", "21:00", false));
        assertFalse(NightPauseService.inDayWindow(8 * 60, "09:00", "21:00", false));
        // A window past midnight wraps.
        assertTrue(NightPauseService.inDayWindow(60, "21:00", "02:00", false));
        assertFalse(NightPauseService.inDayWindow(3 * 60, "21:00", "02:00", false));
    }

    @Test public void theFocusGuardAndTheNightComeFirst() {
        assertTrue(NightPauseService.dayPauseApplies(true, false, false, false, true));
        assertFalse(NightPauseService.dayPauseApplies(true, false, true, false, true));
        assertFalse(NightPauseService.dayPauseApplies(true, true, false, false, true));
    }

    @Test public void offForTodayOrOutsideTheWindowStaysQuiet() {
        assertFalse(NightPauseService.dayPauseApplies(true, false, false, true, true));
        assertFalse(NightPauseService.dayPauseApplies(true, false, false, false, false));
        assertFalse(NightPauseService.dayPauseApplies(false, false, false, false, true));
    }
}
