# Pregnancy Summary (6.1)

Entry: Health > Summary > Pregnancy summary (last section), and Profile > Account > Pregnancy summary. Route: `app/patient/pregnancy-summary.tsx`.

The screen follows prototype 6.1: top bar, header with three chips, milestones, share row, Export summary. It adds what the prototype lacks: a Health details row that opens a screen with vitals, medications and "How she's been feeling" (also in the PDF preview), a notice when readings are out of range, and the Demo tags. This trial layout places the content task's sections on a separate screen instead of directly on 6.1.

PDF, QR and Health details are separate screens (`app/patient/pregnancy-summary/`), with a top bar and back arrow as in the prototype, at the team's request. SCRUM-37 and the contract ask for sheets, so that needs updating. The locked state remains a sheet. The plan check runs when the summary opens them; a direct link is not checked.

## Data rules

- The screen reads the signed-in patient's records. Sample data appears only with Simulated data on (`docs/demo-mode.md`), never as a fallback for real patients.
- A "Demo" tag shows on the header in demo mode, and always on "How she's been feeling".

## Vitals

Each vital shows its latest reading, plus any other out-of-range reading from the last 7 days. Out-of-range rows come first, shown as tinted cards with an alert icon and status text, with the count beside the heading. They use the yellow caution look of the metric screens, not red.

Limits come from `utils/vitalCategories.ts`, shared with the Blood pressure, Glucose and Heart rate screens:

| Vital | Normal | Attention | Out of range |
|---|---|---|---|
| Blood pressure | below 120 and below 80 | elevated and stage 1 | 140/90 or higher |
| Glucose | fasting below 95, otherwise below 140 mg/dL, and 70 or higher | none | anything else |
| Heart rate | 60–100 bpm | none | anything else |
| Weight | no range in the app, so none is invented | | |

**Gap:** the real API merges readings per day and does not keep their time (gap 1 in `docs/demo-mode.md`), so real rows show only the day, with a note under the list. The daily merge also keeps one value per vital per day. Showing real times needs `recorded_at` stored per reading and returned by `GET /user/activity/:id`.

## Medications

The name, the scheduled times and "Last taken". States: taken today, overdue (a dose due today has passed unmarked), taken earlier, never taken.

**Gap:** the API has no dose field, so no dose is shown. It stores `completedDates`, whole days marked per medication, so it cannot tell doses on the same day apart or say when one was marked. Real rows show only the day, with a note under the list.

**Smallest fix proposed:** a backend `completedAt` map (day to timestamp), set by `PATCH .../updateStatus/:medicationId/completed`. Demo mode already answers in that shape, so this screen would need no change.

Overdue looks at today only; missed doses on earlier days are not flagged.

## How she's been feeling

Demo only: a simulated, visual summary (counts and chips) from the last 7 days of mood check-ins, logged symptoms and sample guide topics (`guideNotes` in the demo database), with no AI call. It shows the period, the sources and a note that it is not a diagnosis. With real data the section says it is only available with Simulated data. Real RAG generation is a separate evaluation.

**Open question for Josué:** what from the AI conversations may enter a PDF or QR? This must be defined before any real export. This screen reads no private conversation.

## Demo data

Times were added to new demo databases only. A phone with saved demo data shows only the day until Developer > Reset simulated data.

## Export (Demo)

No PDF, QR content, link, message or charge is created. Real generation is a separate task.

- **PDF screen:** a sample document with a 2-second progress, then Download PDF and Share with clinic, which only confirm the demo. The preview lists the same three sections as the summary. The file name holds only the date.
- **QR screen:** a drawing that changes with Generate new code and cannot be scanned, a 24-hour expiry and Share code.
- **Share row** opens QR and **Export summary** opens PDF; each screen links to the other.

## Plan control (Demo)

Assumption until confirmed: no real subscription exists. Access needs the simulated Premium status (`premiumStore.ts`), plus a demo switch in 6.1 that appears only with Simulated data. The switch changes only this export; it never writes Premium, because Premium also gates the Concierge chat. When locked, the export opens a sheet listing what the plan includes. Manage plan turns the switch back on, or opens the Premium screen when Premium itself is off. Prototype 6.4 draws per-feature toggles; here they are a list, as SCRUM-37 asks.

## Milestones (Demo)

Front end only, at the team's request: the prototype's three items are sample data in `model.ts`, with no backend call, dated around today. They show the same for every patient, with or without Simulated data, always with a Demo tag.

**Point of attention:** before a real release this needs real data, because a real patient would otherwise see screenings as completed that she never had. A dependable timeline needs milestone records on the backend.
