import { Component } from '@angular/core';
import { MatDialog } from '@angular/material';

@Component({
  selector: 'app-chat-popup',
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.scss']
})
export class ChatPopUpComponent {
  constructor(
    public dialog: MatDialog
  ) {
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(ChatPopUpComponent, {
      width: '250px',
    });
  }
}
