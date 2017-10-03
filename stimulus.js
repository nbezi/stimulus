'use strict';

var Stimulus = function() {
  this.triggers = {};
  this.fireReaction = {};
  this.incrementValue = 0;
}

Stimulus.prototype.addTrigger = function(triggerName, reloadFunction) {
  if (this.triggers[triggerName]) {
    console.warn('Stimulus: trigger exists, replacing loader for ' + triggerName);
    this.triggers[triggerName].reloadFunction = reloadFunction;
  } else {
    this.triggers[triggerName] = new Trigger(this, triggerName, reloadFunction);
  }
  return this;
}

Stimulus.prototype.getTrigger = function(triggerName) {
  return this.triggers[triggerName];
}

Stimulus.prototype.getTriggerData = function(triggerName) {
  return this.getTrigger(triggerName).data;
}

Stimulus.prototype.listenTo = function(component, triggerName) {
  this.follow(component, triggerName);
  var trigger = this.triggers[triggerName];
  if (trigger.data) {
    component.dataReceiver(trigger);
  }
  return this;
}

Stimulus.prototype.follow = function(component, triggerName) {
  var trigger = this.triggers[triggerName];
  if (!trigger) {
    console.warn('Stimulus: registering missing trigger ' + triggerName);
    this.addTrigger(triggerName, (trigger) => trigger.notifyListeners(trigger.data));
    trigger = this.triggers[triggerName];
  }
  trigger.listeners.push(component);
  return this;
}

Stimulus.prototype.fire = function(triggerName, args) {
  var trigger = this.triggers[triggerName];
  if (!trigger) {
    console.warn('Stimulus: cannot fire missing trigger ' + triggerName);
    return;
  }
  trigger.fire(args);
  return this;
}

Stimulus.prototype.propagate = function(triggerName, data, args) {
  var trigger = this.triggers[triggerName];
  if (!trigger) {
    console.warn('Stimulus: registering missing trigger ' + triggerName);
    this.addTrigger(triggerName, (trigger) => trigger.notifyListeners(trigger.data));
    trigger = this.triggers[triggerName];
  }
  trigger.propagateData(data, args);
  return this;
}

Stimulus.prototype.fireAfter = function(when, fire) {
  if (!this.fireReaction[when])
    this.fireReaction[when] = [];
  if (typeof fire == 'string')
    this.fireReaction[when].push(fire);
  if (typeof fire == 'array')
    this.fireReaction[when] = this.fireReaction[when].concat(fire);
  return this;
}

Stimulus.prototype.triggerFinished = function(trigger) {
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

Stimulus.prototype.stopListening = function(component) {
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

Stimulus.prototype.getNextId = function() {
  return this.incrementValue++;
}

Stimulus.prototype.toString = function() {
  return Object.keys(this.triggers).map((name) => this.triggers[name].toString()).join("\n");
}


var Trigger = function(manager, name, reloadFunction) {
  this.manager = manager;
  this.name = name;
  this.reloadFunction = reloadFunction;
  this.listeners = [];
  this.data = null;
  this.args = {};
  this.running = false;
  this.stack = [];
}

Trigger.prototype.fire = function(args, stack) {
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

Trigger.prototype.notifyListeners = function(data) {
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

Trigger.prototype.propagateData = function(data, args) {
  console.info('Stimulus: propagating ' + this.name);
  this.args = args || {};
  this.running = true;
  this.notifyListeners(data);
}

Trigger.prototype.toString = function() {
  return JSON.stringify({name: this.name, data: this.data, running: this.running, arguments: this.args});
}


var StimulusListener = function() {
  this._stimulus = stimulus;
  this._stimulusId = stimulus.getNextId();
}

StimulusListener.prototype.listenTo = function(triggerName, defaultValue) {
  if (defaultValue) this[triggerName] = defaultValue;
  this._stimulus.listenTo(this, triggerName);
}

StimulusListener.prototype.follow = function(triggerName, defaultValue) {
  if (defaultValue) this[triggerName] = defaultValue;
  this._stimulus.follow(this, triggerName);
}

StimulusListener.prototype.fire = function(triggerName, args) {
  this._stimulus.fire(triggerName, args);
}

StimulusListener.prototype.propagate = function(triggerName, data, args) {
  this._stimulus.propagate(triggerName, data, args);
}

StimulusListener.prototype.dataReceiver = function(trigger) {
  this[trigger.name] = trigger.data;
}

StimulusListener.prototype.shouldReceiveData = function(trigger) {
  return true;
}


var StimulusComponent = function(props, context, updater) {
  this.super(props, context, updater);
  this.state = {};
  this._stimulus = stimulus;
  this._stimulusId = stimulus.getNextId();
}

var parent = new React.Component();
StimulusComponent.prototype = parent;
StimulusComponent.prototype.super = parent.constructor;
StimulusComponent.prototype.constructor = StimulusComponent;

StimulusComponent.prototype.componentWillUnmount = function() {
    this._stimulus.stopListening(this);
  }

StimulusComponent.prototype.fire = function(triggerName, args) {
  this._stimulus.fire(triggerName, args);
}

StimulusComponent.prototype.propagate = function(triggerName, data, args) {
  this._stimulus.propagate(triggerName, data, args);
}

StimulusComponent.prototype.listenTo = function(triggerName, defaultValue) {
  if (defaultValue) this.state[triggerName] = defaultValue;
  this._stimulus.listenTo(this, triggerName);
}

StimulusComponent.prototype.follow = function(triggerName, defaultValue) {
  if (defaultValue) this.state[triggerName] = defaultValue;
  this._stimulus.follow(this, triggerName);
}

StimulusComponent.prototype.dataReceiver = function(trigger) {
  var newState = {};
  newState[trigger.name] = trigger.data;
  this.setState(newState);
}

StimulusComponent.prototype.shouldReceiveData = function(trigger) {
  return true;
}

var stimulus = new Stimulus();

module.exports.sensor = stimulus;
module.exports.Listener = StimulusListener;
module.exports.Component = StimulusComponent;
