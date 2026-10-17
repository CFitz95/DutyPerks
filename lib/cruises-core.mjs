/**
 * Only explicitly published program summaries with a recent review may be displayed.
 * @template {{published?: boolean, checkedAt?: string, reviewBy?: string}} T
 * @param {T[]} programs
 * @param {Date} now
 * @returns {T[]}
 */
export function currentCruisePrograms(programs, now = new Date()) {
  const time = now.getTime();
  return programs.filter(program => {
    const checked = Date.parse(`${program.checkedAt}T00:00:00Z`);
    const reviewBy = Date.parse(`${program.reviewBy}T00:00:00Z`);
    return program.published === true && Number.isFinite(time) &&
      checked <= time && time < reviewBy && reviewBy - checked <= 31 * 86400000;
  });
}
export const cruiseTypes = [
  { value: 'zero_fare', label: '$0 fare offers' },
  { value: 'fare_discount', label: 'Fare discounts' },
  { value: 'onboard_credit', label: 'Onboard credit' },
];