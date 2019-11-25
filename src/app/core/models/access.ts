enum ActivityType {
  Supplier = <any>'supplier',
  Manufacturer = <any>'manufacturer',
  CustomsWithoutLicense = <any>'customsWithoutLicense',
  CustomsBroker = <any>'customsBroker',
  DomesticTrucker = <any>'domesticTrucker',
  DomesticRailCarrier = <any>'domesticRailCarrier',
  DomesticAirCarrier = <any>'domesticAirCarrier',
  InternationalTrucker = <any>'internationalTrucker',
  InternationalRailCarrier = <any>'internationalRailCarrier',
  SeaCarrier = <any>'seaCarrier',
  InternationalAirCarrier = <any>'internationalAirCarrier',
  RiverCarrier = <any>'riverCarrier',
  Warehouse = <any>'warehouse',
  WarehouseRent = <any>'warehouseRent',
}

export type AllowAll = '*';
export type DenyAll = '^';
export type AllowForCompany = '~';
export type DenyForCompany = '!';
export type AvailableForActivities = ActivityType[] | AllowAll | DenyAll | AllowForCompany | DenyForCompany;
export type AccessNodes = AccessNode[];
export type AccessGroupDefinitions = Array<AccessGroupDefinition>;

export interface AccessNode {
  action: AccessAction;
  actionGroup: AccessActionGroup;
  availableForActivities: AvailableForActivities;
  translatedTitle: string;
  order: number;
}
export interface AccessGroupDefinition {
  actionGroup: AccessActionGroup;
  translatedTitle: string;
  order: number;
}
export interface AccessActionDependencies {
  nodes: Array<AccessAction>;
  requires: Array<AccessAction>;
}

export enum AccessActionGroup {
  Showcase = <any>'SHOWCASE',
  Route = <any>'ROUTE',
  Customs = <any>'CUSTOMS',
  FinancialSector = <any>'FINANCIAL_SECTOR',
  Transaction = <any>'TRANSACTION',
  Order = <any>'ORDER',
  Offer = <any>'OFFER',
  Partner = <any>'PARTNER',
  Employee = <any>'EMPLOYEE',
  Contract = <any>'CONTRACT',
  Tarification = <any>'TARIFICATION',
  Activity = <any>'ACTIVITY',
  Deals = <any>'DEALS'
}

export enum AccessAction {
  DealsAdd = 'ADD_DEALS',
  DealsApprove = 'APPROVE_DEALS',
  DealsCancel = 'CANCEL_DEALS',
  DealsView = 'VIEW_DEALS',

  OfferView = 'VIEW_OFFER',
  OfferAdd = 'ADD_OFFER',
  OfferEdit = 'EDIT_OFFER',
  OfferDelete = 'DELETE_OFFER',
  OrderConfirmReject = 'REJECT_CONFIRM_ORDER',

  OrderView = 'VIEW_ORDER',
  OrderAdd = 'ADD_ORDER',
  OrderEdit = 'EDIT_ORDER',
  OrderSend = 'SEND_ORDER',
  OrderDelete = 'DELETE_ORDER',
  OfferConfirmReject = 'REJECT_CONFIRM_OFFER',

  ShowcaseAdd = 'ADD_SHOWCASE',
  ShowcaseEdit = 'EDIT_SHOWCASE',
  ShowcaseDelete = 'DELETE_SHOWCASE',
  ShowcaseView = 'VIEW_SHOWCASE',

  RouteView = 'VIEW_ROUTE',
  RouteAdd = 'ADD_ROUTE',
  RouteEdit = 'EDIT_ROUTE',
  RouteDelete = 'DELETE_ROUTE',

  CustomsView = 'VIEW_CUSTOMS',
  CustomsAdd = 'ADD_CUSTOMS',
  CustomsEdit = 'EDIT_CUSTOMS',
  CustomsDelete = 'DELETE_CUSTOMS',

  FinancialSectorSetPrice = 'SET_PRICE_FINANCIAL_SECTOR',
  FinancialSectorEditPrice = 'EDIT_PRICE_FINANCIAL_SECTOR',
  FinancialSectorDeletePrice = 'DELETE_PRICE_FINANCIAL_SECTOR',

  TransactionAdd = 'ADD_TRANSACTION',
  TransactionView = 'VIEW_TRANSACTION',
  TransactionEdit = 'EDIT_TRANSACTION',
  TransactionDelete = 'DELETE_TRANSACTION',

