export const millisecondsUntilEndOfHour = () => {
  const currentDate = new Date();
  const currentMinute = currentDate.getMinutes();
  const currentSecond = currentDate.getSeconds();
  const currentMillisecond = currentDate.getMilliseconds();

  // Calculate the time remaining until the end of the hour
  const minutesRemaining = 59 - currentMinute;
  const secondsRemaining = 59 - currentSecond;
  const millisecondsRemaining = 1000 - currentMillisecond;

  // Convert the remaining time to milliseconds
  const millisecondsUntilEndOfHour =
    minutesRemaining * 60 * 1000 +
    secondsRemaining * 1000 +
    millisecondsRemaining;

  return millisecondsUntilEndOfHour;
};
