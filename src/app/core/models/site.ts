import { Company } from './company';

export interface Site {
  activity: number;
  certificates: any[];
  contacts: any[];
  dateCreated: {
    date: Date;
  };
  domain: string;
  id: number;
  structure: any[];
  activityName: any;
  company: Company;
}