  TarificationAdd = 'ADD_TARIFICATION',
  TarificationView = 'VIEW_TARIFICATION',
  TarificationEdit = 'EDIT_TARIFICATION',
  TarificationDelete = 'DELETE_TARIFICATION',

  PartnerView = 'VIEW_PARTNER',
  PartnerAddClient = 'ADD_CLIENT_PARTNER',
  PartnerApprove = 'APPROVE_PARTNER',
  PartnerSendApplication = 'SEND_APPLICATION_PARTNER',
  PartnerDeleteApplication = 'DELETE_APPLICATION_PARTNER',

  EmployeeView = 'VIEW_EMPLOYEE',
  EmployeeAdd = 'ADD_EMPLOYEE',
  EmployeeEdit = 'EDIT_EMPLOYEE',
  EmployeeDelete = 'DELETE_EMPLOYEE',
  EmployeeViewPosition = 'VIEW_POSITION_EMPLOYEE',
  EmployeeAddPosition = 'ADD_POSITION_EMPLOYEE',
  EmployeeDeletePosition = 'DELETE_POSITION_EMPLOYEE',

  ContractAdd = 'ADD_CONTRACT',
  ContractEdit = 'EDIT_CONTRACT',
  ContractDelete = 'DELETE_CONTRACT',
  ContractView = 'VIEW_CONTRACT',

  ActivityView = 'VIEW_ACTIVITY',
  ActivityAdd = 'ADD_ACTIVITY',
  ActivityEdit = 'EDIT_ACTIVITY',
  ActivityDelete = 'DELETE_ACTIVITY',
}

export const allowedFor: { [id: string]: AvailableForActivities } = {
  [(<any>AccessActionGroup.Showcase)]: [
    ActivityType.Supplier,
    ActivityType.Manufacturer,
  ],
  [(<any>AccessActionGroup.Customs)]: [
    ActivityType.CustomsWithoutLicense,
    ActivityType.CustomsBroker,
  ],
  [(<any>AccessActionGroup.Route)]: [
    ActivityType.DomesticTrucker,
    ActivityType.DomesticRailCarrier,
    ActivityType.DomesticAirCarrier,
    ActivityType.InternationalTrucker,
    ActivityType.InternationalRailCarrier,
    ActivityType.SeaCarrier,
    ActivityType.InternationalAirCarrier,
    ActivityType.RiverCarrier,
  ],
  [(<any>AccessActionGroup.FinancialSector)]: '^',
  [(<any>AccessActionGroup.Transaction)]: '^',
  [(<any>AccessActionGroup.Tarification)]: '^',
  [(<any>AccessActionGroup.Order)]: '~',
  [(<any>AccessActionGroup.Offer)]: '!',
  [(<any>AccessActionGroup.Partner)]: '*',
  [(<any>AccessActionGroup.Employee)]: '^',
  [(<any>AccessActionGroup.Contract)]: '*',
  [(<any>AccessActionGroup.Activity)]: '*',
  [(<any>AccessActionGroup.Deals)]: '^'
};

export const accessNodeDependencies: AccessActionDependencies[] = [
  {
    nodes: [
      AccessAction.OrderAdd,
      AccessAction.OrderDelete,
      AccessAction.OfferConfirmReject,
    ],
    requires: [
      AccessAction.OrderView,
    ],
  },
  {
    nodes: [
      AccessAction.OfferAdd,
      AccessAction.OfferDelete,
      AccessAction.OrderConfirmReject
    ],
    requires: [
      AccessAction.OfferView
    ]
  },
  {
    nodes: [
      AccessAction.DealsAdd,
      AccessAction.DealsApprove,
      AccessAction.DealsCancel
    ],
    requires: [
      AccessAction.DealsView
    ]
  },
  {
    nodes: [
      AccessAction.EmployeeAdd,
      AccessAction.EmployeeDelete,
      AccessAction.EmployeeEdit,
      AccessAction.EmployeeAddPosition,
      AccessAction.EmployeeDeletePosition,
    ],
    requires: [
      AccessAction.EmployeeView,
      AccessAction.EmployeeViewPosition,
    ],
  },
  {
    nodes: [
      AccessAction.CustomsAdd,
      AccessAction.CustomsEdit,
      AccessAction.CustomsDelete,
    ],
    requires: [
      AccessAction.CustomsView,
    ],
  },
  {
    nodes: [
      AccessAction.RouteAdd,
      AccessAction.RouteEdit,
      AccessAction.RouteDelete,
    ],
    requires: [
      AccessAction.RouteView,
    ],
  },
  {
    nodes: [
      AccessAction.ContractAdd,
      AccessAction.ContractEdit,
      AccessAction.ContractDelete,
    ],
    requires: [
      AccessAction.ContractView,
    ],
  },
  {
    nodes: [
      AccessAction.PartnerAddClient,
      AccessAction.PartnerDeleteApplication,
      AccessAction.PartnerApprove,
      AccessAction.PartnerSendApplication,
    ],
    requires: [
      AccessAction.PartnerView,
    ],
  },
  {
    nodes: [
      AccessAction.ActivityAdd,
      AccessAction.ActivityEdit,
      AccessAction.ActivityDelete,
    ],
    requires: [
      AccessAction.ActivityView,
    ],
  },
  {
    nodes: [
    ],
    requires: [
      AccessAction.TarificationView,
    ],
  },
];

