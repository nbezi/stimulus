'use strict';

class Stimulus {

  constructor() {
    this.triggers = {};
    this.fireReaction = {};
    this.incrementValue = 0;
  }

  addTrigger(triggerName, reloadFunction) {
    if (this.triggers[triggerName]) {
      console.warn('Stimulus: trigger exists, replacing loader for ' + triggerName);
      this.triggers[triggerName].reloadFunction = reloadFunction;
    } else {
      this.triggers[triggerName] = new Trigger(this, triggerName, reloadFunction);
    }
    return this;
  }

  getTrigger(triggerName) {
    return this.triggers[triggerName];
  }

  getTriggerData(triggerName) {
    return this.getTrigger(triggerName).data;
  }

  listenTo(component, triggerName) {
    this.follow(component, triggerName);
    var trigger = this.triggers[triggerName];
    if (trigger.data) {
      component.dataReceiver(trigger);
    }
    return this;
  }

  follow(component, triggerName) {
    var trigger = this.triggers[triggerName];
    if (!trigger) {
      console.warn('Stimulus: registering missing trigger ' + triggerName);
      this.addTrigger(triggerName, (trigger) => trigger.notifyListeners(trigger.data));
      trigger = this.triggers[triggerName];
    }
    trigger.listeners.push(component);
    return this;
  }

  fire(triggerName, args) {
    var trigger = this.triggers[triggerName];
    if (!trigger) {
      console.warn('Stimulus: cannot fire missing trigger ' + triggerName);
      return;
    }
    trigger.fire(args);
    return this;
  }

  propagate(triggerName, data, args) {
    var trigger = this.triggers[triggerName];
    if (!trigger) {
      console.warn('Stimulus: registering missing trigger ' + triggerName);
      this.addTrigger(triggerName, (trigger) => trigger.notifyListeners(trigger.data));
      trigger = this.triggers[triggerName];
    }
    trigger.propagateData(data, args);
    return this;
  }

  fireAfter(when, fire) {
    if (!this.fireReaction[when])
      this.fireReaction[when] = [];
    if (typeof fire == 'string')
      this.fireReaction[when].push(fire);
    if (typeof fire == 'array')
      this.fireReaction[when] = this.fireReaction[when].concat(fire);
    return this;
  }

  triggerFinished(trigger) {
    var reactions = this.fireReaction[trigger.name];
    if (reactions) {
      var stack = trigger.stack.slice();
      stack.push(trigger.name);
      reactions.forEach((reaction) => {
        console.info('Stimulus: reaction burning ' + reaction + ' ignited by ' + trigger.name);
        reaction = this.triggers[reaction];
        if (stack.indexOf(reaction.name) != -1) {
          console.warn('Stimulus: reaction loop detected trying to call ' + reaction.name + ' present in stack ' + JSON.stringify(stack));
          return;
        }
        var args = trigger.args;
        args[trigger.name] = trigger.data;
        reaction.fire(args, stack);
      });
    }
  }

  stopListening(component) {
    Object.keys(this.triggers).forEach((triggerName) => {
      var trigger = this.triggers[triggerName];
      trigger.listeners.find((listener, idx) => {
        if (listener._stimulusId == component._stimulusId) {
          trigger.listeners.splice(idx, 1);
          return true;
        }
      })
    });
  }

  getNextId() {
    return this.incrementValue++;
  }

  toString() {
    return Object.keys(this.triggers).map((name) => this.triggers[name].toString()).join("\n");
  }
}

class Trigger {

  constructor(manager, name, reloadFunction) {
    this.manager = manager;
    this.name = name;
    this.reloadFunction = reloadFunction;
    this.listeners = [];
    this.data = null;
    this.args = {};
    this.running = false;
    this.stack = [];
  }

  fire(args, stack) {
    console.info('Stimulus: trigger fired ' + this.name);
    if (this.running) {
      console.warn('Stimulus: trigger ' + this.name + ' already running, possible collision');
      return;
    }
    this.running = true;
    this.args = args || {};
    this.stack = stack || [];
    this.reloadFunction(this);
  }

  notifyListeners(data) {
    this.data = data;
    this.listeners.forEach((listener) => {
      if (listener.shouldReceiveData(this)) {
        try {
          listener.dataReceiver(this);
        } catch(err) {
          console.error(err);
        }
      }
    });
    this.manager.triggerFinished(this);
    this.running = false;
  }

  propagateData(data, args) {
    console.info('Stimulus: propagating ' + this.name);
    this.args = args || {};
    this.running = true;
    this.notifyListeners(data);
  }

  toString() {
    return JSON.stringify({name: this.name, data: this.data, running: this.running, arguments: this.args});
  }
}

class StimulusListener {

  constructor() {
    this._stimulus = stimulus;
    this._stimulusId = stimulus.getNextId();
  }

  listenTo(triggerName, defaultValue) {
    if (defaultValue) this[triggerName] = defaultValue;
    this._stimulus.listenTo(this, triggerName);
  }

  follow(triggerName, defaultValue) {
    if (defaultValue) this[triggerName] = defaultValue;
    this._stimulus.follow(this, triggerName);
  }

  fire(triggerName, args) {
    this._stimulus.fire(triggerName, args);
  }

  propagate(triggerName, data, args) {
    this._stimulus.propagate(triggerName, data, args);
  }

  dataReceiver(trigger) {
    this[trigger.name] = trigger.data;
  }

  shouldReceiveData(trigger) {
    return true;
  }
}

class StimulusComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {};
    this._stimulus = stimulus;
    this._stimulusId = stimulus.getNextId();
  }

  componentWillUnmount() {
    this._stimulus.stopListening(this);
  }

  fire(triggerName, args) {
    this._stimulus.fire(triggerName, args);
  }

  propagate(triggerName, data, args) {
    this._stimulus.propagate(triggerName, data, args);
  }

  listenTo(triggerName, defaultValue) {
    if (defaultValue) this.state[triggerName] = defaultValue;
    this._stimulus.listenTo(this, triggerName);
  }

  follow(triggerName, defaultValue) {
    if (defaultValue) this.state[triggerName] = defaultValue;
    this._stimulus.follow(this, triggerName);
  }

  dataReceiver(trigger) {
    var newState = {};
    newState[trigger.name] = trigger.data;
    this.setState(newState);
  }

  shouldReceiveData(trigger) {
    return true;
  }
}

var stimulus = new Stimulus();

module.exports.stimulus = stimulus;
module.exports.StimulusListener = StimulusListener;
module.exports.StimulusComponent = StimulusComponent;

