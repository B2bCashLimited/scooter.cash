import {
  Component,
  OnInit,
  Input,
  AfterViewChecked,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  OnDestroy,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  MatDialog,
  MatDialogRef,
  MatSnackBar
} from '@angular/material';
import { ChatGroupComponent } from '../group-chat/group-chat.component';
import { ChatInfoComponent } from '../info-chat/info-chat.component';
import { WindowService } from '../services/window.service';
import * as moment from 'moment';
import { catchError, filter, map, switchMap, takeUntil } from 'rxjs/operators';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { NO_LOGO_URL } from '../models/activity.model';
import { isPlatformBrowser } from '@angular/common';
import { ActivityName, Chat, Message, Relations, SelectedActivity, User } from '@b2b/models';
import { FileLikeObject, FileUploader } from 'ng2-file-upload';
import { interval, Subject, Subscription } from 'rxjs';
import { ChatService, ConfigService, UploadService, UserService } from '@b2b/services';
import { allowedImageType, allowedDocType } from '@b2b/helpers/mime-types';
import { getFromLocalStorage, setToLocalStorage } from '@b2b/helpers/utils';
import { ChatMessageTypes } from '@b2b/constants';
import {
  ActivityCountrySelectDialogComponent
} from '@b2b/shared/popups/activity-country-select-dialog/activity-country-select-dialog.component';