export function getAccessGroupDefinitions(): AccessGroupDefinitions {
  return [
    {
      actionGroup: AccessActionGroup.Order,
      translatedTitle: 'access.actionGroups.order',
      order: 1
    },
    {
      actionGroup: AccessActionGroup.Offer,
      translatedTitle: 'access.actionGroups.offer',
      order: 2
    },
    {
      actionGroup: AccessActionGroup.Route,
      translatedTitle: 'access.actionGroups.route',
      order: 3
    },
    {
      actionGroup: AccessActionGroup.Customs,
      translatedTitle: 'access.actionGroups.customs',
      order: 4
    },
    {
      actionGroup: AccessActionGroup.Showcase,
      translatedTitle: 'access.actionGroups.showcase',
      order: 5
    },
    {
      actionGroup: AccessActionGroup.Partner,
      translatedTitle: 'access.actionGroups.partner',
      order: 6
    },
    {
      actionGroup: AccessActionGroup.Employee,
      translatedTitle: 'access.actionGroups.employee',
      order: 7
    },
    {
      actionGroup: AccessActionGroup.Contract,
      translatedTitle: 'access.actionGroups.contract',
      order: 8
    },
    {
      actionGroup: AccessActionGroup.Activity,
      translatedTitle: 'access.actionGroups.activity',
      order: 9
    },
    {
      actionGroup: AccessActionGroup.Deals,
      translatedTitle: 'access.actionGroups.deals',
      order: 10
    },
    {
      actionGroup: AccessActionGroup.FinancialSector,
      translatedTitle: 'access.actionGroups.financialSector',
      order: 11
    },
    {
      actionGroup: AccessActionGroup.Transaction,
      translatedTitle: 'access.actionGroups.transaction',
      order: 12
    },
    {
      actionGroup: AccessActionGroup.Tarification,
      translatedTitle: 'access.actionGroups.tarification',
      order: 13
    }
  ];
}

export const INDIVIDUAL_ACCESS_ACTIONS = [
  'VIEW_ORDER',
  'ADD_ORDER',
  'EDIT_ORDER',
  'SEND_ORDER',
  'DELETE_ORDER',
  'REJECT_CONFIRM_OFFER',

  'VIEW_PARTNER',
  'ADD_CLIENT_PARTNER',
  'APPROVE_PARTNER',
  'SEND_APPLICATION_PARTNER',
  'DELETE_APPLICATION_PARTNER',
];

