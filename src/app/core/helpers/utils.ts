/**
 * Sets the key to storage with given values
 */
export function setToLocalStorage(key: string, data: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    localStorage.setItem(key, data);
  }
}

/**
 * Gets keys value from storage
 */
export function getFromLocalStorage(key: string): any {
  const value = localStorage.getItem(key);
  try {
    return JSON.parse(value);
  } catch (e) {
    return value;
  }
}

/**
 * Removes key with value from storage
 */
export function removeFromLocalStorage(key: string | string[]) {
  key = Array.isArray(key) ? key : [key];
  key.map((k: string) => localStorage.removeItem(k));
}

/**
 * Clear local storage
 */
export function clearLocalStorage() {
  localStorage.clear();
}

/**
 * Converts cyrillic letters to latin
 */
export function transliterate(word: string): string {
  const translations: {[key: string]: string} = {
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'YO', 'Ж': 'ZH', 'З': 'Z', 'И': 'I', 'Й': 'Y',
    'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F',
    'Х': 'H', 'Ц': 'TS', 'Ч': 'CH', 'Ш': 'SH', 'Щ': 'SCH', 'Ъ': '\'', 'Ы': 'I', 'Ь': '\'', 'Э': 'E', 'Ю': 'YU',
    'Я': 'YA',

    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y',
    'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f',
    'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '\'', 'ы': 'i', 'ь': '\'', 'э': 'e', 'ю': 'yu',
    'я': 'ya',
  };
  let result = '';

  if (word) {
    for (let i = 0; i < word.length; i++) {
      const wordElement = word.charAt(i);

      result += translations[wordElement] || wordElement;
    }
  }

  return result;
}

/**
 * replaces spaces in a given string with replacer
 */
export function seoUrlStringReplacer(str: string, replacer: string = '-'): string {
  return str.replace(/[\/,\s<>&'"]/g, replacer);
}

/**
 * Gets keys value from storage
 */
export function getFromSessionStorage(key: string): any {
  const value = sessionStorage.getItem(key);
  try {
    return JSON.parse(value);
  } catch (e) {
    return value;
  }
}

/**
 * Clear local storage
 */
export function clearSessionStorage() {
  sessionStorage.clear();
}

/**
 * Filter out null and undefined properties
 */
export function removeEmptyProperties(props: any): any {
  return Object.keys(props || {})
    .filter((key) => props[key] !== undefined && props[key] !== null)
    .filter((key) => props[key] !== 'undefined' && props[key] !== 'null' && props[key] !== '')
    .filter((key) => (Array.isArray(props[key]) && props[key].length) || !Array.isArray(props[key]))
    .reduce((obj, key) => {
      obj[key] = props[key];
      return obj;
    }, {});
}