@Component({
  selector: 'app-chat-window',
  templateUrl: './window.component.html',
  styleUrls: ['./window.component.scss'],
})
export class ChatWindowComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('TextArea') TextArea: ElementRef;           // 2 фокуса
  @ViewChild('ListCollection') ListCollection: ElementRef;       // размеры и скролл
  @ViewChild('List') private ListContainer: ElementRef;
  @ViewChild('ToolBar') private ToolBar: ElementRef;
  @Input() companyId = 0;          // только передача в групЧат?
  @Input() activityKey = '';       // только передача в групЧат?
  @Input() activityId = 0;         // только передача в групЧат?
  actNameId = 0;
  private stuck = 0;        // запрещение догрузки в опр случаях?
  groupDialogChatRef: MatDialogRef<ChatGroupComponent>;
  infoDialogChatRef: MatDialogRef<ChatInfoComponent>;
  messages: Message[] = [];
  chat: Chat;
  consultant: any;
  consultantLanguage: string[] = [];
  consultantName: string;
  consultantPhoto: string;
  @Input() activities: ActivityName[];     // Список автивитисов
  loaded = {
    messages: -1,
    loading: false
  };
  user: any;
  dimensions = {
    ListContainer: 0,
    ListCollection: 0,
    ToolBar: 0
  };
  textareaValue = '';      // ngModel
  page = 1;
  owner = 1;
  ownerRelation = 0;         // владелец чата(1), нет(0)?
  totalItems = 0;
  chatType = 3;
  partners = [];
  mobile = 0;
  showIsQuestionAnsweredDialog = false;
  showNextQuestionDialog = false;
  showRateConsultantDialog = false;
  uploader: FileUploader; // = new FileUploader({maxFileSize: 1024 * 1024});
  allowedImageType = allowedImageType;
  allowedDocType = allowedDocType;
  maxFileSize = 1024 * 1024;
  interval$;

  readonly OCCUPATION_CLASS = {
    supplier: 'bb bb-provider',
    manufacturer: 'bb bb-manufactory',
    customsWithoutLicense: 'bb bb-customs',
    customsBroker: 'bb bb-customs-license',
    domesticTrucker: 'bb bb-lorry-country',
    domesticRailCarrier: 'bb bb-rails-country',
    domesticAirCarrier: 'bb bb-plane-country',
    internationalTrucker: 'bb bb-lorry-world',
    internationalRailCarrier: 'bb bb-rails-world',
    seaCarrier: 'bb bb-ship-sea',
    internationalAirCarrier: 'bb bb-plane-world',
    riverCarrier: 'bb bb-ship-river',
    warehouseRent: 'bb bb-warehouse-rent',
    warehouse: 'bb bb-warehouse-security'
  };
  private timeout: any;
  private _createSysChatSub: Subscription;
  private _confirmDialogSub: Subscription;
  private _actChooseDialogSub: Subscription;
  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    @Inject(PLATFORM_ID) private platformId: any,
    private _config: ConfigService,
    private _matDialog: MatDialog,
    public chatService: ChatService,
    private _usersService: UserService,
    private _elementRef: ElementRef,
    private _windowService: WindowService,
    private ref: ChangeDetectorRef,
    public translate: TranslateService,
    private _matSnackBar: MatSnackBar,
    private _uploadService: UploadService,
  ) {
  }

  ngAfterViewChecked(): void {
    try {
      if (this.ListContainer && this.ToolBar) {
        this.dimensions.ListContainer = this.ListContainer.nativeElement.scrollHeight;
        this.dimensions.ToolBar = this.ToolBar.nativeElement.scrollHeight;
        this.dimensions.ListCollection = this.dimensions.ListContainer - 70 - this.dimensions.ToolBar;
      }
      this.ref.detectChanges();
    } catch (e) {
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();

    if (this.chatType === 1) {
      this.chatService.send(this.chat ? this.chat.id : 0, '', ChatMessageTypes.TYPE_CLOSE_WINDOW);
    }
  }

  ngOnInit(): void {
    this.openCurrentChat();
    this.getOwner();
    this.getUser();
    this.getChatType();

    this._windowService.width$
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((value: any) => {
        if (value < 768) {
          this.mobile = 1;
        } else {
          this.mobile = 0;
        }
      });

    this.getNewMessages();

    this.chatService.read
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(read => {        // изменение стилей после активности релэйшна?
        if (this.chat && +this.chat.id === +read.chat_id) {
          [].forEach.call(this._elementRef.nativeElement.querySelectorAll('i.readIcon:not([read="done_all"])'), (element) => {
            element.innerHTML = 'done_all';
            element.setAttribute('read', 'done_all');
          });
        }
      });

    this.configureFileUploader();
    this.interval$ = interval(this.chatService.createSysChatIntervalTime);

    this.chatService.chatAutoclosed
      .pipe(
        filter(res => !!res),
        takeUntil(this._unsubscribe$)
      )
      .subscribe(() => this.loaded.messages = -2);
  }

  getOwner(): void {
    if (isPlatformBrowser(this.platformId) && getFromLocalStorage('chat')) {
      this.owner = getFromLocalStorage('chat')['owner'];
    }

    this.chatService.owner
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(
        owner => this.owner = owner);
  }

  getUser(): void {
    this._usersService.currentUser$
      .pipe(
        filter((user: User) => !!user),
        takeUntil(this._unsubscribe$)
      )
      .subscribe((user: User) => this.user = user);
  }

  getChatType(): void {
    let chatLS;
    if (isPlatformBrowser(this.platformId)) {
      chatLS = getFromLocalStorage('chat');
    }
    if (chatLS) {
      this.chatType = chatLS.section;
    }
    this.chatService.chatType
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(type => {
        this.chatType = type;
        if (this.chatService.banned.value) {
          this.loaded.messages = -3;
        }
      });
  }

  openCurrentChat(): void {
    this.chatService.currentChatId
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(chatId => {
        if (chatId) {
          this.getChat(chatId);
          this.getMessages(chatId);
          this.chatService.clientConnected(chatId);
        } else {
          this.loaded.messages = -1;
        }
      });
  }

  getChat(chatId): void {
    this.chatService.getChat(chatId)
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(chat => {
        if (this.chat && +this.chat.id !== +chat.id) {
          this.showIsQuestionAnsweredDialog = false;        // обнуляем при открытии другого чата
          this.showNextQuestionDialog = false;
          this.showRateConsultantDialog = false;
        }
        this.chat = chat;

        if (chat.relations) {
          if (this.chatType === 1) {
            this.chatService.clientOpenedWindow(this.chat.id);
            this.chatService.send(this.chat.id, '', ChatMessageTypes.TYPE_OPEN_WINDOW);
            const consultant = chat.relations.find(value => !value.companyName);

            if (consultant) {
              this.consultant = consultant;
              this.consultantName = consultant.userName + ' ' + consultant.userSurname;
              this.consultantPhoto = '../assets/img/stubs/consultant_nophoto.png';    // добавить фото консультанта
              this.consultantLanguage = consultant.consultantLanguage
                ? consultant.consultantLanguage.map(val => val && val.toLowerCase()) : [];
            }
          } else {
            this.chatService.clientClosedWindow(this.chat.id);
          }
          if (this.user && +chat.relations[0].userId === +this.user.id) {
            this.ownerRelation = 1;
          } else {
            this.ownerRelation = 0;
          }
        }
        this.page = 1;
        this.stuck = 0;
      });
  }

  getNewMessages(): void {
    this.chatService.newMessage
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(messages => {
        if (this.chat && messages && +this.chat.id === +messages.chat_id) {
          this.messages.push(messages);
          this.chatService.countUnread(messages.id, messages.chat_id, 3);
          setTimeout(() => this.scrollToBottom());

          if (this.chatType === 1 && +this.consultant.userId === +messages.user_id) {
            this.showRateConsultantDialog = false;
            clearTimeout(this.timeout);
            this.timeout = setTimeout(() => {
              this.showIsQuestionAnsweredDialog = true;
            }, 0);
          } else if (this.chatType === 1 && +this.consultant.userId !== +messages.user_id) {
            this.showIsQuestionAnsweredDialog = false;
          }
        }
      });
  }

  getMessages(chatId): void {
    this.chatService.getMessages(chatId)
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((data) => {
        this.loaded.messages = 0;
        this.textareaValue = null;        // сообщение
        this.totalItems = data.total;
        this.messages = [];
        let messagesList = [];
        if (data.data) {
          messagesList = data.data.reverse();
        }
        messagesList.map(message => {
          this.messages.push(message);
          if (+message.status === 1) {
            this.chatService.countUnread(message.id, message.chat_id, 3);
          }
        });
        setTimeout(() => {
          [].forEach.call(this._elementRef.nativeElement.querySelectorAll('i.readIcon:not([read="done_all"])'), function (element) {
            element.setAttribute('read', 'done_all');
          });
          this.loaded.messages = 1;
        }, 400);
        if (this.mobile === 0) {
          setTimeout(() => {
            this.scrollToBottom();
            this.TextArea.nativeElement.focus();
          }, 500);
        }
      });
  }

  configureFileUploader() {
    this.uploader = new FileUploader({maxFileSize: this.maxFileSize});
    this.uploader.onAfterAddingFile = (fileItem: any) => {
      this.onFileEmit(fileItem);
    };
    this.uploader.onWhenAddingFileFailed = (item: FileLikeObject, filter1: any, options: any) => {
      if (filter1.name === 'fileSize') {
        this._matSnackBar.open(this.translate.instant('chat.maxFileSizeExceededError'), 'ok', {
          duration: 3000,
        });
      } else {
        this._matSnackBar.open(this.translate.instant('chat.errorWhileAddingFile'), 'ok', {
          duration: 3000,
        });
      }
    };
  }

  groupDialogChat(): void {         // плюсик для добавления группчата
    this.groupDialogChatRef = this._matDialog.open(ChatGroupComponent, {
      width: '600px',
      data: {
        chat: this.chat,
        activities: this.activities,
        user: this.user,
        type: +this.chatType,
        owner: +this.owner,
        activityId: +this.activityId,
        activityKey: this.activityKey,
        companyId: +this.companyId
      }
    });
  }

  deleteChat(): void {
    if (this._confirmDialogSub && !this._confirmDialogSub.closed) {
      this._confirmDialogSub.unsubscribe();
    }

    this._confirmDialogSub = this._matDialog.open(ConfirmationDialogComponent, {
      width: '300px',
      data: {
        question: this.translate.instant('chat.youReallyWannaDeleteThisChat'),
        yes: {
          text: this.translate.instant('chat.yes'),
          value: true
        },
        no: {
          text: this.translate.instant('chat.no'),
          value: false
        }
      }
    })
      .afterClosed()
      .pipe(
        filter(res => !!res),
        switchMap(() => {
          return this.chatService.deleteChat(this.chat.id)
            .pipe(
              map(() => {
                this._matSnackBar.open(this.translate.instant('chat.chatDeleted'), 'Скрыть', {duration: 3000});
                this.chatService.contactsUpdate();
                this.loaded.messages = -1;
              })
            );
        })
      )
      .subscribe(() => {
      }, err => {
        this._matSnackBar.open(err.error.status + ': ' + err.error.title, 'Скрыть', {duration: 3000});
      });
  }

  infoDialogChat(): void {        // список участников чата при клике на название чата
    this.infoDialogChatRef = this._matDialog.open(ChatInfoComponent, {
      width: '600px',
      data: {
        chat: this.chat,
        activities: this.activities,
        user: this.user,
        type: this.chatType       // не исп
      }
    });
  }

  getChatLogoUrl(): string {
    let logoUrl = NO_LOGO_URL;
    if (this.chat.logo) {
      logoUrl = this._config.serverUrl + '/data/images/' + this.chat.logo;
    } else if (this.chat.relations.length) {
      const notMe = this.chat.relations.find(value => +value.userId !== +this.user.id);
      if (notMe && notMe.companyLogo && notMe.companyLogo.length) {
        logoUrl = this._config.serverUrl + notMe.companyLogo[0].link;
      }
    }
    this.chatService.currentChatLogo = logoUrl;
    return logoUrl;
  }

  nodeElement(type, user_id): string {        // стили сообщения в зависимотси от типа и юзера
    if (+user_id === +this.user.id && (type === ChatMessageTypes.TYPE_USER ||
      type === ChatMessageTypes.TYPE_SYSTEM_CALL || type === ChatMessageTypes.TYPE_FILE ||
      type === ChatMessageTypes.TYPE_IMAGE || type === ChatMessageTypes.TYPE_SYSTEM_FIRST_MESSAGE)) {
      return 'to';
    } else if (+user_id !== +this.user.id && (type === ChatMessageTypes.TYPE_USER ||
      type === ChatMessageTypes.TYPE_SYSTEM_CALL || type === ChatMessageTypes.TYPE_FILE ||
      type === ChatMessageTypes.TYPE_IMAGE || type === ChatMessageTypes.TYPE_SYSTEM_FIRST_MESSAGE)) {
      return 'from';
    } else if (type === ChatMessageTypes.TYPE_SYSTEM_DELETE_USER) {
      return 'deleted';
    } else if (type === ChatMessageTypes.TYPE_SYSTEM_ADD_USER) {
      return 'added';
    } else if (type === ChatMessageTypes.TYPE_ASSESSMENT) {
      return 'added';
    } else if (type === ChatMessageTypes.TYPE_SYSTEM_QUESTION) {
      return 'added';
    } else if (type === ChatMessageTypes.TYPE_SYSTEM_BAN) {
      return 'added';
    }
  }

  nodeText(e): string {
    if (e) {
      return e.replace(new RegExp('\n', 'g'), '<br />');
    }
  }

  questionClosed(closed: boolean) {
    this.showIsQuestionAnsweredDialog = false;
    if (closed) {
      this.showRateConsultantDialog = true;
      this.chatService.clientClosedQuestion(+this.chat.id);
      this.chatService.send(+this.chat.id, '', ChatMessageTypes.TYPE_SYSTEM_QUESTION);
    }
  }

  rateConsultant(rate: number) {
    this.chatService.rateConsultant(+this.chat.id, rate);
    this.chatService.send(+this.chat.id, '', ChatMessageTypes.TYPE_ASSESSMENT, JSON.stringify({rate: rate}));
    this.showRateConsultantDialog = false;
    this.showNextQuestionDialog = true;
  }

  activityName(keyName) {
    if (keyName) {
      let keyActivity = keyName.replace(/s\s*$/, '');
      if (keyActivity === 'warehousesRent') {
        keyActivity = 'warehouseRent';
      }
      if (keyName && this.activities) {
        const activity = this.activities.find(value => value.keyName === keyActivity);
        if (activity) {
          return activity ? activity['name' + this._config.locale] : '';
        }
      }
    }
  }

  readMsg(msg) {        // галочки прочитано?
    return !!(msg && msg['readby']) ? 'done_all' : 'done';
  }

  hasAdmin(relations: Relations[]) {       // проверка на владельца чата (для крестиков в чатИнфо и добавления в груп чат)
    if (relations) {
      const hasAccess = relations.find(value => +value.userId === +this.user.id);
      if (hasAccess) {
        return !!hasAccess.owner;
      }
    }
  }

  scrollToBottom(): void {
    try {
      if (this.ListCollection) {
        this.ListCollection.nativeElement.scrollTop = this.ListCollection.nativeElement.scrollHeight;
        this.ref.detectChanges();
      }
    } catch (e) {
    }
  }

  time(date): string {        // дата на сообщении
    return moment(date).locale('ru').format('HH:mm');
  }

  sendByBtn(e): boolean {         // отправка по клику кнопки
    const text = this.textareaValue ? this.textareaValue : '';
    const nodeText = this.nodeText(text) ? this.nodeText(text) : '';
    const trimText = nodeText.trim() ? nodeText.trim() : '';

    if (!trimText) {
      return false;
    }
    this.chatService.send(this.chat.id, this.textareaValue, ChatMessageTypes.TYPE_USER, JSON.stringify({chat: this.chat}));
    this.showNextQuestionDialog = false;
    this.textareaValue = '';
    this.TextArea.nativeElement.focus();
    e.preventDefault();
    return true;
  }

  onScroll(e): void {
    if (e.target.scrollTop < 150 && this.stuck === 0) {
      this.loaded['loading'] = true;
      this.stuck = 1;
      this.getHistory();
    }
  }

  getHistory(): void {
    if (this.page * this.chatService.messagesLimit <= this.totalItems + 1) {
      if (this.chat) {
        this.page++;
        this.loaded['loading'] = true;
        this.chatService.getHistory(this.chat.id, this.page)
          .pipe(takeUntil(this._unsubscribe$))
          .subscribe((messages: Message[]) => {
            const ListCollectionTo = this.ListCollection.nativeElement.clientHeight;
            let historyMessages = [];
            if (messages.length) {
              historyMessages = messages.reverse();
            }
            this.messages.unshift(...historyMessages);
            this.loaded['loading'] = false;
            this.stuck = 0;
            setTimeout(() =>
              this.ListCollection.nativeElement.scrollTop = ListCollectionTo);
            this.ref.detectChanges();
          }, () => {
            this.stuck = 0;
            this.page--;
            this.loaded['loading'] = false;
          });
      }
    } else {
      this.loaded['loading'] = false;
    }
  }

  declOfNum(n, titles) {
    return titles[(n % 10 === 1 && n % 100 !== 11) ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2];
  }

  summary(n) {
    const c = [
      this.translate.instant('chat.companies1'),
      this.translate.instant('chat.companies2'),
      this.translate.instant('chat.companies3')
    ];
    return n + ' ' + this.declOfNum(n, c);
  }

  filter(section) {       // для системного чата переключалка по типу чата
    if (this.companyId) {
      if (this.chat) {
        this.chatService.clientClosedWindow(this.chat.id);
        this.chatService.send(this.chat.id, '', ChatMessageTypes.TYPE_CLOSE_WINDOW);
      }
      if (isPlatformBrowser(this.platformId)) {
        setToLocalStorage('chat', {section: section, owner: +this.owner});
      }
      this.chatService.setChatType(section);
      this.chatService.destroyWindow();
      this.chatService.setMobileDependency(1);
    }
  }

  back() {            // кнопка назад в мобильных - возвращает в контакты
    this.chatService.setMobileDependency(1);
    this.chatService.destroyWindow();
  }

  toggleSwitch(owner: number) {        // переключатель на баера, сэйлсМенеджера в чате тип 1
    if (owner === 2) {
      if (this._actChooseDialogSub && !this._actChooseDialogSub.closed) {
        this._actChooseDialogSub.unsubscribe();
      }

      this._actChooseDialogSub = this._matDialog.open(ActivityCountrySelectDialogComponent)
        .afterClosed()
        .subscribe((value: {
          selectedActivity: SelectedActivity,
          actNameId: number
          // countryId: this.chosenCountry.id
        }) => {
          if (value) {
            if (this.owner !== owner) {
              this.sendChangeModeMessage(owner);
            }
            this.chatService.selectActivity(value.selectedActivity);
            this.actNameId = value.actNameId;
            this.createSysChat();
          }
        });
    } else if (owner === 1) {
      if (this.owner !== owner) {
        this.sendChangeModeMessage(owner);
        this.actNameId = 0;
        this.createSysChat();
      }
    }
  }

  sendChangeModeMessage(owner: number): void {
    this.chatService.send(this.chat.id, '', ChatMessageTypes.TYPE_CLIENT_CHANGE_MODE);
    this.owner = owner;
    this.chatService.changeOwner(owner);
  }

  createSysChat(): void {
    if (this._createSysChatSub && !this._createSysChatSub.closed) {
      this._createSysChatSub.unsubscribe();
    }

    const params: any = {
      userId: +this.user.id,
      companyId: +this.companyId,
      actNameId: this.actNameId,
      isCustomer: this.owner === 2 ? 0 : 1
    };

    this._createSysChatSub = this.chatService.createSystemChat(params)
      .pipe(
        map((res) => {
          if (res && res.id) {
            if (!this.chatService.banned.value) {
              this.chatService.openChat(res.id);
            }
          }
        }),
        catchError(() => {
          if (!this.chatService.banned.value) {
            this.chatService.openChat(0);
          }
          return this.interval$
            .pipe(
              map(() => {
                if (!this.chatService.banned.value && this.chatType === 1) {
                  this.createSysChat();
                }
              })
            );
        })
      )
      .subscribe();
  }

  onFileEmit(fileItem) {
    const formData = new FormData();
    formData.append('file', fileItem._file);
    if (this.allowedImageType.indexOf(fileItem._file.type) !== -1) {
      this._uploadService.uploadImage(formData)
        .subscribe((res: any) => {
          const data = res.links[0];
          data['chat'] = this.chat;
          this.chatService.send(this.chat.id, res.links[0].name, ChatMessageTypes.TYPE_IMAGE, JSON.stringify(data));
          this.showNextQuestionDialog = false;
          this._matSnackBar.open(this.translate.instant('chat.fileSuccessfullyAdded'), 'ok', {
            duration: 3000,
          });
        }, (err) => {
          this._matSnackBar.open(err.detail, 'ok', {
            duration: 3000,
          });
        });
    } else if (this.allowedDocType.indexOf(fileItem._file.type) !== -1 || fileItem._file.type === '') { // '' - для docx
      this._uploadService.uploadDocument(formData)
        .pipe(takeUntil(this._unsubscribe$))
        .subscribe((res: any) => {
          const data = res.links[0];
          data['chat'] = this.chat;
          this.chatService.send(this.chat.id, res.links[0].name, ChatMessageTypes.TYPE_FILE, JSON.stringify(data));
          this.showNextQuestionDialog = false;
          this._matSnackBar.open(this.translate.instant('chat.fileSuccessfullyAdded'), 'ok', {
            duration: 3000,
          });
        }, (err) => {
          this._matSnackBar.open(err.detail, 'ok', {
            duration: 3000,
          });
        });
    } else {
      this._matSnackBar.open(this.translate.instant('chat.formatNotSupported'), 'ok', {
        duration: 3000,
      });
    }
  }

  /**
   * messages' types that should not be shown on client
   */
  isBlacklisted(message: Message): boolean {
    return this.isCloseQuestion(message) || this.isOpenWindow(message) || this.isCloseWindow(message) || this.isChangeMode(message) ||
      this.isClientConnected(message) || this.isClientDisconnected(message);
  }

  isText(message: Message) {
    return message.type === ChatMessageTypes.TYPE_USER;
  }

  isImage(message: Message) {
    return message.type === ChatMessageTypes.TYPE_IMAGE;
  }

  isFile(message: Message) {
    return message.type === ChatMessageTypes.TYPE_FILE;
  }

  isDeleteUser(message: Message) {
    return message.type === ChatMessageTypes.TYPE_SYSTEM_DELETE_USER;
  }

  isAddUser(message: Message) {
    return message.type === ChatMessageTypes.TYPE_SYSTEM_ADD_USER;
  }

  isConsultantGreeting(message: Message) {
    return message.type === ChatMessageTypes.TYPE_SYSTEM_FIRST_MESSAGE;
  }

  isConsRate(message: Message) {
    return message.type === ChatMessageTypes.TYPE_ASSESSMENT;
  }

  isCloseQuestion(message: Message) {
    return message.type === ChatMessageTypes.TYPE_SYSTEM_QUESTION;
  }

  isOpenWindow(message: Message) {
    return message.type === ChatMessageTypes.TYPE_OPEN_WINDOW;
  }

  isCloseWindow(message: Message) {
    return message.type === ChatMessageTypes.TYPE_CLOSE_WINDOW;
  }

  isChangeMode(message: Message) {
    return message.type === ChatMessageTypes.TYPE_CLIENT_CHANGE_MODE;
  }

  isClientConnected(message: Message) {
    return message.type === ChatMessageTypes.TYPE_CLIENT_CONNECTED;
  }

  isClientDisconnected(message: Message) {
    return message.type === ChatMessageTypes.TYPE_CLIENT_DISCONNECTED;
  }

  isBan(message: Message) {
    return message.type === ChatMessageTypes.TYPE_SYSTEM_BAN;
  }
}
