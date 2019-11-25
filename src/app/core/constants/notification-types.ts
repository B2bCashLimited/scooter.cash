export class NotificationTypes {
  static NEW_MESSAGE = 1;                                 // Новое сообщение в чате
  static NEW_DEAL = 2;                                    // Новая сделка
  static COMPANY_MODERATED = 3;                           // компания отмодерирована
  static ACTIVITY_MODERATED = 4;                          // ВД отмодерирован
  static PRODUCT_MODERATED = 5;                           // продукт отмодерирован
  static SHOWCASE_MODERATED = 6;                          // витрина отмодерирована
  static NEW_PARTNER = 7;                                 // новый партнер
  static PARTNER_APPROVED = 8;                            // партнер подтвержден
  static PARTNER_CANCELED = 9;                            // в партнерстве отказано
  static SYSCHAT_CLOSED = 10;                             // сис чат закрылся
  static NEW_EMPLOYEE = 11;                               // новый сотрудник
  static PARTNER_BROKE_UP = 12;                           // партнерство разорвано
  static TYPE_PRODUCT_ORDER_CREATED = 20;                 // это уведомление другим запросом дергается
  static TYPE_WITHDRAW = 21;                              // списание средств
  static GIFT_GOTTEN = 22;                                // бонус
  static TYPE_FROZEN = 23;                                // Заморозка средств
  static TYPE_REFUND = 24;                                // Возврат средств
}
