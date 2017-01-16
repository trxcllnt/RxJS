import { Observable } from '../Observable';
import { Subscriber } from '../Subscriber';
import { Subscription } from '../Subscription';
import { toSubscriber } from '../util/toSubscriber';

/**
 * This function returns the current `Zone` if `Zone` is loaded or `null` if `Zone` is not loaded.
 *
 * It is expected that the VM will inline the `() => null` case when no `Zone` is present resulting
 * in no performance impact.
 */
function getZone() {
  return typeof Zone !== 'undefined' && Zone.current ? Zone.current : null;
}

/*
 * Patch Observable to support Zones
 */

declare module '../Observable' {
  /**
   * Note about `zone.js`: When `zone.js` is loaded the `Observable` will capture the `Zone` on
   * construction and then ensure that the `subscribe` function as well as the `TeardowLogic`
   * execute in the `Zone` which was current an the time of the constructor call.
   */
  interface Observable<T> {
    /**
     * The `Zone` which was captured at the time `Observable` got created.
     * This is the `Zone` which will be used when invoking the `Observable` callbacks.
     */
    _zone: any;
    /*
     * Note about `zone.js`: When `zone.js` is loaded the all operator callback function will execute
     * in the `Zone` which was current when the operator was registered using `lift` method.
     */
    _zoneSource: any;
    /*
     * Note about `zone.js`: When `zone.js` is loaded the `Observable` will capture the `Zone` on
     * invocation to `subscribe` and then ensure that the `next`, `error` and `complete` callbacks
     * execute in the `Zone` which was current at the time of `subscribe` invocation.
     */
    _zoneSubscribe: any;
    _rxObservableSubscribe: any;
    _rxObservable_Subscribe: any;
  }
}

Object.defineProperties(Observable.prototype, {
  _zone: { value: null, writable: true, configurable: true },
  _zoneSource: { value: null, writable: true, configurable: true },
  _zoneSubscribe: { value: null, writable: true, configurable: true },
  source: {
    configurable: true,
    get: function(this: Observable<any>) { return this._zoneSource; },
    set: function(this: Observable<any>, source: any) {
      this._zone = getZone();
      this._zoneSource = source;
    }
  },
  _subscribe: {
    configurable: true,
    get: function(this: Observable<any>) {
      if (this._zoneSubscribe) {
        return this._zoneSubscribe;
      } else if (this.constructor === Observable) {
        return this._rxObservable_Subscribe;
      }
      return (<any> this).__proto__._subscribe;
    },
    set: function(this: Observable<any>, subscribe: any) {
      this._zone = getZone();
      this._zoneSubscribe = subscribe;
    }
  },
  _rxObservableSubscribe: { value: Observable.prototype.subscribe },
  _rxObservable_Subscribe: { value: (<any> Observable.prototype)._subscribe },
  subscribe: {
    writable: true, configurable: true,
    value: function(this: Observable<any>, observerOrNext: any, error: any, complete: any) {
      // Only grab a zone if we Zone exists and it is different from the current zone.
      if (this._zone && this._zone !== getZone()) {
        // Current Zone is different from the intended zone.
        // Restore the zone before invoking the subscribe callback.
        return this._zone.run((<any> this)._rxObservableSubscribe, this, [toSubscriber(observerOrNext, error, complete)]);
      }
      return (<any> this)._rxObservableSubscribe.call(this, observerOrNext, error, complete);
    }
  }
});

/*
 * Patch Subscription to support Zones
 */

declare module '../Subscription' {
  interface Subscription {
    /**
     * The `Zone` which was captured at the time `subscribe` was invoked.
     * This is the `Zone` which will be used when invoking the `next`, `error', 'complete' callbacks.
     */
    _zone: any;
    _zoneUnsubscribe: any;
    _rxSubscriptionUnsubscribe: any;
  }
}

Object.defineProperties(Subscription.prototype, {
  _zone: { value: null, writable: true, configurable: true },
  _zoneUnsubscribe: { value: null, writable: true, configurable: true },
  _unsubscribe: {
    get: function(this: Subscription) {
      return this._zoneUnsubscribe || (<any> this).__proto__._unsubscribe;
    },
    set: function(this: Subscription, unsubscribe: any) {
      this._zone = getZone();
      this._zoneUnsubscribe = unsubscribe;
    }
  },
  _rxSubscriptionUnsubscribe: { value: Subscription.prototype.unsubscribe },
  unsubscribe: {
    writable: true, configurable: true,
    value: function(this: Subscription) {
      // Only grab a zone if we Zone exists and it is different from the current zone.
      if (this._zone && this._zone !== getZone()) {
        // Current Zone is different from the intended zone.
        // Restore the zone before invoking the subscribe callback.
        this._zone.run(this._rxSubscriptionUnsubscribe, this);
      } else {
        this._rxSubscriptionUnsubscribe();
      }
    }
  }
});

/*
 * Patch Subscriber to support Zones
 */

declare module '../Subscriber' {
  interface Subscriber<T> {
    _zoneDestination: any;
    _rxSubscriberNext: any;
    _rxSubscriberError: any;
    _rxSubscriberComplete: any;
  }
}

Object.defineProperties(Subscriber.prototype, {
  _zone: { value: null, writable: true, configurable: true },
  _zoneDestination: { value: null, writable: true, configurable: true },
  destination: {
    configurable: true,
    get: function(this: Subscriber<any>) { return this._zoneDestination; },
    set: function(this: Subscriber<any>, destination: any) {
      this._zone = getZone();
      this._zoneDestination = destination;
    }
  },
  _rxSubscriberNext: { value: Subscriber.prototype.next },
  _rxSubscriberError: { value: Subscriber.prototype.error },
  _rxSubscriberComplete: { value: Subscriber.prototype.complete },
  next: {
    writable: true, configurable: true,
    value: function(this: Subscriber<any>, value?: any) {
      if (this._zone && this._zone != getZone()) {
        // Current Zone is different from the intended zone.
        // Restore the zone before `next`ing.
        this._zone.run(this._rxSubscriberNext, this, [value]);
      } else {
        this._rxSubscriberNext(value);
      }
    }
  },
  error: {
    writable: true, configurable: true,
    value: function(this: Subscriber<any>, error?: any) {
      if (this._zone && this._zone != getZone()) {
        // Current Zone is different from the intended zone.
        // Restore the zone before `next`ing.
        this._zone.run(this._rxSubscriberError, this, [error]);
      } else {
        this._rxSubscriberError(error);
      }
    }
  },
  complete: {
    writable: true, configurable: true,
    value: function(this: Subscriber<any>) {
      if (this._zone && this._zone != getZone()) {
        // Current Zone is different from the intended zone.
        // Restore the zone before `next`ing.
        this._zone.run(this._rxSubscriberComplete, this);
      } else {
        this._rxSubscriberComplete();
      }
    }
  }
});
