export interface Observer<T> {
  isUnsubscribed?: boolean;
  next: (value: T) => void;
  error: (err: any) => void;
  complete: () => void;
}

export interface NextObserver<T> {
  isUnsubscribed?: boolean;
  next: (value: T) => void;
  error?: (err: any) => void;
  complete?: () => void;
  onNext?: (value: T) => void;
  onError?: (err: any) => void;
  onCompleted?: () => void;
}

export interface ErrorObserver<T> {
  isUnsubscribed?: boolean;
  next?: (value: T) => void;
  error: (err: any) => void;
  complete?: () => void;
  onNext?: (value: T) => void;
  onError?: (err: any) => void;
  onCompleted?: () => void;
}

export interface CompletionObserver<T> {
  isUnsubscribed?: boolean;
  next?: (value: T) => void;
  error?: (err: any) => void;
  complete: () => void;

  onNext?: (value: T) => void;
  onError?: (err: any) => void;
  onCompleted?: () => void;
}

export interface LegacyNextObserver<T> {
  isUnsubscribed?: boolean;
  next?: (value: T) => void;
  error?: (err: any) => void;
  complete?: () => void;
  onNext: (value: T) => void;
  onError?: (err: any) => void;
  onCompleted?: () => void;
}

export interface LegacyErrorObserver<T> {
  isUnsubscribed?: boolean;
  next?: (value: T) => void;
  error?: (err: any) => void;
  complete?: () => void;
  onNext?: (value: T) => void;
  onError: (err: any) => void;
  onCompleted?: () => void;
}

export interface LegacyCompletionObserver<T> {
  isUnsubscribed?: boolean;
  next?: (value: T) => void;
  error?: (err: any) => void;
  complete?: () => void;
  onNext?: (value: T) => void;
  onError?: (err: any) => void;
  onCompleted: () => void;
}

export type PartialObserver<T> = Observer<T> |
                                 NextObserver<T> |
                                 ErrorObserver<T> |
                                 CompletionObserver<T> |
                                 LegacyNextObserver<T> |
                                 LegacyErrorObserver<T> |
                                 LegacyCompletionObserver<T>;

export const empty: Observer<any> = {
  isUnsubscribed: true,
  next(value: any): void { /* noop */},
  error(err: any): void { throw err; },
  complete(): void { /*noop*/ }
};
