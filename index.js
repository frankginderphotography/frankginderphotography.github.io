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
// loaded, so we'll provide a fallback array in case there is no match.
// This fallback defaults to the first index range in the ranges array
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

var photoGallery   = document.getElementById('photo-gallery');
var showcases      = document.getElementById('showcases');
var leftClick      = document.getElementById('left-click');
var rightClick     = document.getElementById('right-click');

function loadAhead(photoId) {
  var startNum = +photoId.match(/[0-9]+/)[0];
  for(var i = 0, diffs = [0, 1, -1, 2, -2]; i < 5; i++) {
    var currPhoto = 'photo_' + (startNum + i);
    var showcase = showcases.querySelector('[data-photo="' + currPhoto + '"]');
    if(showcase) {
      showcase.getElementsByTagName('img')[0].src = 'photos/' + currPhoto + '.jpg';
    }
  }
}

function getPositionedShowcase(partialClass) {
  var className = partialClass ? partialClass + '-of-shown' : 'currently-shown';
  return document.getElementsByClassName(className)[0] || {};
}

function setHrefs() {
  var idNum = +getPositionedShowcase().getAttribute('data-photo').match(/[0-9]+/)[0];
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

function loadShowcase(photoId) {
  var thumbnail = document.getElementById(photoId);
  var photoNum = +photoId.match(/[0-9]+/)[0];
  for(var i = -1; i < 2; i++) {
    var currPhoto = 'photo_' + (photoNum + i);
    var showcase = showcases.querySelector('[data-photo="' + currPhoto + '"]');
    if(i == -1 && showcase) showcase.className = 'showcase left-of-shown';
    if(i == 0) showcase.className = 'showcase currently-shown';
    if(i == 1 && showcase) showcase.className = 'showcase right-of-shown';
  }
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
    setHrefs();
    // if a fullsized image was clicked, the photo_id part of the hash
    // was removed, so hide #showcases:
    var photoId = location.hash.match(/photo_[0-9]+/);
    if(!photoId) {
      showcases.style.display = 'none';
      njn.Array.forEach(['left-of-shown', 'currently-shown', 'right-of-shown'], function(className) {
        var previouslyAssigned = document.getElementsByClassName(className);
        (previouslyAssigned[0] || previouslyAssigned).className = 'showcase';
      });
    }
  }
}, false);

photoGallery.addEventListener('click', function(e) {
  var photoId = (e.target.id || '').match(/photo_[0-9]+$/);
  if(photoId) {
    loadShowcase(photoId[0]);
  }
}, false);

function setTransitionClass(element, className) {
  njn.Array.forEach(
    ['transitionend', 'webkitTransitionEnd', 'oTransitionEnd', 'otransitionend'],
    function(transitionName) {
      element.addEventListener(transitionName, function transitionEnd() {
        element.className = className;
        element.removeEventListener(transitionName, transitionEnd, false);
      }, false);
      element.className = className + ' in-transition';
    }
  );
}

showcases.addEventListener('click', function(e) {
  var idMatch = e.target.id.match(/left|right/);
  if(idMatch) {
    var previouslyShown = getPositionedShowcase();
    var oppositeDir = idMatch[0] == 'left' ? 'right' : 'left';

    getPositionedShowcase(oppositeDir).className = 'showcase';
    setTransitionClass(previouslyShown,'showcase ' + oppositeDir + '-of-shown');
    setTransitionClass(getPositionedShowcase(idMatch[0]), 'showcase currently-shown');

    var upOrDown = idMatch[0] == 'left' ? -2 : 2;
    var newNextPhotoId = +previouslyShown.getAttribute('data-photo').match(/[0-9]+/)[0] + upOrDown;
    var newNextPhoto = showcases.querySelector('[data-photo="photo_' + newNextPhotoId + '"]');
    if(newNextPhoto) newNextPhoto.className = 'showcase ' + idMatch[0] + '-of-shown';

    loadAhead(getPositionedShowcase().getAttribute('data-photo'));
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

var firstTouch = {};

showcases.addEventListener('touchstart', function(e) {
  // iOS safari reuses touch objects across events, so store properties in separate object:
  firstTouch.screenX = e.changedTouches[0].screenX;
  firstTouch.screenY = e.changedTouches[0].screenY;
  firstTouch.time = Date.now();
}, false);

showcases.addEventListener('touchmove', function(e) {
  var currTouch = e.changedTouches[0];
  // Ensure this is a one touch swipe and not, e.g. a pinch:
  if (currTouch.length > 1 || (e.scale && e.scale !== 1)) {
    return;
  }
  var deltaX = currTouch.screenX - firstTouch.screenX,
      deltaY = currTouch.screenY - firstTouch.screenY,
      isVertical = Math.abs(deltaY) > Math.abs(deltaX);
  if(isVertical) {
    // shownShowcase.style.top = deltaY + 'px';
  } else {
    // disable horizontal scrolling:
    e.preventDefault();
    njn.Array.forEach(
      ['webkitTransform', 'mozTransform', 'msTransform', 'oTransform', 'transform'],
      function(transformName) {
        getPositionedShowcase().style.webkitTransform = 'translateX(' + deltaX + 'px)';
      }
    );
}, false);

showcases.addEventListener('touchend', function(e) {
  currentlyShown.style.webkitTransform = 'translateX(0px)';
  currentlyShown.style.mozTransform    = 'translateX(0px)';
  currentlyShown.style.msTransform     = 'translateX(0px)';
  currentlyShown.style.oTransform      = 'translateX(0px)';
  currentlyShown.style.transform       = 'translateX(0px)';
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