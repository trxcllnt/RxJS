import {expect} from 'chai';
import * as Rx from '../../dist/cjs/Rx';
declare const {cold, expectObservable, asDiagram, expectSubscriptions};

const Observable = Rx.Observable;
const Subject = Rx.Subject;

/** @test {autoConnect} */
describe('ConnectableObservable.prototype.autoConnect', () => {
  asDiagram('autoConnect')('should turn a multicasted Observable an automatically ' +
  'connected hot one', () => {
    const source = cold('--1-2---3-4--5-|');
    const sourceSubs =  '^              !';
    const expected =    '--1-2---3-4--5-|';

    const connectable = source.publish();
    const result = connectable.autoConnect();

    expect((<any>connectable)._connection).to.be.ok;
    expect((<any>connectable)._connection.closed).to.be.false;
    expectObservable(result).toBe(expected);
    expectSubscriptions(source.subscriptions).toBe(sourceSubs);
  });

  it('should count references', () => {
    const connectable = Observable.never().publish();
    const autoConnected = connectable.autoConnect();

    expect((<any>connectable)._connection).to.be.ok;
    expect((<any>connectable)._connection.closed).to.be.false;

    const sub1 = autoConnected.subscribe({ next: function () { //noop
      } });
    const sub2 = autoConnected.subscribe({ next: function () { //noop
      } });
    const sub3 = autoConnected.subscribe({ next: function () { //noop
      } });

    expect((<any>connectable)._refCount).to.equal(3);

    sub1.unsubscribe();
    sub2.unsubscribe();
    sub3.unsubscribe();
  });

  it('should unsub from the source when all other subscriptions are unsubbed', (done: MochaDone) => {
    let unsubscribeCalled = false;
    const connectable = new Observable((observer: Rx.Observer<boolean>) => {
      observer.next(true);
      return () => {
        unsubscribeCalled = true;
      };
    }).publish();
    const autoConnected = connectable.autoConnect();

    expect((<any>connectable)._connection).to.be.ok;
    expect((<any>connectable)._connection.closed).to.be.false;

    const sub1 = autoConnected.subscribe(() => {
      //noop
    });
    const sub2 = autoConnected.subscribe(() => {
      //noop
    });
    const sub3 = autoConnected.subscribe((x: any) => {
      expect((<any>connectable)._refCount).to.equal(1);
    });

    sub1.unsubscribe();
    sub2.unsubscribe();
    sub3.unsubscribe();

    expect((<any>connectable)._refCount).to.equal(0);
    expect((<any>connectable)._connection).to.be.null;
    expect(unsubscribeCalled).to.be.true;
    done();
  });

  it('should close the connection when each subscription unsubscribes early', (done: MochaDone) => {
    let unsubscribeCalled = false;
    const connectable = new Observable((observer: Rx.Observer<boolean>) => {
      observer.next(true);
      return () => {
        unsubscribeCalled = true;
      };
    }).multicast(() => new Subject());
    const autoConnected = connectable.autoConnect();

    expect((<any>connectable)._connection).to.be.ok;
    expect((<any>connectable)._connection.closed).to.be.false;

    let sub1 = autoConnected.subscribe(() => {
      //noop
    });

    sub1.unsubscribe();
    expect(unsubscribeCalled).to.be.true;
    expect((<any>connectable)._refCount).to.equal(0);
    expect((<any>connectable)._connection).to.be.null;

    unsubscribeCalled = false;
    let sub2 = autoConnected.subscribe(() => {
      //noop
    });

    expect((<any>connectable)._connection).to.be.ok;
    expect((<any>connectable)._connection.closed).to.be.false;

    sub2.unsubscribe();
    expect(unsubscribeCalled).to.be.true;
    expect((<any>connectable)._refCount).to.equal(0);
    expect((<any>connectable)._connection).to.be.null;

    done();
  });

  it('should not unsubscribe when a subscriber synchronously unsubscribes if ' +
  'other subscribers are present', () => {
    let unsubscribeCalled = false;
    const connectable = new Observable((observer: Rx.Observer<boolean>) => {
      observer.next(true);
      return () => {
        unsubscribeCalled = true;
      };
    }).publishReplay(1);

    const autoConnected = connectable.autoConnect();

    expect((<any>connectable)._connection).to.be.ok;
    expect((<any>connectable)._connection.closed).to.be.false;

    autoConnected.subscribe();
    autoConnected.subscribe().unsubscribe();

    expect((<any>connectable)._refCount).to.equal(1);
    expect((<any>connectable)._connection).to.be.ok;
    expect(unsubscribeCalled).to.be.false;
  });

  it('should not unsubscribe when a subscriber synchronously unsubscribes if ' +
  'other subscribers are present and the source is a Subject', () => {

    const arr = [];
    const subject = new Rx.Subject();
    const connectable = subject.publishReplay(1);
    const autoConnected = connectable.autoConnect();

    expect((<any>connectable)._connection).to.be.ok;
    expect((<any>connectable)._connection.closed).to.be.false;

    autoConnected.subscribe((val) => {
      arr.push(val);
    });

    subject.next('the number one');

    autoConnected.first().subscribe().unsubscribe();

    subject.next('the number two');

    expect((<any>connectable)._refCount).to.equal(1);
    expect((<any>connectable)._connection).to.be.ok;
    expect((<any>connectable)._connection.closed).to.be.false;
    expect(arr[0]).to.equal('the number one');
    expect(arr[1]).to.equal('the number two');
  });
});
