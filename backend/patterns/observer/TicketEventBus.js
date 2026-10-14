// The "Subject" in the Observer pattern.
// OOP - Encapsulation: the observer list is a private field (#observers);
// outside code can only change it through subscribe()/unsubscribe().
const { TicketObserver } = require('./TicketObserver');

class TicketEventBus {
  #observers = [];

  subscribe(observer) {
    if (!(observer instanceof TicketObserver)) {
      throw new TypeError('Observer must extend TicketObserver');
    }
    this.#observers.push(observer);
  }

  unsubscribe(observer) {
    this.#observers = this.#observers.filter((o) => o !== observer);
  }

  notify(event) {
    this.#observers.forEach((observer) => observer.update(event));
  }

  get observerCount() {
    return this.#observers.length;
  }
}

module.exports = TicketEventBus;
