import { NgModule } from '@angular/core';
import { RestoreRouting } from './restore.routing';
import { RestoreComponent } from './restore.component';
import { SharedModule } from '@b2b/shared/shared.module';

@NgModule({
  imports: [
    SharedModule,
    RestoreRouting
  ],
  declarations: [
    RestoreComponent
  ]
})
export class RestoreModule {
}
