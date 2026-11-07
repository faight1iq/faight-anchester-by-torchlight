# Builds e11-agnostic.json: find/replace pairs that take the player names out of E11 (rooms are built for kinds of character).
import json

ROLE = {
    "P1": "a protector, best one who fights at range: a Dread Insight about being watched, or about failing someone who needed help",
    "P2": "a healer: a Dread Insight about what they would do for a cure",
    "P3": "a spellcaster: a Dread Insight about where their power, or they themselves, came from",
    "P4": "a ranged fighter, best one with a crossbow: a Dread Insight about the undead, or about the Unholy Cow of Paschendale (Episode Four)",
    "P5": "a collector of occult objects, best one who grapples: a Dread Insight about blindness or losing an eye",
    "P6": "a character who survives by hiding: a Dread Insight about helplessness, or a duty to the dead",
}
def head(k): return f"<p><em>Solo. Built for {ROLE[k]}. Night. ~30 min.</em></p>"

pages = {
"P1. The Ward of Watchers": [
 ('<p><em>Elias "Grey" Harlan. Solo. Night. ~30 min.</em></p>', head("P1")),
 ("<h3>What Elias Sees</h3>", "<h3>What the Dreamer Sees</h3>"),
 ("<p>Elias wakes in the aisle. All three doors are locked. All six sleepers beg him for help.", "<p>The dreamer wakes in the aisle. All three doors are locked. All six sleepers beg them for help."),
 ("and they call him by name.", "and they call the dreamer by name."),
 ("it never says his name and only asks,", "it never says the dreamer's name and only asks,"),
 ("Play the voices and let him notice the difference.", "Play the voices and let the dreamer notice the difference."),
 ("Count rounds from Elias's first turn:", "Count rounds from the dreamer's first turn:"),
 ("<p>When Elias pulls back a false sheet,", "<p>When the dreamer pulls back a false sheet,"),
 ("<p>To free the real sleeper, Elias pulls back its sheet", "<p>To free the real sleeper, the dreamer pulls back its sheet"),
 ("If the sleeper woke, Elias's key and", "If the sleeper woke, the dreamer's key and"),
],
"P2. The Dissection Room": [
 ("<p><em>Sister Colette Claire Curie. Solo. Night. ~30 min.</em></p>", head("P2")),
 ("<h3>What Sister Curie Sees</h3>", "<h3>What the Dreamer Sees</h3>"),
 ("and every name is one of your own cadavers.", "and every name is one of your own patients."),
 ("<p>Sister Curie wakes beside the table.", "<p>The dreamer wakes beside the table."),
 ("<p><strong>Protect him (her passion).</strong> She keeps the patient alive and destroys the Stitched. Warding Bond, Shield Master and standing in its way all count.",
  "<p><strong>Protect him.</strong> The dreamer keeps the patient alive and destroys the Stitched. Healing, warding spells and standing in its way all count."),
 ("<p><strong>Take the sample (her Dread Insight).</strong> She can use an action", "<p><strong>Take the sample (the temptation).</strong> The dreamer can use an action"),
 ("The vial fills with the cure; when she wakes, it is ash. She gains a Tormenting Curse (Wisdom).", "The vial fills with the cure; on waking, it is ash. The dreamer gains a Tormenting Curse (Wisdom)."),
 ("Sister Curie's key and", "The dreamer's key and"),
],
"P3. The Room of Corners": [
 ("<p><em>Isra Noctis. Solo. Night. ~30 min.</em></p>", head("P3")),
 ("<h3>What Isra Sees</h3>", "<h3>What the Dreamer Sees</h3>"),
 ("<p>Isra Noctis wakes here alone.", "<p>The dreamer wakes here alone."),
 ("<p>At the start of Isra's first turn a voice comes through", "<p>At the start of the dreamer's first turn a voice comes through"),
 ("It says it knows who made him and will tell him if he listens. While it speaks, Isra has Disadvantage", "It says it knows who made them and will tell them if they listen. While it speaks, the dreamer has Disadvantage"),
 ("Isra can smash the horn (AC 12, HP 10).", "The dreamer can smash the horn (AC 12, HP 10)."),
 ("<p>If Isra chooses to listen, give him a false answer about his maker, give him a Tormenting Curse (Wisdom),", "<p>If the dreamer chooses to listen, give them a false answer about their maker, give them a Tormenting Curse (Wisdom),"),
 ("Isra needs a second source, such as <em>Tide of Darkness</em> or his summoned shadow, to seal all four.", "sealing all four takes a second source of magical darkness."),
 ("<p>Isra sees through his own magical darkness. The hound can't see into it beyond 10 feet.</p>", "<p>The hound can't see into magical darkness beyond 10 feet. A dreamer who can see through magical darkness has the edge here.</p>"),
 ("Isra's key and", "The dreamer's key and"),
],
"P4. The Byre": [
 ("<p><em>Frag. Solo. Night. ~30 min.</em></p>", head("P4")),
 ("<h3>What Frag Sees</h3>", "<h3>What the Dreamer Sees</h3>"),
 ("<p>Frag wakes by the north door.", "<p>The dreamer wakes by the north door."),
 ("The first time Frag sees it turn, he makes a DC 17 Wisdom saving throw or has the Frightened condition until the end of his next turn.", "The first time the dreamer sees it turn, they make a DC 17 Wisdom saving throw or have the Frightened condition until the end of their next turn."),
 ("<p><strong>The grafted bolt (his passion against his fear).</strong>", "<p><strong>The grafted bolt (the temptation).</strong>"),
 ("When the room is solved, Frag gains a Tormenting Curse (Wisdom).", "When the room is solved, whoever took it gains a Tormenting Curse (Wisdom)."),
 ("Don't point out the bolt or the joints. Let him find them.", "Don't point out the bolt or the joints. Let the dreamer find them."),
 ("Frag's key and", "The dreamer's key and"),
],
"P5. The Curio Room": [
 ("<p><em>Vincent Malfieri. Solo. Night. ~30 min.</em></p>", head("P5")),
 ("<h3>What Vincent Sees</h3>", "<h3>What the Dreamer Sees</h3>"),
 ("<p>Vincent wakes beside the pedestal.", "<p>The dreamer wakes beside the pedestal."),
 ("On Vincent's first turn it slides out through the glass.", "On the dreamer's first turn it slides out through the glass."),
 ("If Vincent shuts his eyes, he has the Blinded condition and the fluke can't see him: it has Disadvantage on attack rolls against him and can't use Into the Socket on him. Inside magical darkness, such as his own <em>Darkness</em> spell, he is hidden from it in the same way, and he is effectively blind too (his darkvision doesn't see into magical darkness).",
  "If the dreamer shuts their eyes, they have the Blinded condition and the fluke can't see them: it has Disadvantage on attack rolls against them and can't use Into the Socket on them. Inside magical darkness they are hidden from it in the same way, and blind too unless they can see through magical darkness."),
 ("<p>Let him find the answer. If he fights with his eyes open, the fluke goes for his face. If he grapples it, he can fight blind: his grapple uses a saving throw, not an attack roll, and Grappler gives him Advantage on attack rolls against a creature he is grappling, which cancels the Disadvantage from being Blinded.</p>",
  "<p>Let the dreamer find the answer. If they fight with their eyes open, the fluke goes for their face. A grappler can fight blind: a grapple uses a saving throw, not an attack roll, and the Grappler feat gives Advantage on attack rolls against a creature they are grappling, which cancels the Disadvantage from being Blinded.</p>"),
 ("Vincent can take the monocle and put it on as an action. While he wears it, he sees through any darkness, but the fluke always knows where he is and has Advantage on attack rolls against him. When the room is solved, he gains a Tormenting Curse (Wisdom).",
  "The dreamer can take the monocle and put it on as an action. While they wear it, they see through any darkness, but the fluke always knows where they are and has Advantage on attack rolls against them. When the room is solved, they gain a Tormenting Curse (Wisdom)."),
 ("Vincent's key and", "The dreamer's key and"),
 ("If he wore the monocle, he gains the Tormenting Curse now.", "If the dreamer wore the monocle, they gain the Tormenting Curse now."),
],
"P6. The Portrait Parlour": [
 ("<p><em>Sara Rose. Solo. Night. ~30 min.</em></p>", head("P6")),
 ("<h3>What Sara Sees</h3>", "<h3>What the Dreamer Sees</h3>"),
 ("<p>Sara wakes standing in the middle of the room.", "<p>The dreamer wakes standing in the middle of the room."),
 ("and steps out on her first turn. He wants her in the empty chair. Hold Still paralyzes, which is her fear of being helpless.</p>", "and steps out on the dreamer's first turn. He wants the dreamer in the empty chair. Hold Still paralyzes: the fear of being helpless.</p>"),
 ("<p><strong>The dead must be heard (her duty).</strong>", "<p><strong>The dead must be heard.</strong>"),
 ("(once all three have been heard, Sara gains Heroic Inspiration)", "(once all three have been heard, the dreamer gains Heroic Inspiration)"),
 ("<p><strong>The empty chair (survive by being helpless).</strong> Sara can sit in the empty chair.", "<p><strong>The empty chair (the temptation).</strong> The dreamer can sit in the empty chair."),
 ("takes her portrait and leaves, and the room is solved. She gains a Tormenting Curse (Wisdom), and her photograph joins the dead on the wall. If he Poses her into the chair while she is Paralyzed, the same happens.",
  "takes their portrait and leaves, and the room is solved. The dreamer gains a Tormenting Curse (Wisdom), and their photograph joins the dead on the wall. If he Poses them into the chair while they are Paralyzed, the same happens."),
 ("The room is solved when the Posing Man dies or Sara sits for the portrait.", "The room is solved when the Posing Man dies or the dreamer sits for the portrait."),
 ("Sara's key and", "The dreamer's key and"),
],
"M1. The Hold and the Hunt": [
 ('<p><em>Elias "Grey" Harlan and Sister Curie, after P1 and P2. Night. ~40 min.</em></p>', "<p><em>Built for a defender and a ranged attacker. The dreamers of P1 and P2. Night. ~40 min.</em></p>"),
 ("Curie's job is to hold the Heart: her aura, Shield Master and standing in the way.", "The defender's job is to hold the Heart: auras, shields and standing in the way."),
 ("<p>Elias's job is the hunt.", "<p>The ranged attacker's job is the hunt."),
 ("Elias standing beside Curie gets the benefit of her protection; Elias firing from range keeps his distance from the crowd.", "A ranged attacker standing beside the defender gets the benefit of their protection; one firing from range keeps their distance from the crowd."),
],
"M2. The Choir": [
 ("<p><em>Isra Noctis and Frag, after P3 and P4. Night. ~40 min.</em></p>", "<p><em>Built for a spellcaster and a ranged attacker. The dreamers of P3 and P4. Night. ~40 min.</em></p>"),
 ("<p><strong>Isra's room.</strong> The room is soaked in magic: every spell Isra casts here counts as one slot level higher. Tell her the first time she casts.</p>",
  "<p><strong>The spellcaster's room.</strong> The room is soaked in magic: every spell cast here counts as one slot level higher. Tell the players the first time someone casts.</p>"),
 ("That is Frag's job.", "That is the ranged attacker's job."),
 ("That is Isra's job.", "That is the spellcaster's job."),
],
"M3. The Pit": [
 ("<p><em>Vincent Malfieri and Sara Rose, after P5 and P6. Night. ~40 min.</em></p>", "<p><em>Built for a grappler and a character who hides. The dreamers of P5 and P6. Night. ~40 min.</em></p>"),
 ("Telekinetic's shove is silent, so Sara can shove from hiding and stay hidden.", "A shove from the Telekinetic feat is silent, so a hidden character can shove from hiding and stay hidden."),
 ("so Vincent's grapples and throws and Sara's shoves are the fast way through.", "so grapples, throws and shoves are the fast way through."),
],
"Cast and Horrors": [
 ("Saves DC 19, raised for Sister Curie's aura.", "Saves DC 19, set for a party with a paladin's aura; use DC 17 without one."),
],
}

