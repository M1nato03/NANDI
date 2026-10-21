# Variety review: How things work

Topic file: `content/topics/topic.how-things-work.json` (origin/main, 78d1a28).
Date: 2026-10-22. Report only; no app code or content JSON was changed.

Why this review: a learner said the questions for one idea "all feel the same".
The cause is the same here. Every concept in this topic has **2 claims and 8 items**.
So the 8 items keep re-asking 1-2 facts in new formats.
Spec 14 (teach first) needs 3 steps per concept, each on a different claim,
with at most 3 questions per step (3/3/2).

## Summary

| concept id | claims now | repeats found | claims proposed | ready for 3 steps? |
|---|---|---|---|---|
| lift | 2 | 4 | 2 (c3, c4) | yes, with proposed claims |
| multirotor-turns | 2 | 3 | 2 (c3, c4) | yes, with proposed claims |
| battery-flight-time | 2 | 4 | 2 (c3, c4) | yes, with proposed claims |
| flight-sensors | 2 | 3 | 2 (c3, c4) + split c2 | yes, with proposed claims |
| birds-and-planes | 2 | 4 (+2 copied from lift) | 2 (c3, c4) | yes, with proposed claims |
| ceiling-fans | 2 | 4 | 2 (c3, c4) | yes, with proposed claims |
| upi-path | 2 | 5 | 2 (c3, c4) + 1 spare | yes, with proposed claims |
| phone-camera | 2 | 3 | 2 (c3, c4) | yes, with proposed claims |
| sky-colours | 2 | 4 | 2 (c3, c4) | yes, with proposed claims |
| pressure-cooker | 2 | 3 | 2 (c3, c4) | yes, with proposed claims |

"Repeats found" = items that test the same idea as an earlier item in the same concept.
No concept is ready today: all 10 have only 2 claims.
Every concept reaches 3+ claims with the sources below. No claim needed "no source found".

How to read each section:
- **Items**: one line per item, the idea it really tests.
- **Repeats**: groups of items that test the same idea.
- **Proposed claims**: plain sentence, source URL, exact supporting words from the source.
- **Steps**: title, claim taught, what the learner can do after, diagram, and which
  existing items fit (3/3/2). Items left over are the repeats to drop or rewrite.

