(function defineFXController() {

function FXController(name, template, viewInterface, watching) {
  this.name = name;
  this.template = template;
  this.viewInterface = viewInterface;
  this.watching = watching;
}

fofx.Controller = FXController;

fofx.controller = function(controllerName, viewInterface, watching) {
  if(fofx.isObject(controllerName)) {
    viewInterface = controllerName;
    controllerName = undefined;
  }

  viewInterface = viewInterface || {};

  var template;

  if(fofx.isString(controllerName)) {
    var query = '[fx-controller="' + controllerName + '"]';
    template = document.querySelector(query);
  }

  var controller = new FXController(controllerName, template, viewInterface, watching);
  if(template) { controller.init(); }

  if(fofx.isString(controllerName)) { fofx.registeredControllers[controllerName] = controller; }

  return controller;
}

FXController.prototype.init = function() {
  this.liveElement = this.template.cloneNode(true);

  this.processElement(this.liveElement, this.watching ? [].concat(this.watching) : []);
  this.template.parentElement.replaceChild(this.liveElement, this.template);
}

FXController.prototype.watch = function(toWatch) {
  this.watching = toWatch;
}

FXController.prototype.refreshView = function() {
  var oldElement = this.liveElement;
  this.liveElement = this.template.cloneNode(true);

  this.processElement(this.liveElement, this.watching ? [].concat(this.watching) : []);
  oldElement.parentElement.replaceChild(this.liveElement, oldElement);
}

FXController.prototype.processElement = function(element, lookupChain, indices) {
  element.removeAttribute('fx-controller');

  // copy lookupChain so changes in here don't affect outer scope:
  lookupChain = (lookupChain || []).slice();

  if(element.hasAttribute('fx-context')) {
    var contextObject = this.getFromLookupChain(element.getAttribute('fx-context'), lookupChain, indices, element);
    if(fofx.isDefined(contextObject)) {
      lookupChain = [contextObject].concat(lookupChain);
      element.removeAttribute('fx-context');
    }
  }

  if(element.hasAttribute('fx-filter')) {
    if(lookupChain[0] && (fofx.isArray(lookupChain[0]) || lookupChain[0].isFXCollection)) {
      lookupChain[0] = this.scopeList(element, lookupChain[0], lookupChain.slice(1), indices);
    }
  }

  if(element.hasAttribute('fx-foreach')) {
    var listName = element.getAttribute('fx-foreach');
    var list = this.getFromLookupChain(listName, lookupChain, indices, element);
    if(list && (fofx.isArray(list) || list.isFXCollection)) {
      list = this.scopeList(element, list, lookupChain, indices);
      this.buildList(element, list, lookupChain, indices);
    }
  } else {
    this.processAttributes(element, lookupChain, indices);
    // convert to an array to make it a non-live list. This prevents re-processing
    // of child elements added by buildList during loop:
    var childNodes = Array.prototype.slice.call(element.childNodes);
    for(var i = 0; i < childNodes.length; i++) {
      if(childNodes[i].nodeType === 1) {
        this.processElement(childNodes[i], lookupChain, indices);
      } else if(childNodes[i].nodeType === 3) {
        var textContent = childNodes[i].textContent;
        var processedText = this.processText(textContent, lookupChain, indices, element);
        childNodes[i].textContent = processedText;
      }
    }
  }
}

FXController.prototype.scopeList = function(element, list, lookupChain, indices) {
  if(list.isFXCollection) {
    var collection = list;
    var scope = { filter: 'all' };
    if(element.hasAttribute('fx-scope')) {
      scope = this.getFromLookupChain(element.getAttribute('fx-scope'), lookupChain, indices, element);
      element.removeAttribute('fx-scope');
    }
    ['fx-filter', 'fx-sort'].forEach(function(attributeName) {
// unit test this, maybe separate into own method:
      if(element.hasAttribute(attributeName)) {
        var hasIt = this.findInLookupChain(element.getAttribute(attributeName), lookupChain, indices, element);
        if(hasIt) {
          scope[attributeName.replace('fx-','')] = hasIt[element.getAttribute(attributeName)];
        } else {
          scope[attributeName.replace('fx-','')] = element.getAttribute(attributeName);
        }
        element.removeAttribute(attributeName);
      }
    }, this);
    // quick fix, need to change:
    scope.set = function(propertyName, value) {
      scope[propertyName] = value;
      collection.broadcastChange();
    }
    list = list.scope(scope).members;
  } else {
// unit test this:
    ['fx-filter', 'fx-sort'].forEach(function(attributeName) {
      if(element.hasAttribute(attributeName)) {
        var hasIt = this.findInLookupChain(element.getAttribute(attributeName), lookupChain, indices, element);
        if(hasIt) {
          var func = hasIt[element.getAttribute(attributeName)];
          if(fofx.isFunction(func)) {
            // slice to avoid altering array when sorting:
            list = list.slice()[attributeName.replace('fx-','')](func);
            element.removeAttribute(attributeName);
          }
        }
      }
    }, this);
  }

  return list;
}

FXController.prototype.buildList = function(element, list, lookupChain, indices) {
  var nextSibling = element.nextSibling;
  var elementParent = element.parentElement;
  elementParent.removeChild(element);

  list.forEach(function(item, listIndex) {
    var cloneElement = element.cloneNode(true);
    cloneElement.removeAttribute('fx-foreach');
    this.processElement(cloneElement, [item].concat(lookupChain), [listIndex].concat(indices));
// need to test lookupChain granularly
    elementParent.insertBefore(cloneElement, nextSibling);
    // quick fix, need to change:
    this.viewInterface[listIndex] = cloneElement;
  }, this);
}

FXController.prototype.processAttributes = function(element, lookupChain, indices) {
  var attributes = Array.prototype.slice.call(element.attributes);
// test for: for loop while attributes being changed caused some to be skipped
  attributes.forEach(function(attribute) {
    var currAttr = attribute.name;
    if(currAttr.match(/^fx-attr/)) {
      this.configureAttribute(element, currAttr, lookupChain, indices);
    } else {
      switch(currAttr) {
        case 'fx-toggle-display':
          this.toggleDisplay(element, lookupChain, indices);
        break;
        case 'fx-toggle-class':
          this.toggleClasses(element, lookupChain, indices);
        break;
        case 'fx-on':
          this.addEventListeners(element, lookupChain, indices);
        break;
        case 'fx-checked':
          this.checkCheckbox(element, lookupChain, indices);
        break;
      }
    }
  }, this);
}

FXController.prototype.processText = function(text, lookupChain, indices, element) {
  var interpolator = /{{!?\w+\??}}/g;
  var matches = text.match(interpolator) || [];
  matches.forEach(function(match) {
    var negate = /^{{!/.test(match);
    var innerMatch = match.match(/\w+\??/)[0];
    var replacement = this.getFromLookupChain(innerMatch, lookupChain, indices, element);
    if(negate) { replacement = !replacement; }
    text = text.replace(match, replacement);
  }, this);
  return text;
}

FXController.prototype.findInLookupChain = function(propertyName, lookupChain) {
  lookupChain = (lookupChain || []).concat(this.viewInterface);
  for(var i = 0; i < lookupChain.length; i++) {
    if(fofx.isDefined(lookupChain[i][propertyName])) {
      return lookupChain[i];
    }
  }
}

FXController.prototype.getFromLookupChain = function(propertyName, lookupChain, indices, currElement, eventArg) {
  lookupChain = lookupChain || [];
  indices = indices || [];
  var hasProperty = this.findInLookupChain(propertyName, lookupChain);
  if(hasProperty) {
    var returnVal = hasProperty[propertyName];
    if(fofx.isFunction(returnVal)) {
      this.viewInterface.currElement = currElement;
      var isInterface = hasProperty === this.viewInterface;
      var lookupArg = isInterface ? lookupChain.concat(indices) : [];
      if(isInterface && eventArg) { lookupArg.unshift(eventArg); }
      returnVal = returnVal.apply(hasProperty, lookupArg);
      delete this.viewInterface.currElement;
    }
    return returnVal;
  }
}

FXController.prototype.configureAttribute = function(element, attr, lookupChain, indices) {
  var originalText = element.getAttribute(attr);
  var newText = this.processText(originalText, lookupChain, indices, element);
  var trueAttribute = attr.replace(/^fx-attr-/,'');
  element.setAttribute(trueAttribute, newText);
  element.removeAttribute(attr);
  return this;
}

FXController.prototype.toggleClasses = function(element, lookupChain, indices) {
  var classesToToggle = element.getAttribute('fx-toggle-class');
  if(classesToToggle) {
    classesToToggle = classesToToggle.split(/ +/);
    var classesToAdd = classesToToggle.filter(function(className) {
      return this.getFromLookupChain(className, lookupChain, indices, element);
    }, this);
    if(classesToAdd.length) {
      var newClassName = classesToAdd.join(' ');
      element.className = (element.className ? element.className + ' ' : '') + newClassName;
    }
    element.removeAttribute('fx-toggle-class');
  }
}

FXController.prototype.toggleDisplay = function(element, lookupChain, indices){
  var toggleProperties = element.getAttribute('fx-toggle-display').split(/ +/);
  var oneFound = toggleProperties.some(function(property) {
    var trueProperty = property.replace(/^!/,'');
    var isTrue = this.getFromLookupChain(trueProperty, lookupChain, indices, element);
    return trueProperty === property ? isTrue : !isTrue;
  }, this);
  element.style.display = oneFound ? '' : 'none';
  element.removeAttribute('fx-toggle-display');
}

FXController.prototype.addEventListeners = function(element, lookupChain, indices) {
  var eventsList = element.getAttribute('fx-on').split(/; */);
  var eventsAndHandlers = eventsList.map(function(eventAndHandler) {
    return eventAndHandler.split(/: */);
  });
  eventsAndHandlers.forEach(function(eventAndHandler) {
    if(eventAndHandler[0].match(/,/)) {
      var multipleEvents = eventAndHandler[0].split(/, */);
      eventAndHandler[0] = multipleEvents.shift();
      multipleEvents.forEach(function(ev) {
        eventsAndHandlers.push([ev, eventAndHandler[1]]);
      });
    }
  });
  eventsAndHandlers.forEach(function(eventAndHandler) {
    if(eventAndHandler[0]) {
      var handlers = eventAndHandler[1].split(/, */);
      element.addEventListener(eventAndHandler[0], function(e) {
        handlers.forEach(function(handler) {
          var result = this.getFromLookupChain(handler, lookupChain, indices, element, e);
          if(fofx.isBoolean(result)) {
            var hasProperty = this.findInLookupChain(handler, lookupChain);
            hasProperty[handler] = !result;
          }
        }, this);
      }.bind(this), false);
    }
  }, this);
  element.removeAttribute('fx-on');
}

FXController.prototype.checkCheckbox = function(element, lookupChain, indices) {
  var checkboxProperty = element.getAttribute('fx-checked');
  element.checked = this.getFromLookupChain(checkboxProperty, lookupChain, indices, element);
  element.removeAttribute('fx-checked');
}

})();