FIT = """<h3>Fitting the Rooms to Your Table</h3>
<p>Each solo room is built for a kind of character. Before the session, give each room to the player whose Dread Insight fits it best. The dreamers of P1 and P2 meet in M1, P3 and P4 in M2, and P5 and P6 in M3, so give rooms that share a pair room to players whose fighting styles suit it.</p>
<p>Rewrite each temptation around the player's own Dread Insight where you can: the easy way out should be the thing that character fears or wants most.</p>
<p>With fewer than six players, leave the extra solo rooms empty; their keys lie in the hall outside them. A pair room with only one dreamer gets half its creatures: up to four Wall-Born in M1, three shards in M2, two brutes in M3.</p>
<h3>The Rooms</h3>"""

ov = [
 ("<h3>The Rooms</h3>", FIT),
 ("<tr><th>Room</th><th>Player</th><th>Horror</th></tr>", "<tr><th>Room</th><th>Built for</th><th>Horror</th></tr>"),
 ("</td><td>Elias</td>", "</td><td>Protector</td>"),
 ("</td><td>Sister Curie</td>", "</td><td>Healer</td>"),
 ("</td><td>Isra</td>", "</td><td>Spellcaster</td>"),
 ("</td><td>Frag</td>", "</td><td>Ranged fighter</td>"),
 ("</td><td>Vincent</td>", "</td><td>Collector, grappler</td>"),
 ("</td><td>Sara</td>", "</td><td>Survivor who hides</td>"),
 ("</td><td>Elias, Curie</td>", "</td><td>Defender, ranged attacker</td>"),
 ("</td><td>Isra, Frag</td>", "</td><td>Spellcaster, ranged attacker</td>"),
 ("</td><td>Vincent, Sara</td>", "</td><td>Grappler, hider</td>"),
]
pages["Overview"] = ov

