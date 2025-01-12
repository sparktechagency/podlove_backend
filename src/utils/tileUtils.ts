const parseTimeToMinutes = (input: string): number => {
  const match = input.match(/(\d{1,2})[.:](\d{2})\s*(am|pm)/i);

  if (!match) {
    throw new Error("Invalid time format. Expected '9.00 am' or '1.00 pm'");
  }

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toLowerCase();

  let totalMinutes = (period === "pm" ? (hours % 12) + 12 : hours % 12) * 60 + minutes;

  return totalMinutes;
};

const parseMinutesToTime = (totalMinutes: number): string => {
  if (totalMinutes < 0 || totalMinutes >= 1440) {
    throw new Error("Invalid total minutes. Must be between 0 and 1439.");
  }

  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const period = hours24 >= 12 ? "pm" : "am";
  const hours12 = hours24 % 12 || 12; // Convert 24-hour format to 12-hour format

  const formattedMinutes = minutes.toString().padStart(2, "0");

  return `${hours12}:${formattedMinutes} ${period}`;
};

const TimeUtils = {
  parseTimeToMinutes,
  parseMinutesToTime,
};

export default TimeUtils;
