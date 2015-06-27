var fofx = {};

(function() {
  var controllersPrototype = {
    asArray: function() {
      return(Object.getOwnPropertyNames(fofx.registeredControllers).map(function(controllerName) {
        return fofx.registeredControllers[controllerName];
      }));
    },

    watching: function(collection) {
      return(fofx.registeredControllers.asArray().filter(function(controller) {
        return controller.watching === collection;
      }));
    },

    reset: function() {
      fofx.registeredControllers = Object.create(controllersPrototype);
    }
  };
  
  fofx.registeredControllers = Object.create(controllersPrototype);
})();

// utilities:

fofx.isArray = function(value) {
  if(Array.isArray) {
    return Array.isArray(value);
  } else {
    return Object.prototype.toString.call(value) === '[object Array]';
  }
}

fofx.isBoolean = function(value) {
  return typeof value === 'boolean';
}

fofx.isDate = function(value) {
  return value instanceof Date;
}

fofx.isDefined = function(value) {
  return typeof value !== 'undefined';
}

fofx.isFunction = function(value) {
  return typeof value === 'function';
}

fofx.isNull = function(value) {
  return value === null;
}

fofx.isNumber = function(value) {
  return typeof value === "number" && value === value;
}

fofx.isObject = function(value) {
  if(typeof value !== 'object') return false;
  if(fofx.isDate(value)) return false;
  if(fofx.isArray(value)) return false;
  if(fofx.isNull(value)) return false;
  return true;
}

fofx.isRegExp = function(val) {
  return val instanceof RegExp;
}

fofx.isString = function(value) {
  return typeof value === 'string';
}

fofx.typeOf = function(val) {
  if(fofx.isArray(val))       return Array;
  if(fofx.isBoolean(val))     return Boolean;
  if(fofx.isDate(val))        return Date;
  if(!fofx.isDefined(val))    return undefined;
  if(fofx.isFunction(val))    return Function;
  if(fofx.isNull(val))        return null;
  if(fofx.isNumber(val))      return Number;
  if(fofx.isObject(val))      return Object;
  if(fofx.isRegExp(val))      return RegExp;
  if(fofx.isString(val))      return String;
}

fofx.camelCase = function(string) {
  var splitString = string.split(/[-_ ]/);
  for(var i = 1; i < splitString.length; i++) {
    var firstLetter = splitString[i].slice(0, 1).toUpperCase();
    splitString[i] = firstLetter + splitString[i].slice(1);
  }
  return splitString.join('');
}

fofx.isBlank = function(string) {
  var emptyString = string === '';
  var whiteSpace = !!string.match(/^\s+$/);
  return emptyString || whiteSpace;
}

// mock classes:

fofx.Object = {
  clone: function(original, deep) {
    if(fofx.isArray(original)) {
      return original.slice();
    } else {
      var newObj = Object.create(Object.getPrototypeOf(original));
      Object.keys(original).forEach(function(propertyName) {
        newObj[propertyName] = original[propertyName];
      });
      return newObj;
    }
  },
  isCloneable: function(object) {
    return fofx.isObject(object) || fofx.isArray(object);
  },
  values: function(object) {
    var values = [];
    for(var property in object) {
      if(object.hasOwnProperty(property) && object.propertyIsEnumerable(property)) {
        values.push(object[property]);
      }
    }
    return values;
  }
}