bios = {
"Angle Hound": [("Isra Noctis's horror in the Room of Corners (P3).", "The horror in the Room of Corners (P3)."), ("Keep Isra listening, then take him through a corner.", "Keep the dreamer listening, then take them through a corner.")],
"Dream Fluke": [("Vincent Malfieri's horror in the Curio Room (P5).", "The horror in the Curio Room (P5)."), ("Push into Vincent's eye socket.", "Push into the dreamer's eye socket.")],
"Eye Swarm": [("Elias Harlan's horror in the Ward of Watchers (P1).", "The horror in the Ward of Watchers (P1)."), ("Keep Elias pulling sheets", "Keep the dreamer pulling sheets")],
"Grazer": [("Frag's horror in the Byre (P4).", "The horror in the Byre (P4).")],
"Posing Man": [("Sara Rose's horror in the Portrait Parlour (P6).", "The horror in the Portrait Parlour (P6)."), ("Seat Sara in the empty chair and take her portrait.", "Seat the dreamer in the empty chair and take their portrait.")],
"Sleeper Under a Sheet": [("begging Elias by name.", "begging the dreamer by name.")],
"Stitched Subject": [("Sister Curie's horror in the Dissection Room (P2).", "The horror in the Dissection Room (P2)."), ("sewn together from the cadavers she collected for her research,", "sewn together from the dead the dreamer could not save,")],
"The Real Sleeper": [("It never says Elias's name;", "It never says the dreamer's name;")],
}

