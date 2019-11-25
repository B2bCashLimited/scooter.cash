export class Patterns {
  static PHONE = '^[+]{0,1}[0-9 -.\/][(]{0,1}[0-9]{1,4}[)]{0,1}[0-9 -.\/]*$';
  static EMAIL = '[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}';
  static PASSWORD = '^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$';
  static ITNIEC = '^[0-9 -.\/]*$';
  static DIGITS_AND_SLASH = '^[0-9 -.\/]*$';
  static LATINLETTERS_AND_DIGITS = '^[a-zA-Z0-9]+$';
  static CHINESE_AND_LATIN_AND_ELSE = '^[\u4E00-\u9FFF\u3400-\u4DFFa-zA-Z0-9 -.\/]+$';
  static CHINESE_AND_LATIN_AND_DIGITS = '^[\u4E00-\u9FFF\u3400-\u4DFFa-zA-Z0-9 ]+$';
}
