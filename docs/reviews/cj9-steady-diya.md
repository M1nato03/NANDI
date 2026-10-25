# CJ9 · Steady diya feasibility

25 October 2026 · desk research and a sensor sketch · adults 18+

## Decision

**Conditional prototype; do not ship the phone-on-back or phone-on-chest prompt.**
The motion-to-flame interaction is feasible in a visible, foreground page.
It is not a form check, and the screen is hard to see in the proposed positions.
A loose phone can fall during a plank or squat.
Test a safe, visible placement and real devices before any exercise framing.

| Question | Finding | Product decision |
| --- | --- | --- |
| Can a Capacitor 8 Android WebView read motion? | Likely yes through web events; WebView supports device orientation, but exact motion data and rate vary by device. [Chrome WebView overview](https://developer.chrome.com/docs/webview), [W3C specification](https://www.w3.org/TR/orientation-event/) | Confirm on target Android phones. |
| Is a native plugin needed? | Capacitor 8 says the Motion plugin is “currently implemented using Web APIs.” Its API adds listeners, not a rate setting. [Capacitor Motion](https://capacitorjs.com/docs/apis/motion) | Use devicemotion for the experiment; reassess if a native feature is needed. |
| Will it work with the screen off? | Web motion events require a visible document. Android also restricts background sensor events; non-wake-up sensors can miss events when the processor sleeps. [W3C specification](https://www.w3.org/TR/orientation-event/), [Android sensor guide](https://developer.android.com/develop/sensors-and-location/sensors/sensors_overview), [SensorManager](https://developer.android.com/reference/android/hardware/SensorManager) | Foreground and screen on only. Pause cleanly when hidden. |
| Will it work offline? | The demo has no network calls. NANDI's existing Android WebView origin uses HTTPS in capacitor.config.ts; browser trials still need a secure context. [MDN secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts) | Bundled app can stay offline; serve browser demo over HTTPS. |

## Motion API choice

| Item | DeviceMotionEvent / DeviceOrientationEvent | @capacitor/motion |
| --- | --- | --- |
| Data | Motion gives linear acceleration, acceleration with gravity, rotation rate and interval. Orientation gives angles; it is less direct for jerk. Values can be null. [MDN DeviceMotionEvent](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent), [W3C specification](https://www.w3.org/TR/orientation-event/) | The accel listener wraps the motion event; orientation wraps orientation. [Capacitor Motion](https://capacitorjs.com/docs/apis/motion) |
| Permission | Detect requestPermission; when present, call it from a tap and handle denied/error. Motion and orientation requests are separate on iOS. [MDN motion permission](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent/requestPermission_static), [MDN orientation permission](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static) | Docs show the same user-initiated web permission calls before addListener. [Capacitor Motion](https://capacitorjs.com/docs/apis/motion) |
| Rate | Browser decides. The interval property reports hardware granularity; measure actual event timestamps too. W3C calls the interval “implementation-defined.” [MDN interval](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent/interval), [W3C specification](https://www.w3.org/TR/orientation-event/) | No documented sampling-rate control. [Capacitor Motion](https://capacitorjs.com/docs/apis/motion) |
| Lifecycle | Remove listener on stop, page hide and exit. Treat gaps as a fresh start. | Remove the plugin listener the same way. |
| Battery | Live sensors and a lit screen cost power. Android says to disable unused sensors and choose the slowest useful rate; web events do not expose a rate knob. [Android sensor guide](https://developer.android.com/develop/sensors-and-location/sensors/sensors_overview) | Same web sensor cost; wrapper alone does not solve it. |

The web standard says to “fire events only” while the document is visible.
Android's sensor guide says continuous sensors do not deliver to background apps on Android 9+.
Neither source promises a particular WebView screen-off behavior.
Treat screen-off capture as unavailable until tested; this concept does not need it.
[W3C specification](https://www.w3.org/TR/orientation-event/),
[Android sensor guide](https://developer.android.com/develop/sensors-and-location/sensors/sensors_overview).

Do not infer a fixed 50 or 60 Hz rate from an Android device label.
Log event timestamp gaps and the interval property on each test phone.
A native SensorManager listener could request a delay, but Android says it is only a hint and can cost battery.
That would be a different implementation, not a benefit of @capacitor/motion.
[Android sensor guide](https://developer.android.com/develop/sensors-and-location/sensors/sensors_overview).

## Flame signal

Use all three axes of **linear acceleration** when supplied.
If only acceleration including gravity exists, tilting the phone changes the signal.
Label that path lower confidence; do not compare its thresholds with linear acceleration.
Orientation may drive a slow visual lean, but should not be called a smoothness score.
[MDN DeviceMotionEvent](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent).

| Step | Prototype choice | Why |
| --- | --- | --- |
| Input | Ordered samples with measured timestamps, in m/s². Reject missing axes. | Event spacing varies. |
| Filter | Exponential smoothing, 60 ms time constant. | Limits sample noise before differentiation. |
| Jerk | Magnitude of the change in filtered acceleration divided by elapsed seconds, in m/s³. | A quick change raises the response. |
| Window | Root mean square jerk across the latest 400 ms; wait for at least 8 samples and 300 ms. | Avoids reacting to one warm-up sample. |
| Mapping | At or below 3 m/s³: calm. At or above 15 m/s³: full flicker. Interpolate between. | **Unvalidated visual thresholds**, chosen for a sketch. |
| Gap | Reset if samples are over 200 ms apart or timestamps are invalid. | No fake spike after pause. |
| Output | Flicker is bounded 0–1; flame remains lit. | No loss state. |

This is a **short-window visual proxy**, not a published clinical smoothness measure.
Movement-science work uses log dimensionless jerk and spectral arc length (SPARC) on movement profiles.
It warns that derivatives amplify noise; SPARC was developed for better robustness.
A plank is nearly static, while a squat is rhythmic; a phone also moves relative to the body.
So neither a high jerk value nor a calm flame proves technique, effort or safety.
[Balasubramanian et al., 2012](https://pubmed.ncbi.nlm.nih.gov/22180502/),
[Balasubramanian et al., 2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4674971/).

**Validation gate:** record only voluntary test traces on two Android WebViews and one iPhone browser.
Check missing axes, rate distribution, pauses, and tilt contamination.
Tune thresholds per data source for a pleasant response to gentle hand motion and slow squats.
Do not interpret the result as a body metric.
Battery use and phone placement still need physical tests; none were run for this review.

## Safety and copy

| Risk | Product wording / behavior |
| --- | --- |
| Falling phone or unseen screen | “Keep the phone in your hand or on a secure, visible surface. Do not balance it on your back or chest.” A held or tabletop sketch can be tried; the exercise-placement idea remains untested. |
| Breath-holding | “Let your breathing stay easy. The flame does not reward holding still or holding your breath.” ACE's plank guide says to keep breathing. [ACE plank guide](https://www.acefitness.org/resources/everyone/exercise-library/32/front-plank/) |
| Pain or unsuitable exercise | “Choose a movement that feels comfortable. If a plank hurts your back or shoulders, skip it. If you have an injury, condition, are pregnant, or are unsure, ask a qualified professional about exercise.” [ACE plank guide](https://www.acefitness.org/resources/everyone/exercise-library/32/front-plank/), [Cleveland Clinic plank guide](https://health.clevelandclinic.org/plank-exercise-benefits), [NHS exercise caution](https://www.nhs.uk/live-well/exercise/pilates-and-yoga/chronic-back-pain-pilates-exercise-video/) |
| Unwell during movement | “Stop moving if you feel pain, dizzy, faint, chest discomfort, or uncomfortable breathing.” [NHS exercise safety](https://www.cuh.nhs.uk/patient-information/cardiac-rehabilitation-home-exercise-guidelines/) |
| Competitive pressure | No time target, countdown, streak, failure label, extinguished flame or form grade. “Move how you like. Pause any time.” |

The sensor cannot detect breathing, pain or safe placement.
Keep these statements as choice and exit cues.
Do not show a pose tutorial or claim the flame gives coaching.

## Closest prior work found

Search covered app stores, maker pages and patent records.
These are nearby examples, not an exhaustive patent or trademark review.

| Example | Overlap | What differs here |
| --- | --- | --- |
| [Plank Timer: Core & Form Check on Google Play](https://play.google.com/store/apps/details?id=com.mochilab.fitness.plank_timer) | Phone on lower back or in pocket; accelerometer during a plank. | It reports posture breaks and “perfect form” time. Diya would only animate, with no form or time verdict. |
| [Plankpad](https://plankpad.com/pages/faq-all-about-plankpad) | Phone sensors animate games while planking. | Phone sits on a dedicated balance board. Diya has no board, points or targets; safe placement remains a design gap. |
| [Push Up Boss](https://www.pushupboss.app/pages/how-it-works.html) | Offers a phone-on-back motion mode tied to exercise play. | It counts push-ups and uses a boss/time target. Diya is a continuous calm/flicker response and never ends in a loss. |

A [plank exerciser patent](https://patents.google.com/patent/US11819731B2/en) also describes a phone held in a board recess and motion-controlled games.
That reinforces the need for a secure mount if a body-movement version is pursued.

## Artifacts and next check

- content-drafts/steady-diya/jerk.ts is the pure trace-to-flame function.
- jerk.test.ts uses synthetic slow, jerky, invalid and paused traces.
- demo.html is one self-contained page. Use HTTPS on a phone; tap **Use motion**.
  **Preview flicker** works when sensors are unavailable.
- The demo duplicates the tiny filter in plain JavaScript so it runs without a build.
  If this becomes product code, share one implementation through the build.

Proceed only as a foreground visual sketch.
Before any exercise prompt: verify phone safety, visibility, actual sensor delivery and battery on devices.