items = {
"Dream Fluke :: Disposition: Hunger for Eyes": [("goes for Vincent's face,", "goes for the dreamer's face,")],
"Eye Swarm :: Disposition: Watch": [("between Elias and the real sleeper's cot.", "between the dreamer and the real sleeper's cot."), ("and Elias can see it.", "and the dreamer can see it.")],
"Eye Swarm :: Many Eyes": [("Elias makes a DC 17 Wisdom saving throw. <em>Failure:</em> He has the Frightened condition until the end of his next turn.", "the dreamer makes a DC 17 Wisdom saving throw. <em>Failure:</em> They have the Frightened condition until the end of their next turn.")],
"Grazer :: Dread of the Dead": [("The first time Frag sees the Grazer turn, he makes a DC 17 Wisdom saving throw. <em>Failure:</em> He has the Frightened condition until the end of his next turn.", "The first time the dreamer sees the Grazer turn, they make a DC 17 Wisdom saving throw. <em>Failure:</em> They have the Frightened condition until the end of their next turn.")],
"Posing Man :: Disposition: Portraitist": [("wants Sara in the empty chair.", "wants the dreamer in the empty chair.")],
"Posing Man :: Pose": [("If he puts Sara in the empty chair, her portrait is taken as if she had sat.", "If he puts the dreamer in the empty chair, their portrait is taken as if they had sat.")],
"Sleeper Under a Sheet :: A Voice Under the Sheet": [("calls Elias by name and begs him for help.", "calls the dreamer by name and begs them for help.")],
"Speaking Horn :: The Voice": [("tells Isra it knows who made him. Isra has Disadvantage", "tells the dreamer it knows who made them. The dreamer has Disadvantage")],
"Speaking Horn :: Listen": [("Isra may choose to listen (no action). He hears a false answer about who made him, gains", "The dreamer may choose to listen (no action). They hear a false answer about who made them, gain")],
"The Child :: The Child's Thanks": [("Sara gains Heroic Inspiration.", "the dreamer gains Heroic Inspiration.")],
"The Heart :: Breaking": [("Elias and Sister Curie each gain a Tormenting Nox.", "each dreamer in the room gains a Tormenting Nox.")],
"The Real Sleeper :: Is Someone There?": [("never uses Elias's name.", "never uses the dreamer's name.")],
"The Seeing Glass :: Price: One Eye": [("Vincent can take the monocle and put it on as an action. While he wears it, he sees through any darkness, including magical darkness, but the Dream Fluke always knows where he is and has Advantage on attack rolls against him. When the room is solved, he gains",
  "The dreamer can take the monocle and put it on as an action. While they wear it, they see through any darkness, including magical darkness, but the Dream Fluke always knows where they are and has Advantage on attack rolls against them. When the room is solved, they gain")],
}

flagRole = {"P1": "protector", "P2": "healer", "P3": "spellcaster", "P4": "ranged fighter", "P5": "collector, grappler", "P6": "survivor who hides",
            "M1": "defender and ranged attacker", "M2": "spellcaster and ranged attacker", "M3": "grappler and hider"}
notes = {"P1 Elias": "P1 Ward of Watchers", "P2 Curie": "P2 Dissection Room", "P3 Isra": "P3 Room of Corners", "P4 Frag": "P4 Byre", "P5 Vincent": "P5 Curio Room", "P6 Sara": "P6 Portrait Parlour"}
json.dump({"pages": pages, "bios": bios, "items": items, "flagRole": flagRole, "notes": notes}, open("/mnt/user-data/outputs/e11v2/e11-agnostic-v1.json", "w"), indent=1)
print("ok")
