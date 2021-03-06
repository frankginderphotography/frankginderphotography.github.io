// prevent layout from changin (when template removed)
// 

var __njn_controller_utilities__ = (function defineNJNController() {

njn.Controller = function NJNController() { }

njn.controller = function(controllerName, viewInterface) {
  var controller = new njn.Controller;

  controller.viewInterface = viewInterface || (njn.isObject(controllerName) ? controllerName : {});
  controller.viewInterface.controller = controller;

  if(njn.isString(controllerName)) {
    controller.name = controllerName;
    njn.registerController(controllerName, controller);
    var template = document.getElementById(controllerName);
    if(template) controller.loadTemplate(template);
  }

  return controller;
}

njn.Controller.prototype.loadTemplate = function(template) {
  this.template = template;
  this.parentElement = template.parentElement;
  return this.refreshView();
}

njn.Controller.prototype.refreshView = function() {
  var processed = processHTML(this.template, this.viewInterface);
  (document.getElementById(this.name) || this.template).outerHTML = processed;
  repeatElements(document.getElementById(this.name), this.viewInterface);
  var liveElement = document.getElementById(this.name);
  liveElement.outerHTML = stripBracketsAndTripleBraces(liveElement.outerHTML).replace(/data-njnsrc/g, 'src');
  return document.getElementById(this.name);
}

function repeatElements(parentElement, resolveIn, listName) {
  var selector = '[data-njnrepeat' + (listName ? '^=' + listName : '') + ']';
  var repeaters = parentElement.querySelectorAll(selector);
  for(i = 0; i < repeaters.length; i++) {
    var repeater = repeaters[i];
    var listNameRegExp = new RegExp('(?:' + listName + ':)?(.+)');
    var newListName = repeater.getAttribute('data-njnrepeat').match(listNameRegExp)[1];
    var list = resolveValue(newListName, resolveIn);
    var html = '';
    for(var j = 0; j < list.length; j++) {
      html += processHTML(repeater, list[j], newListName);
    }
    repeater.outerHTML = html;
  }
}

function processHTML (elementOrHTML, resolveIn, listName) {
  var html = '';
  html = elementOrHTML.outerHTML || elementOrHTML;
  var interpolator = new RegExp(interpolatorRE.join(listName ? listName + ':' : ''), 'g');
  while(html.search(interpolator) > -1) {
    html = processText(html, resolveIn, interpolator);
  }
  // if any [[]] were in the original html but no {{}}, make sure the [[]] are processed:
  return processText(html, resolveIn, interpolator);;
}

var interpolatorRE = ['\\{\\{', '[!=]?\\w+(?:\\?|(?:\\+|\\-)[0-9]*)?\\}\\}(?!\\})'];

var escapeHTMLRE = /\[\[([^\]]|\n)+\]\]/g;

function processText(text, resolveIn, interpolator) {
  return text.replace(interpolator, function(match) {
    var innerMatch = match.match(/\{\{(?:\w+:)?((?:[^\}]|\}(?!\}))+)\}\}/)[1];
    var negate = /^!/.test(innerMatch);
    var incr = innerMatch.match(/\+([0-9]*)$/);
    var decr = innerMatch.match(/\-([0-9]*)$/);
    var propertyName = innerMatch.match(/\w+\??/)[0];
    var replacement = resolveValue(propertyName, resolveIn);
    replacement =
      incr ? replacement + (+incr[1] || 1) :
      decr ? replacement - (+decr[1] || 1) :
      replacement;
    if(njn.isDefined(replacement)) {
      if(negate) { replacement = !replacement; }
      if(njn.isHTMLElement(replacement)) {
        replacement = replacement.outerHTML;
      }
      return replacement;
    } else {
      return match + '}';
    }
  }).replace(escapeHTMLRE, function(match) {
    return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  });
}

function resolveValue(propertyName, resolveIn) {
  var splitProperty = propertyName.split('.');
  var firstProperty = splitProperty.shift();
  if(njn.hasProperty(resolveIn, firstProperty)) {
    var value = resolveIn[firstProperty];
    value = value.call ? value.call(resolveIn) : value;
    while(splitProperty.length) {
      subValue = value[splitProperty.shift()];
      value = subValue.call ? subValue.call(value) : subValue;
    }
    return value;
  }
}

function stripBracketsAndTripleBraces(html) {
  return html.replace(/\[?\[\[|\]?\]\]/g, function(match) {
    return match.length === 3 ? match.slice(0,2) : '';
  }).replace(/\{\{\{/g, '{{').replace(/\}\}\}/g, '}}');
}

if(window['testing'])
  return {
    interpolatorRE: interpolatorRE,
    escapeHTMLRE: escapeHTMLRE,
    resolveValue: resolveValue,
    processText: processText,
    stripBracketsAndTripleBraces: stripBracketsAndTripleBraces
  };

})();