export const ALL_ACCESS_ACTIONS = [
  'VIEW_OFFER',
  'ADD_OFFER',
  'EDIT_OFFER',
  'DELETE_OFFER',
  'REJECT_CONFIRM_ORDER',

  'VIEW_ORDER',
  'ADD_ORDER',
  'DELETE_ORDER',
  'REJECT_CONFIRM_OFFER',

  'ADD_SHOWCASE',
  'EDIT_SHOWCASE',
  'DELETE_SHOWCASE',
  'VIEW_SHOWCASE',

  'VIEW_ROUTE',
  'ADD_ROUTE',
  'EDIT_ROUTE',
  'DELETE_ROUTE',

  'VIEW_CUSTOMS',
  'ADD_CUSTOMS',
  'EDIT_CUSTOMS',
  'DELETE_CUSTOMS',

  'SET_PRICE_FINANCIAL_SECTOR',
  'EDIT_PRICE_FINANCIAL_SECTOR',
  'DELETE_PRICE_FINANCIAL_SECTOR',

  'ADD_TRANSACTION',
  'VIEW_TRANSACTION',
  'EDIT_TRANSACTION',
  'DELETE_TRANSACTION',

  'ADD_TARIFICATION',
  'VIEW_TARIFICATION',
  'EDIT_TARIFICATION',
  'DELETE_TARIFICATION',

  'VIEW_PARTNER',
  'ADD_CLIENT_PARTNER',
  'APPROVE_PARTNER',
  'SEND_APPLICATION_PARTNER',
  'DELETE_APPLICATION_PARTNER',

  'VIEW_EMPLOYEE',
  'ADD_EMPLOYEE',
  'EDIT_EMPLOYEE',
  'DELETE_EMPLOYEE',
  'VIEW_POSITION_EMPLOYEE',
  'ADD_POSITION_EMPLOYEE',
  'DELETE_POSITION_EMPLOYEE',

  'ADD_CONTRACT',
  'EDIT_CONTRACT',
  'DELETE_CONTRACT',
  'VIEW_CONTRACT',

  'VIEW_DEALS',
  'ADD_DEALS',
  'APPROVE_DEALS',
  'CANCEL_DEALS',

  'VIEW_ACTIVITY',
  'ADD_ACTIVITY',
  'EDIT_ACTIVITY',
  'DELETE_ACTIVITY',
];

