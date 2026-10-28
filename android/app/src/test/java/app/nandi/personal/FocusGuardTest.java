package app.nandi.personal;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

/** Spec 36: the focus guard keeps the watcher running with App pause (Night) off. */
public class FocusGuardTest {
    @Test public void focusAloneKeepsTheWatcherRunning() {
        assertTrue(NightPauseService.shouldRun(false, true, true));
    }
    @Test public void nightAloneStillRunsIt() {
        assertTrue(NightPauseService.shouldRun(true, false, true));
    }
    @Test public void neitherOrNoUsageAccessStopsIt() {
        assertFalse(NightPauseService.shouldRun(false, false, true));
        assertFalse(NightPauseService.shouldRun(true, true, false));
    }
}
