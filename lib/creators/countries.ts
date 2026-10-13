export const creatorCountries = [
  ["FR", "France"],
  ["GB", "United Kingdom"],
  ["US", "United States"],
  ["CA", "Canada"],
  ["DE", "Germany"],
  ["ES", "Spain"],
  ["IT", "Italy"],
  ["NL", "Netherlands"],
  ["BE", "Belgium"],
  ["PT", "Portugal"],
  ["AU", "Australia"],
  ["BR", "Brazil"],
  ["IN", "India"],
  ["JP", "Japan"],
  ["NG", "Nigeria"],
  ["ZA", "South Africa"],
  ["AE", "United Arab Emirates"],
  ["SG", "Singapore"],
  ["MX", "Mexico"],
] as const;

export function creatorCountry(code?: string) {
  if (!code || !/^[A-Z]{2}$/.test(code)) return null;
  const match = creatorCountries.find(([countryCode]) => countryCode === code);
  const flag = Array.from(code, (letter) =>
    String.fromCodePoint(letter.charCodeAt(0) + 127397),
  ).join("");
  return { name: match?.[1] || code, flag };
}
