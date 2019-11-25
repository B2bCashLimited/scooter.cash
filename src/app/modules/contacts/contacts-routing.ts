import { RouterModule, Routes } from '@angular/router';
import { ContactsComponent } from '@b2b/modules/contacts/contacts.component';

const routes: Routes = [
  {
    path: '',
    component: ContactsComponent
  }
];

export const ContactsRouting = RouterModule.forChild(routes);
