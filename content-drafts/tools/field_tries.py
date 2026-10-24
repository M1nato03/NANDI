# Field try drafts (spec 21 Part B) for every concept on content-walk. Run: python -I field_tries.py <content root> <out.json>
# Each row: conceptId, detail (<= 90 chars, countable, real world, today), smaller, cues (2-3), settings (2-3 re-offer
# settings), notice claim id (the fixed sourced line comes from that claim), notice text.
import json, glob, os, sys

T = [
# body-training
("progressive-overload", "Count one load you already carry today, like the stairs to your floor.", "Count the stairs to one floor.",
 ["On the stairs at home", "Carrying the shopping"], ["At college or work", "With a bag you carry daily"],
 "progressive-overload-c3", "Strength grows when the load, the reps or the days go up bit by bit."),
("muscle-protein-rest", "At one meal today, name the food on your plate that carries protein.", "Name one protein food you ate today.",
 ["At lunch", "At dinner"], ["At a canteen or mess", "At a family meal"],
 "muscle-protein-rest-c4", "Most people who train can get enough protein from food alone, without powders."),
("sleep-recovery", "Tonight, note when you put the phone down and when you wake up.", "Note just your wake-up time tomorrow.",
 ["When I set my alarm", "When I plug in my phone"], ["On a weekend night", "Before a match or exam day"],
 "sleep-recovery-c2", "Experts advise adults to sleep 7 to 9 hours a night."),
("heat-hydration", "Check today's hottest hours in a weather app, and when it is cooler.", "Check today's top temperature.",
 ["Before stepping out", "When I plan a walk or game"], ["On a humid day", "Before a weekend game"],
 "heat-hydration-c2", "In hot weather, training early or late, when it is cooler, and starting slow cut heat strain."),
("warmup-myths", "Watch people at a ground, park or gym, and spot the easy start.", "Recall how your last game began: easy or hard?",
 ["At the park", "At a match"], ["A cricket practice", "A dance or sports class"],
 "warmup-myths-c2", "A warm-up is usually the activity done slower or lighter, so heart rate and breathing rise bit by bit."),
("cardio-talk-test", "On a walk today, say a full sentence and notice if you could sing.", "Notice your breath at the top of one flight of stairs.",
 ["Walking to class or work", "Taking the stairs"], ["A brisk walk with a friend", "Cycling"],
 "cardio-talk-test-c1", "At moderate effort you can talk but not sing; at vigorous effort only a few words come out."),
("showing-up", "Right after one thing you do daily, walk or take the stairs for 2 minutes.", "Take one flight of stairs after a daily act.",
 ["After brushing", "After lunch"], ["After a class or meeting", "After the evening tea"],
 "showing-up-c2", "Brisk bouts of any length count, so even a few flights of stairs counts."),
("food-labels", "Pick up one pack at home and find its added sugars line.", "Find the ingredients list on one pack.",
 ["In the kitchen", "At a shop"], ["On a drink bottle", "On a biscuit pack"],
 "food-labels-c3", "Labels show total sugars and added sugars as separate lines; added sugars are only the sugars put in."),
# health-nutrition
("protein-foods", "At one meal today, name the cereal and the pulse on your plate.", "Name one protein food at one meal.",
 ["At lunch", "At dinner"], ["At a canteen or mess", "At a wedding or party meal"],
 "protein-foods-c2", "Cereals or millets and pulses can fill gaps in each other's amino acid mix."),
("free-sugars", "Read the sugar line on one drink you see today.", "Find the word sugar in one ingredients list.",
 ["At a shop", "At home"], ["On a juice pack", "On a sauce bottle"],
 "free-sugars-c4", "One can of sugar-sweetened soda can hold up to 40 g of free sugars, about 10 teaspoons."),
("hydration-cues", "Today, count your drinks, tea and milk included. There is no target.", "Count your drinks from morning to lunch.",
 ["From breakfast", "When I fill my bottle"], ["On a hot day", "On a busy college or work day"],
 "hydration-cues-c2", "Water, milk and lower-sugar drinks, tea and coffee included, all count towards daily fluid."),
("sleep-recovery", "Set tomorrow's wake time tonight, and note if you woke near it.", "Note what time you woke tomorrow.",
 ["When I set my alarm", "When I put my phone down"], ["On a weekend", "Before an early day"],
 "sleep-recovery-c4", "The same bed and wake time each day is one of the habits that help sleep."),
("exercise-heart", "Count your brisk minutes today, walks and stairs included.", "Count the brisk minutes of one walk.",
 ["On my way to class or work", "On an evening walk"], ["On a college day", "On a holiday"],
 "exercise-heart-c5", "Activity can be spread through the week in smaller chunks, and some is better than none."),
("iron-and-anaemia", "At a meal with dal or greens, spot a vitamin C food, like lemon or guava.", "Name one vitamin C food in your kitchen.",
 ["At lunch", "At dinner"], ["At a canteen", "At a family meal"],
 "iron-and-anaemia-c1", "Vitamin C foods like guava, oranges or lemon help the body take in iron from plant foods."),
("food-label-reading", "At a shop, compare two similar packs on the same per-100 g line.", "Find the per-100 g column on one pack.",
 ["At a shop", "In the kitchen"], ["Two biscuit packs", "Two drinks"],
 "food-label-reading-c1", "Values per 100 g or 100 ml let you compare like foods; each brand sets its own serving size."),
("fad-diet-claims", "Spot one ad that says one food does it all, and name a food group it leaves out.", "Spot one superfood claim today.",
 ["While scrolling", "At a shop"], ["On a supplement pack", "In a reel or video"],
 "fad-diet-claims-c1", "No one food gives all the key nutrients, which is why the guide says to eat from many food groups."),
# history-civilisations
("indus-cities", "On a walk, find where rain or used water leaves a building for a drain.", "Find one drain cover on your street.",
 ["Walking to class or work", "On an evening walk"], ["In an old part of town", "After rain"],
 "indus-cities-c2", "All the streets and lanes of Mohenjo-daro had drains, most covered with baked bricks."),
("ashoka-edicts", "Find one public notice and ask who can read it, and who it misses.", "Spot one public sign in two languages.",
 ["At a bus stop or station", "On my street"], ["At a government office", "At a temple, mosque or church"],
 "ashoka-edicts-c5", "Most people in Ashoka's time could probably not read, so officers were sent to spread the message."),
("silk-road-ideas", "Ask an elder where one food or word you use daily came from.", "Name one everyday thing that came from far away.",
 ["On a call home", "At a family meal"], ["A friend from another state", "A shopkeeper"],
 "silk-road-ideas-c4", "Monks forced out of Gandhara carried its art style, which then grew popular at Buddhist sites elsewhere."),
("indian-place-value", "Spot one price or number with a zero in the middle, and say what it holds open.", "Find one number with a zero today.",
 ["At a shop", "On a bill"], ["On a bus or train number", "On a phone number"],
 "indian-place-value-c1", "In the Indian base ten system, zero can mark an empty place in a number."),
("printing-and-reading", "Ask at home how many people read one shared newspaper or book.", "Notice one printed page many people see today.",
 ["At breakfast", "On a call home"], ["At a library", "At a tea stall with a paper"],
 "printing-and-reading-c5", "Printing put knowledge within reach of every person who knew how to read."),
("mughal-revenue", "At a bank, post office or ration shop, spot one record they keep.", "Name one record your family keeps for a service.",
 ["When I run an errand", "On the way home"], ["On a bill at home", "At a college office"],
 "mughal-revenue-c4", "Mughal zabt worked where officials could survey land and keep careful accounts."),
("company-trade-rule", "Find where three things at home were made, from their labels.", "Find the made-in line on one item.",
 ["In my room", "In the kitchen"], ["At a market", "On a phone or charger box"],
 "company-trade-rule-c1", "In 1600 the East India Company got a charter giving it the sole English right to trade with the East."),
("independence-constitution", "Find one rule at college, work or your building, and ask who made it.", "Read one rule on a notice board.",
 ["At college or work", "In my building"], ["A housing society rule", "A family rule, on a call home"],
 "independence-constitution-c3", "While debating the draft, the Assembly discussed and decided 2,473 of the 7,635 changes put forward."),
# how-things-work
("lift", "Fold a paper glider, throw it gently, and watch what happens as it slows.", "Watch a bird or kite glide, and notice when it slows.",
 ["After class", "At home this evening"], ["Outdoors with a friend", "A kite on a windy day"],
 "lift-c1", "Lift needs air moving past a wing; no air or no motion means no lift."),
("multirotor-turns", "Watch a drone, live or in a video, and spot it tilt before it moves.", "In one drone video, spot one tilt.",
 ["At an event", "While watching videos"], ["A wedding with a camera drone", "A drone show clip"],
 "multirotor-turns-c5", "Every pitch or roll aims part of the push sideways, so a tilted drone starts to move."),
("battery-flight-time", "Note your phone's battery % now and in one hour, and what you used it for.", "Open the battery screen and find the top app.",
 ["When I unplug my phone", "At lunch"], ["On a travel day", "On a video-heavy evening"],
 "battery-flight-time-c1", "Flight time depends on stored energy and the rate at which it is used."),
("flight-sensors", "Open a map app outdoors, then indoors, and compare the circle round the dot.", "Open your map app indoors and look at the circle.",
 ["On my way out", "At college or work"], ["Between tall buildings", "In a park"],
 "flight-sensors-c3", "GPS phones are usually within 4.9 metres under open sky, but buildings and indoor use make it worse."),
("birds-and-planes", "Watch a bird take off and notice the downstroke.", "Watch one bird flap for 10 seconds.",
 ["On a balcony", "At a park"], ["Pigeons at a station", "Crows on a wire"],
 "birds-and-planes-c5", "In small parrots, the downstroke uses nearly all the flapping power, and the upstroke costs almost none."),
("ceiling-fans", "Stand under a fan, then away from it. Is the room cooler, or just you?", "Notice one fan running in an empty room.",
 ["In my room", "In a classroom or office"], ["On a humid day", "On a dry day"],
 "ceiling-fans-c3", "Moving air helps sweat dry off your skin, which is mainly how a fan makes you feel cooler."),
("upi-path", "On your next UPI payment, read the payee's name and UPI ID before you approve.", "Find your own UPI ID in your app.",
 ["At a shop QR", "Paying a friend"], ["Splitting a bill", "Paying online"],
 "upi-path-c1", "A UPI ID is a payment address that points to a linked bank account."),
("phone-camera", "Take one photo in dim light and one in daylight, then zoom in on each.", "Zoom into one photo you took at night.",
 ["This evening", "In my room"], ["At a dim restaurant", "Outdoors at dusk"],
 "phone-camera-c5", "A high ISO in dim light gives a bright but grainy photo, because it multiplies the signal."),
("sky-colours", "At sunset, look at the sky away from the Sun and name its colours.", "Look up at midday and note the sky's colour.",
 ["On my way home", "From a terrace or window"], ["On a cloudy evening", "On a hazy day"],
 "sky-colours-c2", "At sunset, sunlight takes a longer path through the air, so mostly yellow to red reaches us."),
("pressure-cooker", "On one cooker meal at home, count the whistles from a safe distance.", "When it is cold, find the weight on your cooker's vent.",
 ["At lunch time", "At dinner time"], ["Cooking dal", "At a relative's home"],
 "pressure-cooker-c2", "A pressure cooker cooks faster because its higher pressure raises the boiling point of the water."),
# money-markets
("inflation", "Ask an elder what one everyday item cost when they were your age.", "Note today's price of one thing you buy often.",
 ["On a call home", "At a family meal"], ["At a tea stall", "With a grandparent"],
 "inflation-c2", "A rise in broad prices cuts what a fixed amount of cash can buy."),
("compounding", "Find one savings interest rate, and work out a year's interest on 1,000.", "Find one savings interest rate.",
 ["When I open my bank app", "On a bank's website"], ["A post office scheme", "A fixed deposit ad"],
 "compounding-c1", "Compound growth includes growth on past gains as well as on the starting amount."),
("rule-of-72", "Find one interest rate on a card, loan or deposit ad, and divide 72 by it.", "Divide 72 by one rate you see today.",
 ["While scrolling", "At a bank or shop"], ["A credit card offer", "A fixed deposit ad"],
 "rule-of-72-c4", "The rule works for debt too: an unpaid card balance at 18% doubles in about four years."),
("risk-return", "Spot one ad that promises high returns, and look for its risk line.", "Spot one guaranteed-returns claim today.",
 ["While scrolling", "On a hoarding"], ["In a reel or video", "In a group chat forward"],
 "risk-return-c2", "A high possible gain may mean more risk. The gain is not sure."),
("diversification", "Open one index fund's fact sheet and count the industries it holds.", "Name 3 industries one fund invests in.",
 ["When I have 5 minutes", "On my laptop"], ["A sector fund's sheet", "A friend's fund, if they share it"],
 "diversification-c3", "Four or five shares are not a real spread; one guide asks for at least a dozen, across many industries."),
("shares", "Pick one thing you used today and find the company that makes it.", "Name the company behind one thing you used.",
 ["At breakfast", "At a shop"], ["Your phone's maker", "Your favourite snack"],
 "shares-c1", "A share gives part ownership of a company."),
("emergency-fund", "Recall one surprise cost from the last year, like a phone repair, and its size.", "Name one surprise cost you have heard of.",
 ["On my way home", "When I check my spending"], ["With a flatmate", "On a call home"],
 "emergency-fund-c1", "An emergency fund is cash kept for a sudden need."),
("loan-emi", "Find one EMI offer and note the months and the total you would pay.", "Spot one EMI offer today.",
 ["While shopping online", "At an electronics shop"], ["A phone EMI offer", "A bike or scooter offer"],
 "loan-emi-c3", "A longer loan term makes each EMI smaller but means paying more interest in total."),
("index-funds", "Find the expense ratio of one index fund and one active fund.", "Find the expense ratio of one fund.",
 ["When I have 5 minutes", "On my laptop"], ["Two large-cap funds", "A fund a friend mentions"],
 "index-funds-c4", "Index funds trade little, so their expense ratios are lower than active funds'."),
("upi-scams", "Tell one person at home: getting money never needs a PIN or a QR scan.", "Save 1930 in your contacts.",
 ["On a call home", "In a family group chat"], ["An older relative", "A friend new to UPI"],
 "upi-scams-c3", "RBI says getting money never needs a QR scan or a PIN."),
# psychology
("habits", "Watch one of your daily acts and name its cue, like a place or the act before.", "Name the cue for brushing your teeth.",
 ["In the morning", "When I get home"], ["At college or work", "On a weekend"],
 "habits-c1", "Cues in a stable setting can bring back a learned action with little thought."),
("loss-aversion", "Spot one line worded as a loss, like 'Don't miss out', and say it as a gain.", "Spot one 'Don't miss out' line today.",
 ["While scrolling", "At a shop"], ["In a sale email", "On a hoarding"],
 "loss-aversion-c2", "A loss tends to weigh more than a gain of the same size."),
("anchoring", "Spot one 'was this, now that' price, and ask what the first number does.", "Spot one crossed-out price today.",
 ["While shopping online", "At a shop"], ["A sale banner", "A menu"],
 "anchoring-c1", "A first number can pull a later estimate toward it, because people adjust away from it too little."),
("confirmation-bias", "Pick one small belief, like your fastest route, and look for a clue against it.", "Name one clue that could prove a small belief wrong.",
 ["On my way to class or work", "In a group chat"], ["A cricket or film opinion", "A rumour you heard"],
 "confirmation-bias-c2", "A rule is tested properly by checking the cases that could prove it false."),
("social-proof", "Spot one crowd cue, like '10k bought this', and ask if it is proof.", "Spot one bestseller tag today.",
 ["While shopping online", "While scrolling"], ["A busy food stall", "A trending post"],
 "social-proof-c4", "A group can agree on a wrong answer, so agreement alone is a clue, not proof."),
("planning-fallacy", "Before one small task today, guess the minutes; after, note the real time.", "Guess your travel time today, then check it.",
 ["Before studying", "Before a chore"], ["A work task", "Getting ready to go out"],
 "planning-fallacy-c3", "In one study, linking past tasks to a new plan removed the too-short bias."),
("sleep-memory", "After you study something today, sit quietly for 5 minutes before the next thing.", "Sit quietly for 2 minutes after one lesson.",
 ["After a class", "After this lesson"], ["After a work training", "After reading a chapter"],
 "sleep-memory-c2", "A brief spell of quiet rest after learning helped memory more than spending that time on other tasks."),
("variable-rewards", "Count how many times you check one app before noon. There is no target.", "Notice one check that found nothing new.",
 ["From waking up", "From my first class"], ["On a weekend", "On a busy day"],
 "variable-rewards-c3", "On a variable schedule, you cannot tell which try will bring the reward."),
("if-then-plans", "Write one plan for today: 'If [moment], then I will [act].'", "Say one if-then plan out loud.",
 ["At breakfast", "When I open my planner"], ["For a study session", "For a call you keep putting off"],
 "if-then-plans-c1", "An if-then plan spells out the when, where and how in advance."),
("spotlight-effect", "Ask a friend if they remember what you wore yesterday.", "Try to recall what a friend wore yesterday.",
 ["At college or work", "In a group chat"], ["A classmate", "A flatmate or sibling"],
 "spotlight-effect-c1", "People wearing a striking T-shirt guessed that more people could recall it than really could."),
]

