// strict mode broke mobile, need to find out why:
// "use strict";

// var max = number of photos on server
// break up into groups of 24, returning strings like: '1-24', '25-48', etc.
// if small screen, groups of 12 instead to minimize loading time:

var indexRanges = [],
    max = 151,
    groupsOf = window.innerWidth < 551 ? 11 : 23;

(function() {
  // will reuse rangeEnd and rangeStart below, so segregate them in a function scope here:
  for(var rangeEnd = 1, rangeStart = 1; rangeEnd <= max; rangeEnd++) {
    if(rangeEnd - rangeStart === groupsOf || rangeEnd === max) {
      indexRanges.push(rangeStart + '-' + rangeEnd);
      rangeStart = rangeEnd + 1;
    }
  }
})();

// populate links for the above indexRanges:
njn.controller('sidebar', { indexRanges: indexRanges });

// Detect whether the location hash contains an index range, in the form of
// #/[startNum]-[endNum]. It may not be present when the site is first
// loaded, so we'll default to the first index range in the ranges array
// defined above:
var indexRange = (location.hash.match(/#\/([0-9]+-[0-9]+)/) || ['',indexRanges[0]])[1];
var rangeStart = +indexRange.split('-')[0];
var rangeEnd = +indexRange.split('-')[1];

var photos = [];

for(var i = rangeStart; i <= rangeEnd; i++) {
  var id = 'photo_' + i;
  photos.push({
    id:         id,
    src:        'photos/' + id + '.jpg',
    href:       '#/' + indexRange + '/' + id,
    thumbnail:  'thumbnails/' + id + '.png',
    photoInd:   i - rangeStart
  });
}

njn.controller('photo-gallery', { photos: photos });
njn.controller('showcases', { photos: photos, indexRange: indexRange });

var photoGallery = document.getElementById('photo-gallery');
var showcases    = document.getElementById('showcases');
var leftClick    = document.getElementById('left-click');
var rightClick   = document.getElementById('right-click');

function loadAhead(photoId) {
  var startNum = +photoId.match(/[0-9]+/)[0];
  for(var i = 0, diffs = [0, 1, -1, 2, -2]; i < 5; i++) {
    var currPhoto = 'photo_' + (startNum + diffs[i]);
    var showcase = showcases.querySelector('[data-photo="' + currPhoto + '"]');
    if(showcase) {
      showcase.getElementsByTagName('img')[0].src = 'photos/' + currPhoto + '.jpg';
    }
  }
}

var positionedShowcases = {
  forEach: function(callback) {
    njn.Array.forEach([this.left, this.center, this.right], function(showcase, i) {
      if(showcase) {
        callback.call(null, showcase, i);
      }
    });
  },
  set: function(position, showcase) {
    if(this[position]) {
      this[position].position = '';
      this[position].className = 'showcase';
    }
    showcase.position = position;
    showcase.photoNumber = Number(showcase.getAttribute('data-photo').match(/[0-9]+/)[0]);
    showcase.className = position + ' showcase';
    this[position] = showcase;
  }
};

function setHrefs() {
  var idNum = positionedShowcases.center.photoNumber;
  var leftNum = idNum - 1, rightNum = idNum < max ? idNum + 1 : 1;

  leftClick.href = '#/' +
    (
      leftNum >= rangeStart ? indexRange :
      (
        leftNum ? Math.max(leftNum - groupsOf, 1) + '-' + leftNum : max - groupsOf + '-' + max
      )
    )
  + '/photo_' + (leftNum || max);

  rightClick.href = '#/' +
    (
      idNum < rangeEnd ? indexRange :
      (
        idNum < max ? rightNum + '-' + Math.min(rightNum + groupsOf, max) : indexRanges[0]
      )
    )
  + '/photo_' + rightNum;
}

function clearTransform(showcase) {
  if(!showcase) {
    positionedShowcases.forEach(clearTransform);
  } else {
    showcase.className = showcase.position + ' showcase';
    showcase.style.webkitTransform = 'none';
    showcase.style.mozTransform    = 'none';
    showcase.style.msTransform     = 'none';
    showcase.style.oTransform      = 'none';
    showcase.style.transform       = 'none';
  }
}

function transformPositionedShowcases(pctOffset, y) {
  positionedShowcases.forEach(function(showcase, i) {
    var translateFunction = 'translate(' + (i * 100 + (pctOffset || 0)) + '%, ' + (y || 0) + '%)';
    if(showcase) {
      showcase.style.webkitTransform = translateFunction;
      showcase.style.mozTransform    = translateFunction;
      showcase.style.msTransform     = translateFunction;
      showcase.style.oTransform      = translateFunction;
      showcase.style.transform       = translateFunction;
    }
  });
}

function loadShowcase(photoId) {
  clearTransform();
  var photoNum = +photoId.match(/[0-9]+/)[0];
  for(var i = -1; i < 2; i++) {
    var currPhoto = 'photo_' + (photoNum + i);
    var showcase = showcases.querySelector('[data-photo="' + currPhoto + '"]');
    if(i == -1 && showcase) positionedShowcases.set('left', showcase);
    if(i == 0) positionedShowcases.set('center', showcase);
    if(i == 1 && showcase) positionedShowcases.set('right', showcase);
  }
  transformPositionedShowcases();
  setHrefs();
  loadAhead(photoId);
  showcases.style.display = 'block';
}

var photoId = location.hash.match(/photo_[0-9]+/);
if(photoId) loadShowcase(photoId[0]);

window.addEventListener('hashchange', function() {
  // on clicking one of the group links, the index range part of the
  // hash is changes, so load the new group:
  var newRange = location.hash.match(/#\/([0-9]+-[0-9]+)/);
  if(newRange && newRange[1] !== indexRange) {
    location.reload();
  } else {
    var photoId = location.hash.match(/photo_[0-9]+/);
    if(photoId) {
      var isShown = photoId[0] == positionedShowcases.center.getAttribute('data-photo');
      if(showcases.style.display != 'block' || !isShown) {
        loadShowcase(photoId[0]);
      }
    } else {
      // if a fullsized image was clicked, the photo_id part of the hash
      // was removed, so hide #showcases:
      clearTransform();
      showcases.style.display = 'none';
    }
  }
}, false);

photoGallery.addEventListener('click', function(e) {
  var photoId = (e.target.id || '').match(/photo_[0-9]+$/);
  if(photoId) {
    loadShowcase(photoId[0]);
  }
}, false);

var globalTransition = '400ms linear',
    inTransition;

function setTransition(element, callback) {
  if(!element) { return; }
  njn.Array.forEach(
    ['transitionend', 'webkitTransitionEnd', 'oTransitionEnd', 'otransitionend'],
    function(transitionName) {
      element.addEventListener(transitionName, function transitionEnd() {
        if(njn.isFunction(callback)) {
          callback(element);
        } else {
          clearTransition(element);
          // reset globalTransition in case it was changed ontouchend:
          globalTransition = '400ms linear';
          setHrefs();
          inTransition = false;
        }
        element.removeEventListener(transitionName, transitionEnd, false);
      }, false);
      element.style.webkitTransition = '-webkit-transform ' + globalTransition;
         element.style.mozTransition =    '-moz-transform ' + globalTransition;
          element.style.msTransition =     '-ms-transform ' + globalTransition;
           element.style.oTransition =      '-o-transform ' + globalTransition;
            element.style.transition =         'transform ' + globalTransition;
      inTransition = true;
    }
  );
}

function clearTransition(element) {
  element.style.webkitTransition = 'none';
  element.style.mozTransition    = 'none';
  element.style.msTransition     = 'none';
  element.style.oTransition      = 'none';
  element.style.transition       = 'none';
}

function slideShowcase(goDir) {
  var oppDir = goDir == 'left' ? 'right' : 'left';
  
  if(positionedShowcases[oppDir]) {
    clearTransition(positionedShowcases[oppDir]);
    clearTransform(positionedShowcases[oppDir]);
  }
  
  positionedShowcases.set(oppDir, positionedShowcases.center);
  setTransition(positionedShowcases[oppDir]);
  positionedShowcases.center = undefined;
  
  positionedShowcases.set('center', positionedShowcases[goDir]);
  setTransition(positionedShowcases.center);
  positionedShowcases[goDir] = undefined;
  
  var upOrDown = goDir == 'left' ? -2 : 2;
  var newNextPhotoId = positionedShowcases[oppDir].photoNumber + upOrDown;
  var newNextPhoto = showcases.querySelector('[data-photo="photo_' + newNextPhotoId + '"]');
  if(newNextPhoto) positionedShowcases.set(goDir, newNextPhoto);
  
  if(positionedShowcases.center) {
    transformPositionedShowcases();
    loadAhead(positionedShowcases.center.getAttribute('data-photo'));
  }
}

showcases.addEventListener('click', function(e) {
  var idMatch = (e.target.id || '').match(/left|right/);
  var hashpart = (e.target.href || '').match(/#.+/) || [];
  if(hashpart[0] !== location.hash && idMatch) {
    slideShowcase(idMatch[0]);
  }
}, false);

var whichKey = function(e) {
  return e.key || {
    37: 'ArrowLeft',
    38: 'ArrowUp',
    39: 'ArrowRight',
    40: 'ArrowDown'
  }[e.which] || '';
}

function navigatePhotos(direction) {
  if(showcases.style.display === 'block') {
    var click = new MouseEvent('click', { bubbles: true });
    document.getElementById(direction.toLowerCase() + '-click').dispatchEvent(click);
  }
}

function scrollThumbnails(direction) {
  if(showcases.style.display !== 'block') {
    photoGallery.scrollTop += (direction === 'Up' ? -75 : 75);
  }
}

window.addEventListener('keydown', function(e) {
  var match;
  if(match = whichKey(e).match(/Left|Right/)) {
    navigatePhotos(match[0]);
  } else if(match = whichKey(e).match(/Up|Down/)) {
    scrollThumbnails(match[0]);
  }
}, false);

photoGallery.addEventListener('touchstart', function(e) {
  if(e.target.className === 'thumbnail') {
    var gridSquare = e.target.parentElement.parentElement;
    if(gridSquare.className === 'photo-grid-square') {
      gridSquare.className = 'photo-grid-square-no-hover';
      e.target.addEventListener('mouseenter', function makeHoverableAgain() {
        e.target.parentElement.parentElement.className = 'photo-grid-square';
        e.target.removeEventListener('mouseenter', makeHoverableAgain, false);
      }, false);
    }
  }
}, false);

var firstTouch = {};

showcases.addEventListener('touchstart', function(e) {
  var isNavClick = e.target.id.match(/left|right/);
  var currTouch = e.changedTouches[0];
  if(!inTransition && !isNavClick) {
    // positionedShowcases.forEach(clearTransition);
    // iOS safari reuses touch objects across events, so store properties in separate object:
    firstTouch.screenX = currTouch.screenX;
    firstTouch.screenY = currTouch.screenY;
    firstTouch.time = Date.now();
  } else if(inTransition) {
    firstTouch.inTransition = true;
  } else if(isNavClick) {
    firstTouch.isNavClick = true;
  }
}, false);

showcases.addEventListener('touchmove', function(e) {
  e.preventDefault();
  var currTouch = e.changedTouches[0];
  if(e.changedTouches.length > 1 || (e.scale && e.scale !== 1)) {
    return;
  }
  if(!firstTouch.inTransition && !firstTouch.isNavClick) {
    var deltaX = currTouch.screenX - firstTouch.screenX,
        deltaY = currTouch.screenY - firstTouch.screenY;
    if(!firstTouch.hasOwnProperty('isVertical')) {
      firstTouch.isVertical = Math.abs(deltaY) > Math.abs(deltaX);
    }
    if(firstTouch.isVertical) {
      var heightRatio = deltaY / window.innerHeight * 100;
      transformPositionedShowcases(0, heightRatio);
    } else {
      var widthRatio = deltaX / window.innerWidth * 100;
      transformPositionedShowcases(widthRatio);
    }
  }
}, false);

showcases.addEventListener('touchend', function(e) {
  if(!firstTouch.inTransition && !firstTouch.isNavClick) {
    var currTouch = e.changedTouches[0];
    var deltaX = currTouch.screenX - firstTouch.screenX,
        deltaY = currTouch.screenY - firstTouch.screenY;
    var quickSwipe = Date.now() - firstTouch.time < 250;
    if(firstTouch.isVertical) {
      var halfScreenY = Math.abs(deltaY) > window.innerHeight / 2;
      var exitSwipe = halfScreenY || (quickSwipe && Math.abs(deltaY) > 20);
      if(exitSwipe) {
        var yToGo = deltaY < 0 ? currTouch.screenY : window.innerHeight - currTouch.screenY;
        globalTransition = Math.round(yToGo / window.innerHeight * 800) + 'ms linear';
        positionedShowcases.forEach(setTransition);
        setTransition(positionedShowcases.center, function() {
          var click = new MouseEvent('click', { bubbles: true });
          showcases.getElementsByClassName('showcase')[0].dispatchEvent(click);
        });
        transformPositionedShowcases(0, deltaY > 0 ? 100 : -100);
      } else {
        globalTransition = Math.round(Math.abs(deltaY) / window.innerHeight * 400) + 'ms linear';
        positionedShowcases.forEach(setTransition);
        transformPositionedShowcases();
      }
    } else {
      var halfScreenX = Math.abs(deltaX) > window.innerWidth / 2;
      var navSwipe = halfScreenX || (quickSwipe && Math.abs(deltaX) > 20);
      if(navSwipe) {
        globalTransition = Math.round((window.innerWidth - Math.abs(deltaX)) / window.innerWidth * 400) + 'ms linear';
        navigatePhotos(deltaX > 0 ? 'left' : 'right');
      } else {
        globalTransition = Math.round(Math.abs(deltaX) / window.innerWidth * 400) + 'ms linear';
        positionedShowcases.forEach(setTransition);
        transformPositionedShowcases();
      }
    }
  }
  firstTouch = {};
}, false);

showcases.addEventListener('touchcancel', function(e) {
  firstTouch = {};
}, false);

var scrollbar = document.getElementById('scrollbar');
var scroller = scrollbar.children[0];

photoGallery.addEventListener('scroll', function() {
  scroller.style.top = Math.round(photoGallery.scrollTop / photoGallery.scrollHeight * 100) + '%';
}, false);

(window.onresize = function() {
  var heightRatio = Math.round(photoGallery.clientHeight / photoGallery.scrollHeight * 100);
  if(heightRatio < 100) {
    scroller.style.height = heightRatio + '%';
    scroller.style.top = Math.round(photoGallery.scrollTop / photoGallery.scrollHeight * 100) + '%';
  } else {
    scroller.style.height = '0px';
  }
})();

scroller.addEventListener('mousedown', function(e) {
  var startY = e.pageY,
      startScroll = photoGallery.scrollTop;
  window.addEventListener('mousemove', function handleMove(e2) {
    e2.preventDefault();
    scroller.className = 'hovered';
    var scrolledRatio = (e2.pageY - startY) / scrollbar.clientHeight;
    photoGallery.scrollTop = startScroll + scrolledRatio * photoGallery.scrollHeight;
    window.addEventListener('mouseup', function handleUp() {
      window.removeEventListener('mousemove', handleMove, false);
      window.removeEventListener('mouseup', handleUp, false);
      scroller.className = '';
    });
  });
}, false);