Readability: every proposed claim scores about 66-109 on an approximate Flesch reading
ease check (simple syllable counter, not the app's validator). Please re-run the
validator on the final wording.

All sources below were opened on 2026-10-22. Quotes are copied from the page text.

---

## 1. lift (Lift)

Claims now: 2. c1 lift needs motion between wing and air. c2 wing turns air; lift balances weight.

Items:
- lift-1 predict: a slowing plane gets less lift (speed -> lift).
- lift-2 scenario: lift comes only when air flows past (needs airflow).
- lift-3 estimate: level flight, lift = weight (2 N).
- lift-4 choose: wing pushes air down, air pushes wing up (push-back).
- lift-5 why: slower glider sinks because less airflow, less lift (speed -> lift).
- lift-6 fill: weight points down (lift vs weight).
- lift-7 true-not-quite: no lift in a vacuum (needs airflow).
- lift-8 order: air flows, is turned down, pushes wing up (push-back).

Repeats:
- lift-1 = lift-5 (slowing means less lift).
- lift-2 = lift-7 (no moving air, no lift).
- lift-4 = lift-8 (air turned down pushes wing up).
- lift-3 = lift-6 (lift balances weight).
- Note: "speed -> lift" is tested twice but is not a claim yet. Proposed c3 fixes that.

Proposed claims:
- **lift-c3**: "Lift grows fast with speed. Twice the speed gives about four times the lift."
  - Source: NASA Glenn, Lift. https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/lift-3/
  - Quote: "both old and new version of the equation express the dependence of lift on
    the square of the velocity, the surface area, the shape of the object, inclination of
    the object to the flow, and the properties of the air."
  - Note: "four times" is 2 squared, with everything else the same. Say "about".
- **lift-c4** (optional): "Tilting the wing up a little gives more lift. Tilt it too far and the wing stalls and suddenly loses lift."
  - Source: NASA Glenn, Inclination effects on lift. https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/incline
  - Quotes: "The nose of the airplane rises, increasing the angle of attack and producing
    the increased lift needed for takeoff." and "aircraft wings will abruptly lose lift at
    high inclination to the flow. This condition was called a stall".

Steps:
1. **Lift needs air moving past the wing** (c1).
   Can do: say when a wing gets lift and when it cannot (still air, vacuum).
   Diagram: compare (still air: no lift / moving air: lift).
   Items: lift-2, lift-7.
2. **The wing pushes air down, air pushes back** (c2).
   Can do: explain lift as a push-back, and that level flight needs lift = weight.
   Diagram: flow (air flows -> turned down -> wing pushed up).
   Items: lift-4, lift-8, lift-3.
3. **More speed gives much more lift** (c3; c4 as a bonus line).
   Can do: predict that a slowing glider loses lift fast and sinks.
   Diagram: scale (speed x1 -> lift x1, speed x2 -> lift x4).
   Items: lift-1, lift-5.
- Left over: lift-6 (repeat of lift-3). Drop, or rewrite to test the stall (c4).

---

## 2. multirotor-turns (How a multirotor turns)

Claims now: 2. c1 a gap in motor speeds pitches or rolls the drone. c2 yaw comes from the rotor turning-force balance.

Items:
- multirotor-turns-1 predict: one side pushes harder, drone tilts (thrust gap -> tilt).
- multirotor-turns-2 scenario: nose turns because spin balance changed (yaw).
- multirotor-turns-3 estimate: rear 2.5 N each, total 8 N, front 1.5 N (thrust gap -> tilt).
- multirotor-turns-4 choose: nose down because rear rotors push more (thrust gap -> tilt).
- multirotor-turns-5 why: opposite spins cancel the twist (counter-rotation).
- multirotor-turns-6 fill: yaw turns around the vertical axis (naming the axis).
- multirotor-turns-7 true-not-quite: GPS did not push, the motors did (motors make force).
- multirotor-turns-8 match: roll = side thrust gap, yaw = spin moments (restates 1 + 2).

Repeats:
- multirotor-turns-1 = multirotor-turns-3 = multirotor-turns-4 (uneven thrust tilts the drone).
- multirotor-turns-8 restates multirotor-turns-1 and multirotor-turns-2.
- multirotor-turns-5 tests counter-rotation, which has no claim yet. Proposed c3 fixes that.

Proposed claims:
- **multirotor-turns-c3**: "Two rotors spin one way and two spin the other way. This keeps the drone from turning on the spot."
  - Source: MIT VNAV Lab 3. https://vnav.mit.edu/labs_2023/lab3/exercises.html
  - Quote: "on real quadrotors the motors are configured to rotate in different directions:
    two counter-clockwise (CCW), and two clockwise (CW). This configuration is necessary
    so that our quadrotor will be stable in its yaw direction."
- **multirotor-turns-c4**: "To hover, the rotors push up as hard as the drone weighs. To fly forward, it tilts and must push harder to keep its height."
  - Source: Rahul Vigneswaran K and Soman KP (Amrita Vishwa Vidyapeetham), "An Insight into the
    Dynamics and State Space Modelling of a 3-D Quadrotor", arXiv 1901.01051, 2019. https://arxiv.org/pdf/1901.01051
  - Quote: "When a quadrotor is hovering and is stationary, it has to produce enough overall
    thrust force (say F ) to equalize the gravitational force (say G) acting on it, that is
    F = G. So, in order to move forward, it has to make a pitch ." and "the quadrotor will
    lose altitude and overcome it, we must increase the thrust force F accordingly".
  - Caution: arXiv preprint; I did not confirm peer review. Swap for a textbook source if the
    fact-check gate wants one. (A Rose-Hulman source already in the file returned 403 to me.)

Steps:
1. **Spin directions stop the drone twirling** (c3).
   Can do: say why half the rotors spin the other way.
   Diagram: compare (all same way: body twists / mixed: body steady).
   Items: multirotor-turns-5, multirotor-turns-6.
2. **Uneven push tilts the drone** (c1).
   Can do: predict which way a drone tips from which rotors push harder.
   Diagram: compare (rear push more / front push more).
   Items: multirotor-turns-1, multirotor-turns-3, multirotor-turns-4.
3. **Hover means push equals weight** (c4, with c2 yaw as the recap).
   Can do: explain why a drone must add thrust when it tilts to fly forward.
   Diagram: flow (equal push = hover -> tilt -> part of push goes forward -> add push).
   Items: multirotor-turns-2, multirotor-turns-8, multirotor-turns-7.
- Note: step 1 has only 2 items; step 2 has the three near-copies. Better to rewrite
  multirotor-turns-4 into a hover/forward question for step 3 and move multirotor-turns-7 out.

---

## 3. battery-flight-time (Batteries and flight time)

Claims now: 2. c1 flight time depends on stored energy and rate of use. c2 a heavy battery adds weight, so more lift is needed.

Items:
- battery-flight-time-1 predict: heavier, bigger battery gives a smaller gain in time (diminishing gain).
- battery-flight-time-2 scenario: heavy camera means more lift needed (weight -> lift).
- battery-flight-time-3 estimate: 180 Wh / 90 W = 2 h (time = energy / power).
- battery-flight-time-4 choose: same energy, heavier battery, shorter flight (weight -> power).
- battery-flight-time-5 why: bigger battery, little gain, weight raises hover power (diminishing gain).
- battery-flight-time-6 fill: the rate is "power use" (time = energy / power).
- battery-flight-time-7 true-not-quite: twice the energy is not twice the time (diminishing gain).
- battery-flight-time-8 explain-it-back: flight-time charts are estimates (uncertainty).

Repeats:
- battery-flight-time-1 = battery-flight-time-5 = battery-flight-time-7 (bigger battery, smaller gain).
- battery-flight-time-3 = battery-flight-time-6 (energy divided by power).
- battery-flight-time-2 = battery-flight-time-4 (weight costs power).

Proposed claims:
- **battery-flight-time-c3**: "Adding more battery raises flight time only up to a point."
  - Source: Karan P. Jain and Mark W. Mueller, "Flying batteries: In-flight battery switching to
    increase multirotor flight time", UC Berkeley HiPeR Lab (2020 PDF).
    https://hiperlab.berkeley.edu/wp-content/uploads/2020/06/2020_FlyingBatteries.pdf
  - Quote: "we show that the achievable flight time only increases up to a certain point,
    as more battery is used on a vehicle."
- **battery-flight-time-c4** (optional): "Drones held up by rotors fly for less time and less distance than winged aircraft."
  - Same source.
  - Quote: "multirotors inherently have lower endurance and range as compared to fixed-wing aircraft".

Steps:
1. **Flight time is energy divided by power** (c1).
   Can do: work out hours from watt-hours and watts.
   Diagram: flow (stored energy -> power use -> hours in the air).
   Items: battery-flight-time-3, battery-flight-time-6, battery-flight-time-8.
2. **Extra weight makes the motors work harder** (c2).
   Can do: say why a heavier load cuts flight time.
   Diagram: compare (light drone: low power / heavy drone: high power).
   Items: battery-flight-time-2, battery-flight-time-4.
3. **A bigger battery helps only up to a point** (c3; c4 as a bonus line).
   Can do: explain why doubling the battery does not double the time.
   Diagram: scale (battery share of weight: small -> best -> too heavy).
   Items: battery-flight-time-1, battery-flight-time-5, battery-flight-time-7.
- All 8 items fit, but step 3 holds the three near-copies. Rewrite one of them
  (for example battery-flight-time-7) to test c4 (rotor vs winged drone).

---

## 4. flight-sensors (Flight sensors)

Claims now: 2. c1 an IMU senses fast turns and speed changes. c2 packs two facts: GPS finds place, barometer tracks height.

Items:
- flight-sensors-1 predict: a quick tilt is noticed by the IMU (IMU).
- flight-sensors-2 scenario: under a roof, the GPS signal weakens (GPS blocked).
- flight-sensors-3 estimate: trust the checked barometer (12 m) over weak GPS (barometer for height).
- flight-sensors-4 choose: the barometer reads air pressure (barometer, name only).
- flight-sensors-5 why: IMU senses motion between GPS fixes (IMU fills gaps).
- flight-sensors-6 fill: location comes from satellite signals (GPS).
- flight-sensors-7 true-not-quite: averaging blocked GPS does not make it exact (GPS blocked).
- flight-sensors-8 explain-it-back: under a roof, tilt sensing works, GPS gets worse (restates 1 + 2).

Repeats:
- flight-sensors-2 = flight-sensors-7 = flight-sensors-8 (a roof weakens GPS).
- flight-sensors-3 and flight-sensors-4 (barometer measures height).
- flight-sensors-8 also restates flight-sensors-1.

Proposed claims:
- First, split c2 into two claims (both already sourced in the file):
  "GPS can help find where the drone is." and "A barometer reads air pressure to help track height."
- **flight-sensors-c3**: "In open sky, a phone's GPS is usually right to within about 5 metres. Near buildings, bridges and trees it gets worse."
  - Source: GPS.gov, GPS Accuracy. https://www.gps.gov/gps-accuracy
  - Quote: "GPS-enabled smartphones are typically accurate to within a 4.9 m (16 ft.) radius
    under open sky ( view source at ION.org ). However, their accuracy worsens near
    buildings, bridges, and trees."
- **flight-sensors-c4**: "Air pressure falls as you go higher, so a pressure sensor can work out height."
  - Source 1: NASA Scientific Visualization Studio, item 3207. https://svs.gsfc.nasa.gov/cgi-bin/details.cgi?aid=3207
  - Quote: "The Earth's atmosphere exerts pressure based on the weight of the air above, so
    the pressure reduces with rising altitude."
  - Source 2: NOAA National Weather Service, Barometric Pressure Sensor. https://www.weather.gov/asos/BarometricPressureSensor.html
  - Quote: "Atmospheric pressure is the most crucial surface weather element for aircraft
    operations as it provides the means of establishing an aircraft's height above the ground."
- Spare Indian example (not needed for 3 steps): India has its own system, NavIC.
  - Source: ISRO, IRNSS Programme. https://www.isro.gov.in/IRNSS_Programme.html
  - Quote: "It is designed to provide accurate position information service to users in
    India as well as the region extending up to 1500 km from its boundary".

Steps:
1. **The IMU feels tilts and turns** (c1).
   Can do: pick the IMU for quick motion, even with no GPS.
   Diagram: flow (drone tilts -> IMU senses it -> motors correct).
   Items: flight-sensors-1, flight-sensors-5.
2. **GPS is good in open sky, worse indoors** (c3).
   Can do: predict when a GPS dot will wander.
   Diagram: compare (open sky: about 5 m / near buildings or under roof: worse).
   Items: flight-sensors-2, flight-sensors-7, flight-sensors-6.
3. **Air pressure drops as you climb** (c4).
   Can do: explain how a barometer tells height.
   Diagram: scale (ground: higher pressure -> up high: lower pressure).
   Items: flight-sensors-3, flight-sensors-4, flight-sensors-8.
- flight-sensors-8 fits step 3 only as a recap. Better: rewrite it to ask about height.

---

## 5. birds-and-planes (Why birds flap but planes do not)

Claims now: 2. c1 flaps give lift and thrust. c2 a plane uses fixed wings for lift and engines for thrust.

Items:
- birds-and-planes-1 predict: each wing stroke gives lift and forward push (flapping does both).
- birds-and-planes-2 scenario: a jet stays up because air flows past fixed wings (airflow lift).
- birds-and-planes-3 estimate: level flight, lift = weight = 500 N (lift vs weight).
- birds-and-planes-4 choose: the engine pushes a plane forward (thrust).
- birds-and-planes-5 why: both need air flowing past and turned down (airflow lift).
- birds-and-planes-6 fill: engine gives thrust, wings give lift (split jobs).
- birds-and-planes-7 true-not-quite: a plane with no engine still glides on fixed wings (airflow lift).
- birds-and-planes-8 explain-it-back: both use moving air for lift (airflow lift).

Repeats:
- birds-and-planes-2 = birds-and-planes-5 = birds-and-planes-7 = birds-and-planes-8 (air past a wing gives lift).
- birds-and-planes-4 = birds-and-planes-6 (engine gives thrust).
- Across concepts: birds-and-planes-3 copies lift-3 (lift = weight); birds-and-planes-2/-5 copy lift-2/lift-4.
  A learner doing both concepts meets the same fact 4+ times.

Proposed claims:
- **birds-and-planes-c3**: "Air pushes back on a moving plane. This push is called drag, and the engine's thrust must beat it."
  - Source: NASA Glenn, Four Forces on an Airplane. https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/four-forces-on-an-airplane/
  - Quotes: "The air resists the motion of the aircraft and the resistance force is called
    drag." and "To overcome drag, airplanes use a propulsion system to generate a force called thrust."
- **birds-and-planes-c4**: "A glider has no engine. In a steady glide it slowly loses height as it moves forward."
  - Source: NASA Glenn, Glide Angle. https://www.grc.nasa.gov/WWW/K-12/VirtualAero/BottleRocket/airplane/glidang.html
  - Quotes: "A glider is a special kind of aircraft that has no engine." and "If a glider is
    in a steady (constant velocity and no acceleration) descent, it loses altitude as it travels."

Steps:
1. **A flap gives both lift and push** (c1).
   Can do: say what one wing stroke does for a bird, and what a plane splits into two parts.
   Diagram: compare (bird: wings do both / plane: wings lift, engine pushes).
   Items: birds-and-planes-1, birds-and-planes-4, birds-and-planes-6.
2. **Engines beat drag, the air's push back** (c3, with c2).
   Can do: name the four forces and say which one the engine fights.
   Diagram: flow (thrust forward -> drag back; lift up -> weight down).
   Items: birds-and-planes-3, plus one new drag question.
3. **With no engine, a plane glides down slowly** (c4).
   Can do: explain why an engine-off plane or a still-winged bird can still fly, but sinks.
   Diagram: scale (height lost vs distance flown).
   Items: birds-and-planes-7, birds-and-planes-2, birds-and-planes-5.
- Left over: birds-and-planes-8 (repeat). Step 2 needs one new item on drag.

---

## 6. ceiling-fans (How a ceiling fan moves air)

Claims now: 2. c1 a fan moves room air with rotating blades. c2 a breeze cools skin; a fan does not make cold air.

Items:
- ceiling-fans-1 predict: with the window shut, room air moves faster (fan moves room air).
- ceiling-fans-2 scenario: a fan in an empty room cools no one (cools people, not rooms).
- ceiling-fans-3 estimate: the room air cools 0 degrees (does not cool air).
- ceiling-fans-4 choose: moving air helps sweat dry (evaporation).
- ceiling-fans-5 why: tilted blades push air along (blade angle).
- ceiling-fans-6 fill: an AC lowers temperature, a fan does not (does not cool air).
- ceiling-fans-7 true-not-quite: cooler skin is not cooler room air (does not cool air).
- ceiling-fans-8 explain-it-back: moving air cools skin, not the room (does not cool air).

Repeats:
- ceiling-fans-2 = ceiling-fans-3 = ceiling-fans-6 = ceiling-fans-7 = ceiling-fans-8.
  Five of eight items test "a fan does not cool the air". This is the worst case in the topic.

Proposed claims:
- **ceiling-fans-c3**: "With a ceiling fan on, you can set the AC about 2 °C warmer and feel just as comfortable."
  - Source: University of Arkansas Cooperative Extension, FSA1053 Ceiling Fans. https://www.uaex.uada.edu/publications/PDF/FSA-1053.pdf
  - Quote: "For hotter climates where air conditioning is required, a ceiling fan can allow
    the thermostat to be raised about 4°F with no reduction in comfort."
  - Note: 4 °F is about 2.2 °C. Say "about 2 °C".
- **ceiling-fans-c4**: "Longer blades set at a steeper angle move more air."
  - Same source.
  - Quote: "Less expensive fans have short blades with a shallow pitch (10° or less). To move
    more air, select a fan with longer blades and a pitch of 11–16°."
  - Note: the PDF text layer drops the dash and degree sign ("1116"); the printed sheet reads 11–16°.
    Check the printed PDF before quoting the numbers in the app.
- The same sheet also backs c2 more directly than the current sources:
  "No, ceiling fans cool people and not rooms. Run the fan only when someone is in the room."

Steps:
1. **Tilted blades push air along** (c4, with c1).
   Can do: say why blade angle and length matter.
   Diagram: compare (flat, short blades: little air / steep, long blades: more air).
   Items: ceiling-fans-5, ceiling-fans-1.
2. **A breeze cools skin, not the room** (c2).
   Can do: tell "feels cooler" apart from "air is cooler".
   Diagram: flow (moving air -> sweat dries -> skin feels cool).
   Items: ceiling-fans-4, ceiling-fans-7, ceiling-fans-3.
3. **A fan lets the AC work less** (c3).
   Can do: use a fan to set the AC about 2 °C higher, and switch it off in empty rooms.
   Diagram: scale (AC 24 °C alone vs 26 °C with fan, same comfort).
   Items: ceiling-fans-2, ceiling-fans-6.
- Left over: ceiling-fans-8 (repeat). Drop it.

---

## 7. upi-path (How UPI moves money)

Claims now: 2. c1 a UPI ID is a payment address linked to a bank account. c2 UPI moves money between bank accounts through NPCI.

Items:
- upi-path-1 predict: the money comes from her linked bank account (bank holds money).
- upi-path-2 scenario: a UPI ID tells the sender where to send (ID is an address).
- upi-path-3 estimate: deleting the app leaves the money in the bank (bank holds money).
- upi-path-4 choose: VPA means virtual payment address (ID is an address).
- upi-path-5 why: UPI moves money between bank accounts (bank holds money).
- upi-path-6 fill: the linked banks move the money (bank-to-bank).
- upi-path-7 true-not-quite: an ID alone does not prove payment; approval is needed (approval).
- upi-path-8 explain-it-back: an ID guides a bank-to-bank transfer through NPCI (restates all).

Repeats:
- upi-path-1 = upi-path-3 = upi-path-5 = upi-path-6 = upi-path-8 (the bank holds and moves the money).
- upi-path-2 = upi-path-4 (the ID is an address).
- upi-path-7 tests approval, which has no claim yet. Proposed c3 fixes that.

Proposed claims:
- **upi-path-c3**: "Each UPI payment is checked twice: by your bank-linked mobile number and by your secret UPI PIN."
  - Source: NPCI, UPI product page. https://www.npci.org.in/product/upi
  - Quote: "UPI combines ease of use with strong security while following RBI's two-factor
    authentication rule. The first factor is the mobile number linked to the user's bank,
    and the second is the UPI PIN, making transactions quick and safe from unauthorized access"
- **upi-path-c4**: "You type your UPI PIN only to pay, never to receive money."
  - Source: NPCI, Fraud Awareness. https://www.npci.org.in/fraud-awareness
  - Quote: "it's important to remember that scanning a QR code and entering a UPI PIN is only
    meant for making payments, not receiving them."
  - Why it helps: a useful safety fact, and a fresh setting (a scam message) for questions.
- Spare (scale step, optional): "In September 2026, UPI carried about 2,400 crore payments in one month."
  - Source: NPCI, UPI Product Statistics. https://www.npci.org.in/product/upi/product-statistics
  - Figure: "September-2026 756 24,068.38 29,37,396.67" (banks live, volume in million, value in crore).
  - Note: 24,068 million = about 2,407 crore payments, across 756 banks. Monthly figure; refresh on re-check.
- NPCI pages load only in a browser (JavaScript). Plain fetchers get 403. Read with headless Chromium.

Steps:
1. **A UPI ID is an address, not a wallet** (c1).
   Can do: say what someone can and cannot do with your UPI ID.
   Diagram: flow (UPI ID -> finds the bank account -> money lands there).
   Items: upi-path-2, upi-path-4, upi-path-3.
2. **Your PIN approves every payment you send** (c3, with c2).
   Can do: name the two checks, and say that NPCI routes the money between banks.
   Diagram: flow (you approve with PIN -> NPCI routes -> your bank pays their bank).
   Items: upi-path-7, upi-path-6, upi-path-1.
3. **Never type a PIN to receive money** (c4).
   Can do: spot a "enter PIN to get your refund" scam.
   Diagram: compare (paying: PIN needed / receiving: no PIN, ever).
   Items: upi-path-5, plus one new scam question.
- Left over: upi-path-8 (repeat). Step 3 needs one new item.

---

## 8. phone-camera (How a phone camera takes a photo)

Claims now: 2. c1 tiny sensor sites turn light into charge. c2 red, green and blue filters help make a colour photo.

Items:
- phone-camera-1 predict: a dim room sends less light to the sensor (amount of light).
- phone-camera-2 scenario: each sensor spot records how much light hits it (sensor sites).
- phone-camera-3 estimate: about 50% of the filter grid is green (green share).
- phone-camera-4 choose: the sensor first turns light into a signal (sensor sites).
- phone-camera-5 why: different lenses send different light (lens).
- phone-camera-6 fill: the last step turns readings into an image (processing).
- phone-camera-7 true-not-quite: each pixel records only a light reading (sensor sites).
- phone-camera-8 explain-it-back: light, then sensor signals, then processing (processing).

Repeats:
- phone-camera-2 = phone-camera-4 = phone-camera-7 (a sensor site reads light).
- phone-camera-6 = phone-camera-8 (processing makes the photo).
- phone-camera-3 tests the 50% green figure, which has no claim yet. Proposed c3 fixes that.

Proposed claims:
- **phone-camera-c3**: "Most camera sensors have twice as many green filters as red or blue ones. Green carries most of the detail our eyes see."
  - Source: Russ Palum, Eastman Kodak, "Image Sampling with the Bayer Color Filter Array",
    IS&T PICS 2001. https://www.imaging.org/common/uploaded%20files/pdfs/Papers/2001/PICS-0-251/4631.pdf
  - Quotes: "When the patent rights expired the pattern became an industry standard. This CFA
    pattern has twice as many green filtered pixels as red or blue filtered pixels. This is
    done to better preserve image sharpness." and "Most of the resolution as seen by the eye
    is due to luminance, which is dominated by the green channel."
- **phone-camera-c4**: "In dim light, the camera needs a longer exposure to collect enough light, so moving things can blur."
  - Source: NASA, Smartphone Astrophotography guide. https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/a/Astrophotography_Guide.pdf
  - Quotes: "For fast-moving objects in bright scenery such as speeding cars or athletes, short
    exposures produce unblurred images. For very dim lighting you will need much longer
    exposures to gather enough light." and "if the exposure is `too long' the object will move and blur the image."
- Spare from the same guide: "the larger the aperture, the more light it will allow to enter and be focused on the array."

Steps:
1. **Each sensor dot measures light** (c1).
   Can do: say what one pixel records (an amount of light, not a colour picture).
   Diagram: flow (light -> lens -> sensor dots -> numbers).
   Items: phone-camera-2, phone-camera-7, phone-camera-4.
2. **Colour comes from a grid of filters** (c3, with c2).
   Can do: explain the red-green-blue grid and why half of it is green.
   Diagram: scale (green 50%, red 25%, blue 25%).
   Items: phone-camera-3, phone-camera-6, phone-camera-8.
3. **Dim light needs a longer exposure** (c4).
   Can do: predict blur in a dark room and how to avoid it (hold still, more light).
   Diagram: compare (bright: short exposure, sharp / dim: long exposure, blur risk).
   Items: phone-camera-1, phone-camera-5.
- All 8 fit, but steps 1 and 2 each still hold a near-copy (phone-camera-4, phone-camera-8).

---

## 9. sky-colours (Blue sky and red sunsets)

Claims now: 2. c1 shorter blue wavelengths scatter more than red. c2 at sunset light crosses more air, so direct light looks red or orange.

Items:
- sky-colours-1 predict: blue spreads most across the sky (blue scatters).
- sky-colours-2 scenario: the sunset Sun looks orange because light passed through more air (long path).
- sky-colours-3 estimate: blue scatters about 6 times more than red (scatter strength).
- sky-colours-4 choose: blue scatters more because of its shorter wavelength (blue scatters).
- sky-colours-5 why: the sky and the low Sun reach you by different paths (both ideas).
- sky-colours-6 fill: at sunset light crosses a longer path of air (long path).
- sky-colours-7 true-not-quite: the blue was scattered away along the path (long path).
- sky-colours-8 explain-it-back: blue spreads sideways, a long path leaves red (both ideas).

Repeats:
- sky-colours-1 = sky-colours-4 (blue scatters more); sky-colours-3 is the number version.
- sky-colours-2 = sky-colours-6 = sky-colours-7 (long path at sunset).
- sky-colours-5 = sky-colours-8 (both ideas together).

Proposed claims:
- **sky-colours-c3**: "Sunlight looks white, but it is a mix of all colours, from red to violet."
  - Source: Encyclopaedia Britannica, "Why Is the Sky Blue?" https://www.britannica.com/story/why-is-the-sky-blue
  - Quote: "Sunlight appears white, but this white light is made up of all the colors of the
    visible spectrum, ranging from red through violet."
- **sky-colours-c4**: "Violet light scatters too, but the sky looks blue because our eyes are more sensitive to blue."
  - Same source.
  - Quote: "However, the midday sky appears blue, rather than a combination of blue and
    violet, because our eyes are more sensitive to blue light than to violet light."
- Britannica loads only in a browser (plain fetch gets 403). Read with headless Chromium.

Steps:
1. **White sunlight hides every colour** (c3).
   Can do: say that white light is a mix, so air can pull colours apart.
   Diagram: flow (white sunlight -> red, orange, yellow, green, blue, violet).
   Items: one new item (none of the 8 test this). Use sky-colours-5 as the review.
2. **Air scatters blue more than red** (c1; c4 as the "why not violet" line).
   Can do: explain the blue sky, and why it is not violet.
   Diagram: scale (scatter strength: red 1x -> blue about 6x).
   Items: sky-colours-1, sky-colours-3, sky-colours-4.
3. **A longer path leaves the reds** (c2).
   Can do: explain why the low Sun looks orange.
   Diagram: compare (noon: short path, white Sun / sunset: long path, orange Sun).
   Items: sky-colours-2, sky-colours-7, sky-colours-6.
- Left over: sky-colours-8 (repeat of sky-colours-5). Step 1 needs a new item.

---

## 10. pressure-cooker (Pressure cooker)

Claims now: 2. c1 water boils at a higher temperature under more pressure. c2 a cooker cooks faster because its water and steam get hotter than an open boil.

Items:
- pressure-cooker-1 predict: the boiling point rises with pressure (pressure -> boiling point).
- pressure-cooker-2 scenario: the cooker can boil hotter than an open pot (cooker is hotter).
- pressure-cooker-3 estimate: about 121 °C at full pressure (the number).
- pressure-cooker-4 choose: higher pressure raises the boiling point (pressure -> boiling point).
- pressure-cooker-5 why: dal cooks sooner because the water is hotter (cooker is hotter).
- pressure-cooker-6 fill: going down a hill raises the boiling point (altitude).
- pressure-cooker-7 true-not-quite: a bigger flame does not raise the boiling point (flame vs pressure).
- pressure-cooker-8 explain-it-back: higher pressure allows a hotter boil (pressure -> boiling point).

Repeats:
- pressure-cooker-1 = pressure-cooker-4 = pressure-cooker-8 (pressure raises boiling point).
- pressure-cooker-2 = pressure-cooker-5 (the cooker boils hotter).
- pressure-cooker-6 tests altitude, which has no claim yet. Proposed c3 fixes that.

Proposed claims:
- **pressure-cooker-c3**: "High up, air pressure is lower, so water boils below 100 °C and boiled food takes longer. At about 3,000 metres it boils near 89 °C."
  - Source: Colorado State University Extension, High Elevation Food Preparation. https://extension.colostate.edu/resource/high-elevation-food-preparation/
  - Quotes: "Air pressure decreases as elevation increases." Table 1: "Sea Level 212 °F ...
    10,000 ft. 193 °F". And: "foods prepared by boiling or simmering cook at a lower
    temperature at high elevation than at sea level, and thus, require a longer cooking time."
  - Note: 193 °F = 89.4 °C; 10,000 ft = 3,048 m.
- **pressure-cooker-c4**: "A cooker's valve holds the steam until the pressure is about double, so the water can reach about 121 °C."
  - Source: HyperPhysics, Georgia State University, Pressure Cooker. http://hyperphysics.phy-astr.gsu.edu/hbase/thermo/precook.html
  - Quotes: "The pressure cooker consists of a pressurized pot which has controlled vent at a
    specified pressure above atmospheric pressure. It is typical for the pressure of venting
    to be about 15 pounds per square inch above atmospheric pressure." and "a gauge pressure
    of 15 lb/in2 amounts to about a doubling of absolute pressure. The nature of the
    variation of saturation vapor pressure with temperature places the boiling point at about 121°C."
  - Warning: the same page says "121°C or 257 °F". 121 °C is about 250 °F. Do not copy the °F figure.

Steps:
1. **Less air pressure, lower boiling point** (c3).
   Can do: predict that dal takes longer to cook in a hill town.
   Diagram: scale (sea level 100 °C -> 3,000 m about 89 °C).
   Items: pressure-cooker-6, plus pressure-cooker-1.
2. **A sealed pot raises the pressure** (c4, with c1).
   Can do: explain what the valve or whistle does and why the water reaches about 121 °C.
   Diagram: flow (seal -> steam builds -> pressure about doubles -> boils at about 121 °C).
   Items: pressure-cooker-3, pressure-cooker-4, pressure-cooker-7.
3. **Hotter water cooks food faster** (c2).
   Can do: compare an open pot and a cooker, both "boiling".
   Diagram: compare (open pot: 100 °C, slow / cooker: about 121 °C, fast).
   Items: pressure-cooker-2, pressure-cooker-5.
- Left over: pressure-cooker-8 (repeat). Drop it.

---

## Other things found while checking

- **NPCI FAQ link is dead.** `https://www.npci.org.in/what-we-do/upi/faqs` (source `npci-upi-faq`
  in upi-path) now renders "404 Page Not Found" in headless Chromium (checked 2026-10-22).
  Replace with https://www.npci.org.in/product/upi, which carries the UPI-PIN FAQ.
