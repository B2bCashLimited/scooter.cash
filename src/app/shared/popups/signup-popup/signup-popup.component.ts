import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-signup-popup',
  templateUrl: './signup-popup.component.html',
  styleUrls: ['./signup-popup.component.scss']
})
export class SignupPopupComponent {

  constructor(public dialogRef: MatDialogRef<SignupPopupComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  confirm() {
    this.dialogRef.close({action: 'confirm'});
  }
}
