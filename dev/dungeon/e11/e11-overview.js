// E11 Infinite Dreams: overview, map, waking and cast pages for journal "E11 Infinite Dreams", from the E11 brew.
// Idempotent: replaces pages of the same names. Run after the room scripts and e11-fragments.js.
const MOD = "faight-anchester-by-torchlight";
const j = game.journal.getName("E11 Infinite Dreams");
const fj = game.journal.getName("E11 Sanitorium Fragments");
const A = n => { const a = game.actors.getName(n); return a ? `@UUID[${a.uuid}]{${n}}` : `<strong>${n}</strong>`; };
const P = n => { const p = j.pages.getName(n); return p ? `@UUID[${p.uuid}]{${n}}` : n; };
const FJ = fj ? `@UUID[${fj.uuid}]{E11 Sanitorium Fragments}` : "E11 Sanitorium Fragments";

const overview = `<h2>Infinite Dreams</h2>
<p><em>Episode Eleven. 6 players, Level 15. ~4 hours. Solo Rooms; Pair Rooms; Combat (Waves); Reveal.</em></p>
<blockquote><p><strong>The Night Back Home.</strong> The first night the players sleep after the village, Dr. Valentin Orme reaches them from the basement of the Sanitorium. His machine runs on sleepers, and the Clairvoyant pays for it. Each player wakes alone in a room built from their own Dread Insights, then meets a partner in a second room, then the whole party fights its way into the last room, where the dream shows them where it is coming from. They wake cursed with a Damnation that will not stay gone while Orme's spell runs.</p></blockquote>
<h3>Timeline</h3>
<p><strong>Months ago.</strong> The Clairvoyant began paying for research in the basement of the Sanitorium. Dr. Valentin Orme built a machine that runs on sleeping patients.</p>
<p><strong>Three nights ago.</strong> The rite on the Moon Mound. The players took the Clairvoyant's papers from Hester Crayle's bag.</p>
<p><strong>Today.</strong> The players come home to Anchester.</p>
<p><strong>Tonight.</strong> They sleep, and Orme's spell finds them.</p>
<h3>Episode Structure</h3>
<p>The whole episode is one dream, a maze of rooms hanging in cloud (scene 11.01). Each player wakes alone in a solo room (P1 to P6) facing a horror built from their own Dread Insights. A room holds its player until it is solved.</p>
<p>Each solo room opens onto a hall to a pair room (M1 to M3), where two players meet and face an encounter built on how they fight. Each solo room also gives a key; the keyed doors into the centre room (C) need both keys from their pair.</p>
<p>In C the whole party fights the eighteen visions of the dream. As they shatter, their pictures fill the floor and show the players a building: an asylum, from its gates down to a ward of sleepers wired to a machine. Then they wake.</p>
<h3>Scene 1: Lights Out</h3>
<blockquote><p>Your own room, your own bed, the house quiet around you. The lamp is out.</p></blockquote>
<p>Ask each player where they sleep tonight and who else is in the house. Then each of them wakes in their solo room.</p>
<h3>The Night's Rules</h3>
<p><strong>Locked In.</strong> Every door in the maze is locked. When a room is solved, unlock its doors. A player who has solved their own room may enter another; unlock the door they reach.</p>
<p><strong>Staggered Starts.</strong> Players finish their solo rooms at different times. Start a pair room when its first player arrives; the second joins when they come through.</p>
<p><strong>Keys.</strong> Each solo room gives its player a key. The keyed doors into C open only with both keys of their pair: P1 and P2 (from M1), P3 and P4 (from M2), P5 and P6 (from M3).</p>
<p><strong>Holes.</strong> Purple holes at the ends of halls are linked in pairs (A to I on the map). A creature that steps into one comes out of its partner.</p>
<p><strong>Fragments.</strong> Each solo and pair room gives one torn piece of a picture. Hand each one out from ${FJ} when it is found. The nine pieces make one picture.</p>
<p><strong>The Damnation.</strong> Every player wakes with a Damnation (+1 Exhaustion; Wisdom save DC 22; only <em>Wish</em> removes it; other remedies suppress it for 3d10 days). While Orme's spell runs, it comes back after every long rest, even if suppressed.</p>
<h3>Running Six Rooms</h3>
<p>Give each player one round in their room, then cut to the next room. Keep a round count for each room: the real sleeper in P1 dies at the end of round 4.</p>
<p>Each solo room offers one easy way out. Taking it costs a Tormenting Curse (Wisdom). Note who took one; they keep it after they wake.</p>
<h3>The Rooms</h3>
<table><thead><tr><th>Room</th><th>Player</th><th>Horror</th></tr></thead><tbody>
<tr><td>${P("P1. The Ward of Watchers")}</td><td>Elias</td><td>${A("Eye Swarm")}</td></tr>
<tr><td>${P("P2. The Dissection Room")}</td><td>Sister Curie</td><td>${A("Stitched Subject")}</td></tr>
<tr><td>${P("P3. The Room of Corners")}</td><td>Isra</td><td>${A("Angle Hound")}</td></tr>
<tr><td>${P("P4. The Byre")}</td><td>Frag</td><td>${A("Grazer")}</td></tr>
<tr><td>${P("P5. The Curio Room")}</td><td>Vincent</td><td>${A("Dream Fluke")}</td></tr>
<tr><td>${P("P6. The Portrait Parlour")}</td><td>Sara</td><td>${A("Posing Man")}</td></tr>
<tr><td>${P("M1. The Hold and the Hunt")}</td><td>Elias, Curie</td><td>${A("The Caller")}, ${A("Wall-Born")}</td></tr>
<tr><td>${P("M2. The Choir")}</td><td>Isra, Frag</td><td>${A("The Choir")}</td></tr>
<tr><td>${P("M3. The Pit")}</td><td>Vincent, Sara</td><td>${A("Hollow Brute")}s</td></tr>
<tr><td>${P("C. The Waking Room")}</td><td>All</td><td>The Visions</td></tr>
</tbody></table>
<h3>GM Buttons</h3>
<p>The GM buttons on 11.01 sit in the cloud beside their rooms, hidden from the players: the spark switches by P1, TURN by P4, SPOT by M1, and NEXT by C. Each room's page says when to press them. Each room has a map note that opens its page.</p>`;

