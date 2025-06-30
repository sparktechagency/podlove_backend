
export function calculateAge(birthdate: string | Date, asOf = new Date()) {
  const dob = new Date(birthdate);
  if (isNaN(dob.getTime())) {
    throw new Error(`Invalid birthdate: ${birthdate}`);
  }

  let age = asOf.getFullYear() - dob.getFullYear();
  const m = asOf.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && asOf.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

const ageUtils = {
  calculateAge,
};
export default ageUtils;