root, out = sys.argv[1], sys.argv[2]
concepts = {}
for f in sorted(glob.glob(root + "/content/topics/*.json")):
    d = json.load(open(f, encoding="utf-8"))
    topic = os.path.basename(f)[:-5]
    for m in d["body"]["modules"]:
        for c in m["concepts"]:
            concepts[(topic, c["id"])] = c

errors, rows, seen = [], [], set()
# sleep-recovery exists in two topics: body first, health second, as in T.
def topic_of(cid, nth):
    hits = [k for k in concepts if k[1] == cid]
    hits.sort()
    return hits[min(nth, len(hits) - 1)]
count = {}
for (cid, detail, smaller, cues, settings, claim_id, notice) in T:
    n = count.get(cid, 0); count[cid] = n + 1
    key = topic_of(cid, n)
    c = concepts[key]
    claim = next((x for x in c["claims"] if x["id"] == claim_id), None)
    if claim is None: errors.append(f"{key}: no claim {claim_id}")
    if len(detail) > 90: errors.append(f"{key}: detail {len(detail)} chars")
    for s in cues + settings + [smaller]:
        if len(s) > 60: errors.append(f"{key}: {s!r} over 60")
    if not (2 <= len(cues) <= 3 and 2 <= len(settings) <= 3): errors.append(f"{key}: cues/settings count")
    seen.add(key)
    rows.append({"topic": key[0], "conceptId": cid, "oldQuest": c.get("quest"),
                 "fieldTry": {"title": c["title"], "detail": detail, "smaller": smaller, "cues": cues, "settings": settings,
                              "notice": notice, "sourceRefs": claim["sourceRefs"] if claim else []},
                 "noticeClaim": {"id": claim_id, "text": claim["text"] if claim else None}})
missing = sorted(set(concepts) - seen)
if missing: errors.append(f"missing concepts: {missing}")
json.dump({"draft": "Field try drafts for editors (idea engine, 24 Oct 2026). Spec 21 Part B. Not fact-checked by an editor.",
           "basedOn": "origin/content-walk", "count": len(rows), "rows": rows}, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(rows), "rows;", len(concepts), "concepts;", "errors:", errors or "none")