const waking = `<h2>Scene 5: Waking and Resolution</h2>
<p><em>Each player's home. Dawn. ~10 min.</em></p>
<h3>What They See</h3>
<blockquote><p>The floor of the hall is one picture now: gates, a stair going down, a ward of sleepers wired to a machine, and a watch swinging over all of it.</p></blockquote>
<p>Then each player wakes in their own bed. Each has a Damnation. Hand out the fragments the players earned from ${FJ}; the pieces fit together.</p>
<h3>Skill Checks</h3>
<p><strong>Investigation DC 15.</strong> Laid side by side, the fragments make one picture: a vaulted basement, sleepers wired to a brass machine, a hand with a watch, and trees in blossom through barred windows. It is the basement ward of an asylum.</p>
<h3>Resolution</h3>
<p><strong>Outcome.</strong> The players learn the dream came from the basement of an asylum, and that it will come back: the Damnation returns after every long rest while the spell runs.</p>
<p><strong>Rewards.</strong> TBD.</p>
<h3>Threads and Dead Ends</h3>
<ul>
<li><strong>The Sanitorium.</strong> The players do not learn which asylum it is tonight. In Episode Twelve Dr. Pemberton tells them the Clairvoyant was paying for research in the Sanitorium basement.</li>
<li><strong>The hand with the watch.</strong> Dr. Valentin Orme. The players do not learn his name tonight.</li>
<li><strong>The Tormenting Curses.</strong> Players who took a temptation keep its curse.</li>
</ul>`;

const cast = `<h2>Cast and Horrors</h2>
<h3>Dr. Valentin Orme</h3>
<p><em>Physician and mesmerist. The Sanitorium. Never seen this episode.</em></p>
<p><strong>Description.</strong> Only a hand in a dark sleeve, holding a gold watch on a chain.</p>
<p><strong>Mannerisms.</strong> The swinging watch; the voice through the horn in P3.</p>
<p><strong>Intent.</strong> Keep the players dreaming, so they can never rest.</p>
<h3>Solo Room Horrors</h3>
<p>Power Level 15, Durability 1.5: ${A("Eye Swarm")} (P1), ${A("Stitched Subject")} (P2), ${A("Angle Hound")} (P3), ${A("Grazer")} (P4), ${A("Dream Fluke")} (P5), ${A("Posing Man")} (P6).</p>
<h3>Pair Room Horrors</h3>
<p>${A("The Caller")} and ${A("Wall-Born")} (M1); ${A("The Choir")}, ${A("Choir Shard")} and ${A("Anchor Stone")} (M2); ${A("Hollow Brute")} (M3).</p>
<h3>The Visions</h3>
<p>Eighteen Visions in room C: AC 16, HP 35, Touch +14 for 13 psychic, and one reaction each from its picture, used when an attack roll hits it. Saves DC 19, raised for Sister Curie's aura. See ${P("C. The Waking Room")}.</p>`;

const names = ["Overview", "The Dream Maze (map)", "Scene 5: Waking and Resolution", "Cast and Horrors"];
const old = j.pages.filter(p => names.includes(p.name)).map(p => p.id);
if (old.length) await j.deleteEmbeddedDocuments("JournalEntryPage", old);
await j.createEmbeddedDocuments("JournalEntryPage", [
  { name: "Overview", type: "text", sort: 10, text: { content: overview, format: 1 } },
  { name: "The Dream Maze (map)", type: "image", sort: 20, src: `modules/${MOD}/assets/journals/abtl-e11-map-dream-maze.png`, image: { caption: "Scene 11.01. P1 to P6 solo rooms; M1 to M3 pair rooms; C the Waking Room; A to I linked holes." } },
  { name: "Scene 5: Waking and Resolution", type: "text", sort: 1100000, text: { content: waking, format: 1 } },
  { name: "Cast and Horrors", type: "text", sort: 1200000, text: { content: cast, format: 1 } },
]);
const report = { pages: j.pages.contents.sort((a, b) => a.sort - b.sort).map(p => p.name), unlinked: (overview + cast).match(/<strong>[^<]+<\/strong>\)?/g)?.filter(s => !/Months|Three|Today|Tonight|Locked|Staggered|Keys|Holes|Fragments|Damnation|Description|Mannerisms|Intent|The Night/.test(s)) || [] };
report;
