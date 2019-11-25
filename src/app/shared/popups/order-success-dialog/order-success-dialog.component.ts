import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-order-success-dialog',
  templateUrl: './order-success-dialog.component.html',
  styleUrls: ['./order-success-dialog.component.scss']
})
export class OrderSuccessDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<OrderSuccessDialogComponent>
  ) {
  }

  ngOnInit(): void {
  }

  close(): void {
    this.dialogRef.close();
  }
}
