import { ChangeDetectorRef, NgModule, Inject, SkipSelf, OpaqueToken, ApplicationRef, NgZone } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

export const CHANGES = new OpaqueToken("changes");

export type Equal = (a: any, b: any) => boolean;

function referenceEquality(a: any, b: any): boolean {
  return a === b;
}

export function selector(t: any, opts: {equality: Equal} = {equality: referenceEquality}):any {
  return {
    provide: t,
    useFactory: selectorFactory(opts),
    deps: [CHANGES, ChangeDetectorRef, NgZone, [new Inject(t), new SkipSelf()]]
  };
}

function selectorFactory(opts: {equality: Equal}) {

  return (changes: Observable<any>, ref: ChangeDetectorRef, zone: NgZone, f: any) => {
    let stored: {args: any[], res: any}[] = [];
    let changeDetection = false;

    const changeSubscription = changes.subscribe(() => {
      for (let i = 0; i < stored.length; ++i) {
        const {args, res} = stored[i];
        if (!opts.equality(f(...args), res)) {
          markForCheck(ref);
          break;
        }
      }
    });

    const microtaskSubscription = zone.onMicrotaskEmpty.subscribe(() => {
      changeDetection = true;
    });

    setUpDisposables(ref, changeSubscription, microtaskSubscription);

    return (...args:any[]) => {
      const res = f(...args);

      if (changeDetection) {
        stored = [];
        changeDetection = false;
      }

      stored.push({args, res});
      return res;
    };
  };
}

function setUpDisposables(ref: any, changeSubscription: Subscription, cdSubscription: Subscription): void {
  if (!ref.internalView.disposables) {
    ref.internalView.disposables = [];
  }
  ref.onDestroy(() => {
    changeSubscription.unsubscribe();
    cdSubscription.unsubscribe();
  });
}

function markForCheck(ref: any): void {
  ref.internalView.viewChildren[0].changeDetectorRef.markForCheck();
}