- **ceiling-fans `fan` source is a regulation page.** https://www.energy.gov/cmei/buildings/ceiling-fans
  covers efficiency standards and test procedures, not how fans cool people. The Arkansas sheet above
  is a better fit for c1 ("Ceiling fans utilize hub-mounted rotating paddles in order to produce a
  cooling effect as a result of air circulation.") and c2.
  The `cooling` source does back c2: "fans do not generate cool air; they only move existing air,
  making humans feel cooler by evaporating moisture from your skin."
- **DOE "Fans for Cooling" pages now return 404** (energy.gov/energysaver/fans-cooling and the
  home-cooling-systems path). I did not use them.
- **USDA high-altitude page** (source `usda-pressure`) returns 403 to plain and headless fetches,
  so I could not re-read it. The CSU Extension page above covers the same facts.
- **Cross-concept repeat:** lift and birds-and-planes both teach "air past a wing gives lift" and
  "lift = weight". When both get steps, give birds-and-planes the drag and gliding steps
  (proposed c3, c4) so the two concepts stop overlapping.
- **Questions with no matching claim today:** lift-1/-5 (speed), multirotor-turns-5 (spin
  directions), phone-camera-3 (50% green), pressure-cooker-6 (altitude), upi-path-7 (approval).
  The proposed claims give each of these a sourced claim to hang on.
