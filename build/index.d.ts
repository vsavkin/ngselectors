import { OpaqueToken } from '@angular/core';
export declare const CHANGES: OpaqueToken;
export declare type Equal = (a: any, b: any) => boolean;
export declare function selector(t: any, opts?: {
    equality: Equal;
}): any;
