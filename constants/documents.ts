// Prototype 10.5 / 10.6 sample documents.
// ponytail: demo list, there is no documents API yet. Replace with the real list (name, date, size, page count)
// once the backend serves the files.
export type PatientDocument = { name: string; date: string; size: string; pages: number };

export const DOCUMENTS: PatientDocument[] = [
  { name: "Anatomy_Scan_Report.pdf", date: "2026-06-12", size: "2.1 MB", pages: 3 },
  { name: "Lab_Results_Glucose.pdf", date: "2026-07-03", size: "640 KB", pages: 2 },
  { name: "Intake_Form_Signed.pdf", date: "2026-02-08", size: "1.4 MB", pages: 3 },
  { name: "Birth_Plan_Draft.pdf", date: "2026-08-01", size: "890 KB", pages: 2 },
  { name: "Prenatal_Panel_Results.pdf", date: "2026-09-05", size: "1.1 MB", pages: 4 },
  { name: "Ultrasound_Summary.pdf", date: "2026-09-18", size: "1.8 MB", pages: 2 },
  { name: "Insurance_Card_Copy.pdf", date: "2026-10-02", size: "420 KB", pages: 1 },
  { name: "Vaccination_Record.pdf", date: "2026-10-09", size: "310 KB", pages: 1 },
  { name: "Glucose_Tolerance_Test.pdf", date: "2026-10-21", size: "700 KB", pages: 2 },
  { name: "Hospital_Preregistration.pdf", date: "2026-10-28", size: "950 KB", pages: 3 },
];
