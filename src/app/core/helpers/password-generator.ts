const checkboxes = [
  { id: 'lowercase', label: 'a-z', library: 'abcdefghijklmnopqrstuvwxyz' },
  { id: 'uppercase', label: 'A-Z', library: 'ABCDEFGHIJKLMNOPWRSTUVWXYZ' },
  { id: 'numbers', label: '0-9', library: '0123456789' },
  { id: 'symbols', label: '!-?', library: '!@#$%^&*-_=+\\|:;\',.\<>/?~' }
];

interface Options {
  lowercase: boolean;
  uppercase: boolean;
  numbers: boolean;
  symbols: boolean;
}
const defaultOptions: Options = {
  lowercase: true,
  uppercase: true,
  numbers: true,
  symbols: false
};
export function generate(length: number, options: Options = defaultOptions) {
  const { lowercase, uppercase, numbers, symbols } = options;
  const dictionary = [].concat(
    lowercase ? checkboxes[0].library.split('') : [],
    uppercase ? checkboxes[1].library.split('') : [],
    numbers ? checkboxes[2].library.split('') : [],
    symbols ? checkboxes[3].library.split('') : []
  );
  let result = '';
  for (let i = 0; i < length; i++) {
    result += dictionary[Math.floor(Math.random() * dictionary.length)];
  }

  return result;
}
