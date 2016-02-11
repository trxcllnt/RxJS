import * as Rx from '../dist/cjs/Rx';
const Subject = Rx.Subject;
const Observable = Rx.Observable;

describe('backwards-compatible', () => {
  describe('Subscriber', () => {
    it('should alias next as onNext', (done: MochaDone) => {
      Observable.create((subscriber) => {
        subscriber.onNext('compatible');
      })
      .subscribe((message) => {
        if (message !== 'compatible') {
          done(new Error('Something went wrong.'));
        } else {
          done();
        }
      });
    });

    it('should alias error as onError', (done: MochaDone) => {
      Observable.create((subscriber) => {
        subscriber.onError('compatible');
      })
      .subscribe(null, (message) => {
        if (message !== 'compatible') {
          done(new Error('Something went wrong.'));
        } else {
          done();
        }
      });
    });

    it('should alias complete as onCompleted', (done: MochaDone) => {
      Observable.create((subscriber) => {
        subscriber.onCompleted();
      })
      .subscribe(null, null, () => {
        done();
      });
    });

    it('should be backwards-compatible with Rx4-style Object Observers', (done: MochaDone) => {
      let onNextCalled = false;
      let onErrorCalled = false;
      let onCompletedCalled = false;

      const success = Observable.create((subscriber) => {
        subscriber.next('compatible');
        subscriber.complete();
      });

      const failure = Observable.create((subscriber) => {
        subscriber.error('compatible');
      });

      success.subscribe({
        onNext(x) { onNextCalled = (x === 'compatible'); },
        onCompleted() { onCompletedCalled = true; }
      });

      failure.subscribe({
        onError(e) { onErrorCalled = (e === 'compatible'); }
      });

      if (onNextCalled && onErrorCalled && onCompletedCalled) {
        done();
      } else {
        done(new Error('Something went wrong.'));
      }
    });

    it('should alias unsubscribe as dispose', (done: MochaDone) => {
      let disposeCalled = false;
      const disposable = Observable.create((subscriber) => {
        return () => {
          disposeCalled = true;
        };
      })
      .subscribe({
        next: done.bind(null, new Error('Should not be called.')),
        error: done.bind(null, new Error('Should not be called.')),
        completed: done.bind(null, new Error('Should not be called.'))
      });

      disposable.dispose();

      if (disposeCalled) {
        done();
      } else {
        done(new Error('Something went wrong.'));
      }
    });
  });

  describe('Subject', () => {
    it('should alias next as onNext', (done: MochaDone) => {
      const subject = new Subject();
      subject.subscribe((message) => {
        if (message !== 'compatible') {
          done(new Error('Something went wrong.'));
        } else {
          done();
        }
      });
      subject.onNext('compatible');
    });

    it('should alias error as onError', (done: MochaDone) => {
      const subject = new Subject();
      subject.subscribe(null, (message) => {
        if (message !== 'compatible') {
          done(new Error('Something went wrong.'));
        } else {
          done();
        }
      });
      subject.onError('compatible');
    });

    it('should alias complete as onCompleted', (done: MochaDone) => {
      const subject = new Subject();
      subject.subscribe(null, null, () => {
        done();
      });
      subject.onCompleted();
    });

    it('should be backwards-compatible with Rx4-style Object Observers', (done: MochaDone) => {
      let onNextCalled = false;
      let onErrorCalled = false;
      let onCompletedCalled = false;

      const success = new Subject();
      const failure = new Subject();

      success.subscribe({
        onNext(x) { onNextCalled = (x === 'compatible'); },
        onCompleted() { onCompletedCalled = true; }
      });

      failure.subscribe({
        onError(e) { onErrorCalled = (e === 'compatible'); }
      });

      success.next('compatible');
      success.complete();

      failure.error('compatible');

      if (onNextCalled && onErrorCalled && onCompletedCalled) {
        done();
      } else {
        done(new Error('Something went wrong.'));
      }
    });

    it('should alias unsubscribe as dispose', (done: MochaDone) => {
      let disposeCalled = false;
      let subjectDisposeCalled = false;
      const subject = new Subject();

      const disposable = subject.subscribe({
        next: done.bind(null, new Error('Should not be called.')),
        error: done.bind(null, new Error('Should not be called.')),
        completed: done.bind(null, new Error('Should not be called.'))
      });

      disposable.add(() => {
        disposeCalled = true;
      });

      subject.dispose();
      disposable.dispose();
      subjectDisposeCalled = subject.isUnsubscribed;

      if (disposeCalled && subjectDisposeCalled) {
        done();
      } else {
        done(new Error('Something went wrong.'));
      }
    });
  });
});
