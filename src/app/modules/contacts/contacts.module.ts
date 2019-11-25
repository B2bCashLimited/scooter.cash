import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactsComponent } from './contacts.component';
import { SharedModule } from '@b2b/shared/shared.module';
import { ContactsRouting } from '@b2b/modules/contacts/contacts-routing';

@NgModule({
  declarations: [ContactsComponent],
  imports: [
    CommonModule,
    SharedModule,
    ContactsRouting,
  ]
})
export class ContactsModule {
}
