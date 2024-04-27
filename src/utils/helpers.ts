export const formatCodeWithLeadingZeros = (code: string | number, length = 3) => {
  const strCode = String(code);
  return strCode.padStart(length, '0');
};
