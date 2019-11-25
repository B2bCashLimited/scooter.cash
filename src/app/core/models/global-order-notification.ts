export interface GlobalOrderNotification {
  total: number;
  notifications: number[];
  category: {
    id: number;
    nameRu: string;
    nameEn: string;
    nameCn: string;
  };
}
