// The server keeps several rows for the same day and GET /user/activity/:id merges them in an undefined order, so the
// merged blood pressure and glucose of today can be an old reading. The status routes (bpstatus, glucosestatus) hold the
// latest write of the day (checked against the real backend), so today's merged entry is overwritten with them.
type Activity = { date: string; details: any };

export const withTodayReadings = (activities: Activity[], bpStatus: any, glucoseStatus: any, today: string): Activity[] => {
  const bp = bpStatus?.data?.todayBloodPressure;
  const glucose = glucoseStatus?.data?.todayGlucose;
  const hasBp = bp?.systolic > 0;
  const hasGlucose = glucose > 0;
  if (!hasBp && !hasGlucose) return activities;

  return activities.map((activity) => {
    if (activity.date !== today) return activity;
    const details = { ...activity.details };
    if (hasBp) {
      details.bloodPressure = {
        ...details.bloodPressure,
        systolic: bp.systolic,
        diastolic: bp.diastolic ?? details.bloodPressure?.diastolic,
      };
    }
    if (hasGlucose) {
      details.glucose = {
        ...details.glucose,
        value: glucose,
        unit: glucoseStatus.data.todayGlucoseUnit ?? details.glucose?.unit,
        mealContext: glucoseStatus.data.todayGlucoseMealContext ?? details.glucose?.mealContext,
      };
    }
    return { ...activity, details };
  });
};

// The server files each day by its UTC date
export const serverToday = () => new Date().toISOString().slice(0, 10);
