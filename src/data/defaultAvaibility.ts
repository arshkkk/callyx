const availability = [{ start: 540, end: 1020 }];
const defaultAvaibility = {
  timeZone: "Asia/Kolkata",
  dateOverrides: [],
  workingHours: [
    { day: 0, availability: [] }, // sunday
    { day: 1, availability }, // monday
    { day: 2, availability }, // tuesday
    { day: 3, availability }, // wednesday
    { day: 4, availability }, // thursday
    { day: 5, availability }, // friday
    { day: 6, availability: [] }, // saturday
  ],
};

export default defaultAvaibility;
