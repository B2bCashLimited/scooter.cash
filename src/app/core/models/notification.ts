export interface Notification {
  attributes: any;
  author_company_id: number | null;
  author_id: number | null;
  company_id: number | null;
  created_at: string;
  id: number;
  read: boolean;
  read_at: string | null;
  type: number;
  user_id: number;
  newMessagesCount?: number;
}
