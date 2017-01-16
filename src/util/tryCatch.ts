import { errorObject } from './errorObject';

let tryCatchTarget: Function;

function tryCatcher(this: any): any {
  try {
    return tryCatchTarget.apply(this, arguments);
  } catch (e) {
    errorObject.e = e;
    return errorObject;
  } finally {
    // Cleanup to prevent unnecessarily holding onto memory.
    tryCatchTarget = null;
  }
}

// export function tryCatch<T extends Function>(fn: T): T {
export function tryCatch<T extends Function>(fn: T): T {
  tryCatchTarget = fn;
  return <any>tryCatcher;
};
