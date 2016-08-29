import { Component, NgModule, Inject, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CHANGES, selector } from '../src/index';
import {Subject} from 'rxjs/Subject';

export class Store {
  users:any = {1: "victor", 2: "thomas"};
  messages:any = {1: "victor's message", 2: "thomas's message"};

  notifications = new Subject<any>();

  updateUser(id: string, value: string): void {
    this.users[id] = value;
    this.notifications.next(null);
  }

  updateMessage(id: string, value: string): void {
    this.messages[id] = value;
    this.notifications.next(null);
  }
}

type GetUser = (id:string) => string;
export function getUser(store: Store) {
  return (id:string) => store.users[id];
}

type GetMessage = (id:string) => string;
export function getMessage(store: Store) {
  return (id:string) => store.messages[id];
}

const getUserAndMessage = new Object();

function shallowEqual(a:any, b:any): boolean {
  return a['user'] === b['user'] && a['message'] === b['message'];
}

@Component({
  selector: 'test',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    selector(getUser),
    selector(getMessage),
    selector(getUserAndMessage, {equality: shallowEqual})
  ]
})
class TestComponent {
  recorded: any[] = [];

  constructor(@Inject(getUser) private u:GetUser,
              @Inject(getMessage) private m:GetMessage,
              @Inject(getUserAndMessage) private um:any){}

  ngDoCheck() {
    this.recorded.push({
      user: this.u('1'),
      message: this.m('1'),
      userAndMessage: this.um('1', '1')
    });
  }
}

@Component({
  template: '<test></test>',
  changeDetection: ChangeDetectionStrategy.OnPush
})
class RootComponent {}

@NgModule({
  declarations: [TestComponent, RootComponent],
  providers: [
    Store,
    {
      provide: CHANGES,
      useFactory: (s:Store) => s.notifications,
      deps: [Store]
    },
    {
      provide: getUser,
      useFactory: getUser,
      deps: [Store]
    },
    {
      provide: getMessage,
      useFactory: getMessage,
      deps: [Store]
    },
    {
      provide: getUserAndMessage,
      useFactory: (u:GetUser, m:GetMessage) => (userId:string, messageId:string) => ({user: u(userId), message: m(messageId)}),
      deps: [getUser, getMessage]
    }
  ]
})
class TestNgModule { }

describe("Integration", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestNgModule]
    });
  });

  it("should work", () => {
    const s = TestBed.get(Store);

    const r = TestBed.createComponent(RootComponent);
    const c = r.debugElement.children[0].componentInstance;
    r.detectChanges();

    expect(c.recorded[0]).toEqual({
      user: "victor",
      message: "victor's message",
      userAndMessage: {user: "victor", message: "victor's message"}
    });

    s.updateUser('1', 'VICTOR');
    s.updateMessage('1', "victor's new message");
    r.detectChanges();

    expect(c.recorded[1]).toEqual({
      user: "VICTOR",
      message: "victor's new message",
      userAndMessage: {user: "VICTOR", message: "victor's new message"}
    });
  });

  it("should not rerun change detection when not needed", () => {
    const s = TestBed.get(Store);

    const r = TestBed.createComponent(RootComponent);
    const c = r.debugElement.children[0].componentInstance;
    r.detectChanges();

    s.updateUser('2', 'THOMAS');
    s.updateMessage('2', "thomas's new message");
    r.detectChanges();

    expect(c.recorded.length).toEqual(1);
  });
});