const offerActions: AccessNodes = [
  {
    action: AccessAction.OfferView,
    actionGroup: AccessActionGroup.Offer,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Offer)],
    translatedTitle: 'access.actions.offer.view',
    order: 1
  },
  {
    action: AccessAction.OfferAdd,
    actionGroup: AccessActionGroup.Offer,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Offer)],
    translatedTitle: 'access.actions.offer.add',
    order: 2
  },
  {
    action: AccessAction.OfferDelete,
    actionGroup: AccessActionGroup.Offer,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Offer)],
    translatedTitle: 'access.actions.offer.delete',
    order: 3
  },
  {
    action: AccessAction.OrderConfirmReject,
    actionGroup: AccessActionGroup.Offer,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Offer)],
    translatedTitle: 'access.actions.offer.confirmReject',
    order: 4
  }
];
const dealActions: AccessNodes = [
  {
    action: AccessAction.DealsView,
    actionGroup: AccessActionGroup.Deals,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Deals)],
    translatedTitle: 'access.actions.deals.view',
    order: 1
  },
  {
    action: AccessAction.DealsAdd,
    actionGroup: AccessActionGroup.Deals,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Deals)],
    translatedTitle: 'access.actions.deals.add',
    order: 2
  },
  {
    action: AccessAction.DealsApprove,
    actionGroup: AccessActionGroup.Deals,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Deals)],
    translatedTitle: 'access.actions.deals.approve',
    order: 3
  },
  {
    action: AccessAction.DealsCancel,
    actionGroup: AccessActionGroup.Deals,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Deals)],
    translatedTitle: 'access.actions.deals.cancel',
    order: 4
  }
];
const showcaseActions: AccessNodes = [
  {
    action: AccessAction.ShowcaseView,
    actionGroup: AccessActionGroup.Showcase,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Showcase)],
    translatedTitle: 'access.actions.showcase.view',
    order: 1,
  },
  {
    action: AccessAction.ShowcaseAdd,
    actionGroup: AccessActionGroup.Showcase,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Showcase)],
    translatedTitle: 'access.actions.showcase.add',
    order: 2,
  },
  {
    action: AccessAction.ShowcaseEdit,
    actionGroup: AccessActionGroup.Showcase,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Showcase)],
    translatedTitle: 'access.actions.showcase.edit',
    order: 3,
  },
  {
    action: AccessAction.ShowcaseDelete,
    actionGroup: AccessActionGroup.Showcase,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Showcase)],
    translatedTitle: 'access.actions.showcase.delete',
    order: 4
  }
];
const routeActions: AccessNodes = [
  {
    action: AccessAction.RouteView,
    actionGroup: AccessActionGroup.Route,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Route)],
    translatedTitle: 'access.actions.route.view',
    order: 1,
  },
  {
    action: AccessAction.RouteAdd,
    actionGroup: AccessActionGroup.Route,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Route)],
    translatedTitle: 'access.actions.route.add',
    order: 2,
  },
  {
    action: AccessAction.RouteEdit,
    actionGroup: AccessActionGroup.Route,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Route)],
    translatedTitle: 'access.actions.route.edit',
    order: 3,
  },
  {
    action: AccessAction.RouteDelete,
    actionGroup: AccessActionGroup.Route,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Route)],
    translatedTitle: 'access.actions.route.delete',
    order: 4,
  },
];
const customActions: AccessNodes = [
  {
    action: AccessAction.CustomsView,
    actionGroup: AccessActionGroup.Customs,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Customs)],
    translatedTitle: 'access.actions.customs.view',
    order: 1,
  },
  {
    action: AccessAction.CustomsAdd,
    actionGroup: AccessActionGroup.Customs,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Customs)],
    translatedTitle: 'access.actions.customs.add',
    order: 2,
  },
  {
    action: AccessAction.CustomsEdit,
    actionGroup: AccessActionGroup.Customs,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Customs)],
    translatedTitle: 'access.actions.customs.edit',
    order: 3,
  },
  {
    action: AccessAction.CustomsDelete,
    actionGroup: AccessActionGroup.Customs,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Customs)],
    translatedTitle: 'access.actions.customs.delete',
    order: 4,
  }
];
const transactionActions: AccessNodes = [
  {
    action: AccessAction.TransactionAdd,
    actionGroup: AccessActionGroup.Transaction,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Transaction)],
    translatedTitle: 'access.actions.transaction.add',
    order: 1,
  },
  {
    action: AccessAction.TransactionView,
    actionGroup: AccessActionGroup.Transaction,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Transaction)],
    translatedTitle: 'access.actions.transaction.view',
    order: 2,
  },
  {
    action: AccessAction.TransactionEdit,
    actionGroup: AccessActionGroup.Transaction,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Transaction)],
    translatedTitle: 'access.actions.transaction.edit',
    order: 3,
  },
  {
    action: AccessAction.TransactionDelete,
    actionGroup: AccessActionGroup.Transaction,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Transaction)],
    translatedTitle: 'access.actions.transaction.delete',
    order: 4,
  }
];
const orderActions: AccessNodes = [
  {
    action: AccessAction.OrderView,
    actionGroup: AccessActionGroup.Order,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Order)],
    translatedTitle: 'access.actions.order.view',
    order: 1,
  },
  {
    action: AccessAction.OrderAdd,
    actionGroup: AccessActionGroup.Order,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Order)],
    translatedTitle: 'access.actions.order.add',
    order: 2,
  },
  {
    action: AccessAction.OrderDelete,
    actionGroup: AccessActionGroup.Order,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Order)],
    translatedTitle: 'access.actions.order.delete',
    order: 3,
  },
  {
    action: AccessAction.OfferConfirmReject,
    actionGroup: AccessActionGroup.Order,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Order)],
    translatedTitle: 'access.actions.order.confirmReject',
    order: 4,
  }
];
const partnerActions: AccessNodes = [
  {
    action: AccessAction.PartnerView,
    actionGroup: AccessActionGroup.Partner,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Partner)],
    translatedTitle: 'access.actions.partner.view',
    order: 1,
  },
  {
    action: AccessAction.PartnerAddClient,
    actionGroup: AccessActionGroup.Partner,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Partner)],
    translatedTitle: 'access.actions.partner.addClient',
    order: 2,
  },
  {
    action: AccessAction.PartnerApprove,
    actionGroup: AccessActionGroup.Partner,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Partner)],
    translatedTitle: 'access.actions.partner.approuve',
    order: 3,
  },
  {
    action: AccessAction.PartnerSendApplication,
    actionGroup: AccessActionGroup.Partner,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Partner)],
    translatedTitle: 'access.actions.partner.sendApplication',
    order: 4,
  },
  {
    action: AccessAction.PartnerDeleteApplication,
    actionGroup: AccessActionGroup.Partner,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Partner)],
    translatedTitle: 'access.actions.partner.deleteApplicationPartner',
    order: 5,
  }
];
const employeeActions: AccessNodes = [
  {
    action: AccessAction.EmployeeView,
    actionGroup: AccessActionGroup.Employee,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Employee)],
    translatedTitle: 'access.actions.employee.view',
    order: 1,
  },
  {
    action: AccessAction.EmployeeAdd,
    actionGroup: AccessActionGroup.Employee,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Employee)],
    translatedTitle: 'access.actions.employee.add',
    order: 2,
  },
  {
    action: AccessAction.EmployeeEdit,
    actionGroup: AccessActionGroup.Employee,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Employee)],
    translatedTitle: 'access.actions.employee.edit',
    order: 3,
  },
  {
    action: AccessAction.EmployeeDelete,
    actionGroup: AccessActionGroup.Employee,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Employee)],
    translatedTitle: 'access.actions.employee.delete',
    order: 4,
  },
  {
    action: AccessAction.EmployeeViewPosition,
    actionGroup: AccessActionGroup.Employee,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Employee)],
    translatedTitle: 'access.actions.employee.viewPosition',
    order: 5,
  },
  {
    action: AccessAction.EmployeeAddPosition,
    actionGroup: AccessActionGroup.Employee,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Employee)],
    translatedTitle: 'access.actions.employee.addPosition',
    order: 6,
  },
  {
    action: AccessAction.EmployeeDeletePosition,
    actionGroup: AccessActionGroup.Employee,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Employee)],
    translatedTitle: 'access.actions.employee.deletePosition',
    order: 7,
  }
];
const contractActions: AccessNodes = [
  {
    action: AccessAction.ContractView,
    actionGroup: AccessActionGroup.Contract,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Contract)],
    translatedTitle: 'access.actions.contract.view',
    order: 1,
  },
  {
    action: AccessAction.ContractAdd,
    actionGroup: AccessActionGroup.Contract,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Contract)],
    translatedTitle: 'access.actions.contract.add',
    order: 2,
  },
  {
    action: AccessAction.ContractEdit,
    actionGroup: AccessActionGroup.Contract,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Contract)],
    translatedTitle: 'access.actions.contract.edit',
    order: 3,
  },
  {
    action: AccessAction.ContractDelete,
    actionGroup: AccessActionGroup.Contract,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Contract)],
    translatedTitle: 'access.actions.contract.delete',
    order: 4
  }
];
const activityActions: AccessNodes = [
  {
    action: AccessAction.ActivityView,
    actionGroup: AccessActionGroup.Activity,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Activity)],
    translatedTitle: 'access.actions.activity.view',
    order: 1,
  },
  {
    action: AccessAction.ActivityAdd,
    actionGroup: AccessActionGroup.Activity,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Activity)],
    translatedTitle: 'access.actions.activity.add',
    order: 2,
  },
  {
    action: AccessAction.ActivityEdit,
    actionGroup: AccessActionGroup.Activity,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Activity)],
    translatedTitle: 'access.actions.activity.edit',
    order: 3,
  },
  {
    action: AccessAction.ActivityDelete,
    actionGroup: AccessActionGroup.Activity,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Activity)],
    translatedTitle: 'access.actions.activity.delete',
    order: 4,
  }
];
const tarificationActions: AccessNodes = [
  {
    action: AccessAction.TarificationView,
    actionGroup: AccessActionGroup.Tarification,
    availableForActivities: allowedFor[(<any>AccessActionGroup.Tarification)],
    translatedTitle: 'access.actions.tarification.view',
    order: 1,
  },
];
const financialSectorActions: AccessNodes = [
  {
    action: AccessAction.FinancialSectorSetPrice,
    actionGroup: AccessActionGroup.FinancialSector,
    availableForActivities: allowedFor[(<any>AccessActionGroup.FinancialSector)],
    translatedTitle: 'access.actions.financialSector.setPrice',
    order: 1,
  },
  {
    action: AccessAction.FinancialSectorEditPrice,
    actionGroup: AccessActionGroup.FinancialSector,
    availableForActivities: allowedFor[(<any>AccessActionGroup.FinancialSector)],
    translatedTitle: 'access.actions.financialSector.editPrice',
    order: 2,
  },
  {
    action: AccessAction.FinancialSectorDeletePrice,
    actionGroup: AccessActionGroup.FinancialSector,
    availableForActivities: allowedFor[(<any>AccessActionGroup.FinancialSector)],
    translatedTitle: 'access.actions.financialSector.deletePrice',
    order: 3,
  }
];

export function getAccessActionsTree(): AccessNodes {
  return [
    ...offerActions,
    ...orderActions,
    ...showcaseActions,
    ...customActions,
    ...routeActions,
    ...partnerActions,
    ...employeeActions,
    ...contractActions,
    ...activityActions,
    ...dealActions,
    ...financialSectorActions,
    ...transactionActions,
    ...tarificationActions
  ];
}
