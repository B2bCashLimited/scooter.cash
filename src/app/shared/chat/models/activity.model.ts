export interface ActNameConverter {
    path: string;
    path2: string;
    dispatchM: string;
    dispatchE: string;
    dispatchF: string;
}

export const NO_LOGO_URL = '../assets/img/stubs/nologo.png';

export const actNameConverter: ActNameConverter[] = [
  {
    path: 'warehouses',
    path2: 'warehouse',
    dispatchM: 'warehouses',
    dispatchE: 'warehouse',     // keyName activityNames
    dispatchF: 'warehouse'
  },
  {
    path: 'river-carriers',
    path2: 'river-carrier',
    dispatchM: 'riverCarriers',
    dispatchE: 'riverCarrier',
    dispatchF: 'river_carrier'
  },
  {
    path: 'domestic-auto-carriers',
    path2: 'domestic-auto-carrier',
    dispatchM: 'domesticTruckers',
    dispatchE: 'domesticTrucker',
    dispatchF: 'domestic_trucker'
  },
  {
    path: 'domestic-rail-carriers',
    path2: 'domestic-rail-carrier',
    dispatchM: 'domesticRailCarriers',
    dispatchE: 'domesticRailCarrier',
    dispatchF: 'domestic_rail_carrier'
  },
  {
    path: 'domestic-air-carriers',
    path2: 'domestic-air-carrier',
    dispatchM: 'domesticAirCarriers',
    dispatchE: 'domesticAirCarrier',
    dispatchF: 'domestic_air_carrier'
  },
  {
    path: 'international-auto-carriers',
    path2: 'international-auto-carrier',
    dispatchM: 'internationalTruckers',
    dispatchE: 'internationalTrucker',
    dispatchF: 'international_trucker'
  },
  {
    path: 'international-rail-carriers',
    path2: 'international-rail-carrier',
    dispatchM: 'internationalRailCarriers',
    dispatchE: 'internationalRailCarrier',
    dispatchF: 'international_rail_carrier'
  },
  {
    path: 'international-air-carriers',
    path2: 'international-air-carrier',
    dispatchM: 'internationalAirCarriers',
    dispatchE: 'internationalAirCarrier',
    dispatchF: 'international_air_carrier'
  },
  {
    path: 'manufacturers',
    path2: 'manufacturer',
    dispatchM: 'manufacturers',
    dispatchE: 'manufacturer',
    dispatchF: 'manufacturer'
  },
  {
    path: 'customs-brokers',
    path2: 'customs-broker',
    dispatchM: 'customsBrokers',
    dispatchE: 'customsBroker',
    dispatchF: 'customs_broker'
  },
  {
    path: 'customs-without-license',
    path2: 'customs-without-license',
    dispatchM: 'customsWithoutLicenses',
    dispatchE: 'customsWithoutLicense',
    dispatchF: 'customs_without_license'
  },
  {
    path: 'suppliers',
    path2: 'supplier',
    dispatchM: 'suppliers',
    dispatchE: 'supplier',
    dispatchF: 'supplier'
  },
  {
    path: 'sea-carriers',
    path2: 'sea-carrier',
    dispatchM: 'seaCarriers',
    dispatchE: 'seaCarrier',
    dispatchF: 'sea_carrier'
  },
  {
    path: 'warehouse-rent',
    path2: 'warehouse-rent',
    dispatchM: 'warehouseRents',
    dispatchE: 'warehouseRent',
    dispatchF: 'warehouse_rent'
  }
];
