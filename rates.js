// Bundled approximate exchange rates relative to USD.
// Used only to combine mixed-currency subscriptions into one total.
// Offline & private — no network calls. Totals using these are marked with "≈".
const CURRENCIES = [
  { code: "USD", symbol: "$",  name: "US Dollar",         rate: 1 },
  { code: "EUR", symbol: "€",  name: "Euro",              rate: 0.92 },
  { code: "GBP", symbol: "£",  name: "British Pound",     rate: 0.79 },
  { code: "JPY", symbol: "¥",  name: "Japanese Yen",      rate: 157 },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc",       rate: 0.89 },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar",   rate: 1.37 },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", rate: 1.52 },
  { code: "NZD", symbol: "NZ$",name: "NZ Dollar",         rate: 1.66 },
  { code: "CNY", symbol: "¥",  name: "Chinese Yuan",      rate: 7.25 },
  { code: "INR", symbol: "₹",  name: "Indian Rupee",      rate: 83.4 },
  { code: "BRL", symbol: "R$", name: "Brazilian Real",    rate: 5.05 },
  { code: "MXN", symbol: "$",  name: "Mexican Peso",      rate: 18.0 },
  { code: "SEK", symbol: "kr", name: "Swedish Krona",     rate: 10.6 },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone",   rate: 10.7 },
  { code: "DKK", symbol: "kr", name: "Danish Krone",      rate: 6.87 },
  { code: "PLN", symbol: "zł", name: "Polish Zloty",      rate: 3.97 },
  { code: "CZK", symbol: "Kč", name: "Czech Koruna",      rate: 23.1 },
  { code: "HUF", symbol: "Ft", name: "Hungarian Forint",  rate: 360 },
  { code: "RON", symbol: "lei",name: "Romanian Leu",      rate: 4.58 },
  { code: "TRY", symbol: "₺",  name: "Turkish Lira",      rate: 32.2 },
  { code: "RUB", symbol: "₽",  name: "Russian Ruble",     rate: 90 },
  { code: "ZAR", symbol: "R",  name: "South African Rand",rate: 18.4 },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar",  rate: 1.35 },
  { code: "HKD", symbol: "HK$",name: "Hong Kong Dollar",  rate: 7.81 },
  { code: "KRW", symbol: "₩",  name: "South Korean Won",  rate: 1370 },
  { code: "AED", symbol: "د.إ",name: "UAE Dirham",        rate: 3.67 },
  { code: "SAR", symbol: "﷼",  name: "Saudi Riyal",       rate: 3.75 },
  { code: "ILS", symbol: "₪",  name: "Israeli Shekel",    rate: 3.71 },
  { code: "THB", symbol: "฿",  name: "Thai Baht",         rate: 36.6 },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah", rate: 16100 },
  { code: "PHP", symbol: "₱",  name: "Philippine Peso",   rate: 58.3 },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", rate: 4.69 },
];

const CUR_MAP = Object.fromEntries(CURRENCIES.map(c => [c.code, c]));
