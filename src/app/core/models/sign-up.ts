export interface SignUp {
  client: string;
  email: string;
  firstName: string;
  lastName?: string;
  middleName?: string;
  password?: string;
  phoneCode?: string;
  phone: string;
  username: string;
  country: number;
  siteName?: string;
  hash: string;
  individual?: boolean;
}
