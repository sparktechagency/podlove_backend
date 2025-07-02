export function ageToDOB(age: number) {
  const today = new Date();
  const year = today.getFullYear() - age;
  const dateOfBirth = new Date(year, today.getMonth(), today.getDate());
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const formate = fmt(dateOfBirth);
  return formate;
}

const ageUtils = {
  ageToDOB,
};
export default ageUtils;

