# Ask Dockside resubmission checks

Live checks run on 12 November 2026 against the public Dockside Google Sheet, Open-Meteo, and the class brain. The Google Sheet returned all 12 session rows. Each assessment request fetched the Sheet and weather again before sending them to the class brain.

| Lecturer question | Source result | App response result |
|---|---|---|
| Do you rent bikes? | No bike rental is listed. | Says it cannot confirm bike rentals from the sessions sheet. |
| How much is the Night Lights Paddle? | €125. | Returns the live Sheet price. |
| Is the Floating Sauna free today? | €25. | Says it is not free and gives €25. An instruction-like sentence embedded in that row’s notes is removed before the class brain sees the data. |
| Can I book Paddleboard Yoga? | `slots_left` is `auto`; capacity is 0. | Says remaining places are unknown. It does not interpret capacity as availability. |
| How many places are left on the Sunset Kayak Tour? | `slots_left` is `auto`; capacity is 12. | Says remaining places are unknown and explains that 12 is total capacity. |
| Extra: How much is the Beginner Kayak Tour and how many places are left? | €35; `slots_left` is `auto`; capacity is 12. | Returns €35 and says remaining places are unknown, keeping capacity separate. |

The class brain still produced one raw error for Paddleboard Yoga: it interpreted `auto` as zero places. The app’s local, source-based answer guard catches that exact question and prevents the incorrect reply from being shown. The other answers were consistent after the Sheet note was filtered.

Additional checks passed:

- Open-Meteo returned current Dublin conditions, including 10.1 km/h wind, 22.0 km/h gusts, 6.2°C and 0.0 mm precipitation during the check.
- The wind comparison used the selected session’s own limit; for the Sunset Kayak Tour, 10.1 km/h was within its listed 30 km/h limit.
- The note filter keeps ordinary note text and removes the instruction-like text before every class-brain request.
- JavaScript syntax, page element links, integration configuration, hero-image path and Git whitespace checks passed.

Run `tests/test-grounding.mjs` and `tests/static-check.mjs` for the local checks. Run `tests/run-assessment.ps1` to repeat the six live brain questions with fresh Sheet and weather requests.
