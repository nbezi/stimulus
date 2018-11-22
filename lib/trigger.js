
export default class Trigger {
  constructor (manager, name, reloadFunction) {
    this.manager = manager;
    this.name = name;
    this.reloadFunction = reloadFunction;
    this.listeners = [];
    this.data = null;
    this.args = {};
    this.running = false;
    this.stack = [];
  }

  fire (args, stack) {
    console.info('Stimulus: trigger fired ' + this.name);
    if (this.running) {
      console.warn('Stimulus: trigger ' + this.name + ' already running, possible collision');
      return;
    }
    this.running = true;
    this.args = typeof args === 'undefined' ? {} : args;
    this.stack = stack || [];
    this.reloadFunction(this);
  }

  notifyListeners (data) {
    this.data = data;
    this.listeners.forEach(function (listener) {
      if (listener.shouldReceiveData(this)) {
        try {
          listener.dataReceiver(this);
        } catch (err) {
          console.error(err);
        }
      }
    }.bind(this));
    this.manager.triggerFinished(this);
    this.running = false;
  }

  propagateData (data, args) {
    console.info('Stimulus: propagating ' + this.name);
    this.args = typeof args === 'undefined' ? {} : args;
    this.running = true;
    this.notifyListeners(data);
  }

  toString () {
    return JSON.stringify({ name: this.name, data: this.data, running: this.running, arguments: this.args });
  }
}
