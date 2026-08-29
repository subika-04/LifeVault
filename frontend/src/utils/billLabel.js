// Turns an auto-generated reminder/document title into a short, natural
// noun phrase for the "I Have Paid ___" button label — e.g.
// "Pay electricity bill" -> "Electricity Bill", "Renew insurance" ->
// "Insurance", "Health Insurance" -> "Health Insurance".
const VERB_PREFIX = /^(pay|renew|settle|action required for)\s+/i;
const WARRANTY_SUFFIX = /\s*\(warranty\)\s*$/i;

const titleCase = (text) =>
  text
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export const deriveBillLabel = (rawTitle) => {
  const cleaned = String(rawTitle || '')
    .replace(WARRANTY_SUFFIX, '')
    .replace(VERB_PREFIX, '')
    .trim();
  return cleaned ? titleCase(cleaned) : 'This Bill';
};

// The full button label, e.g. "I Have Paid Electricity Bill". Falls back
// to the generic "I Have Paid This Bill" if a title isn't available.
export const payButtonLabel = (rawTitle) => `I Have Paid ${deriveBillLabel(rawTitle)}`;
