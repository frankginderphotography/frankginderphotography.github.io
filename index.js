"use strict";

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
  // construct the href for navigating rightward through the fullsize photos:
  var nextHref = '#/' + (
        // if we are not on the last image of the current range yet:
		      i < rangeEnd ?
        // then keep the current range in the url:
    	      indexRange :
        // else if we are on the last of all images, not just the last of the current range:
              rangeEnd === max ?
        // then cycle back to the first range of images:
              indexRanges[0] :
        // else if we are more than "groupsOf" images from the last of all images:
              max - rangeEnd > groupsOf ?
        // then create a new index range, starting from the index after the current one, to "groupsOf" more than that:
              rangeEnd + 1 + '-' + (rangeEnd + 1 + groupsOf) :
        // else create a new range, starting from the index after the current one to the last of all images:
              rangeEnd + 1 + '-' + max
        // now construct the photo id:
      ) + '/photo_' + (
        // if we are not at the last of all images yet:
              i < max ?
        // use the index after the current one:
              i + 1 :
        // else go back to the first of all images:
              1
      );
  var prevHref = '#/' + (
        // if we are not on the first image of the current range yet:
            i > rangeStart ?
        // then keep the current range in the url:
            indexRange :
        // else if we are on the first of all images:
            rangeStart === 1 ?
        // then cycle back to the last of the ranges:
            indexRanges[indexRanges.length - 1] :
        // else if we are at least one more than "groupsOf" away from the beginning:
            rangeStart > groupsOf + 1 ?
        // then create a new range from "groupsOf" plus one less than the current number to one less than the current number:
            rangeStart - (groupsOf + 1) + '-' + (rangeStart - 1) :
        // else create a new range from 1 to one less than the current number:
            '1-' + (rangeStart - 1)
        // now construct the photo id:
      ) + '/photo_' + (
        // if we are not on the first of all images yet:
            i > 1 ?
        // use the number before the current one:
            i - 1 :
        // else cycle back to the last of all images:
            max
      );
  var id = 'photo_' + i;
  photos.push({
    id:         id,
    prevHref:	prevHref,
    nextHref:	nextHref,
    src:        'photos/' + id + '.jpg',
    href:       '#/' + indexRange + '/' + id,
    thumbnail:  'thumbnails/' + id + '.png',
    photoInd:   i - rangeStart
  });
}

njn.controller('photo-gallery', { photos: photos });
njn.controller('showcases', { photos: photos, indexRange: indexRange });

var photoGallery   = document.getElementById('photo-gallery');
var loading        = document.body.removeChild(document.getElementById('loading'));
var showcases      = document.getElementById('showcases');
var currentlyShown = document.getElementById('currently-shown');

function loadFullSizeImg(i, photoidx) {
  var showcase = showcases.querySelector('[data-photoindex="' + photoidx + '"]');
  var fullsize = showcase.getElementsByTagName('img')[0];

  if(!fullsize.src) {
    if(!i) {
      document.body.appendChild(loading);
      fullsize.onload = function() {
        document.body.removeChild(loading);
        showcases.style.display = 'block';
      }
    }
    fullsize.src = photos[photoidx].src;
  } else if(!i) {
    showcases.style.display = 'block';
  }
}

function getIndex(startIndex, offset) {
  var newIndex = (startIndex + offset) % photos.length;
  return newIndex < 0 ? photos.length + newIndex : newIndex;
}

function loadAhead(startIndex) {
  for(var i = 0, diffs = [0, 1, -1, 2, -2]; i < 5; i++) {
    loadFullSizeImg(diffs[i], getIndex(startIndex, diffs[i]));
  }
}

var shownShowcase;

function loadShowcase(photoId) {
  alert(photoId);
  var thumbnail = document.getElementById(photoId);
  var startIndex = +thumbnail.getAttribute('data-photoindex');
  while(currentlyShown.firstChild) {
    showcases.appendChild(currentlyShown.firstChild);
  }
  for(var i = -1; i < 2; i++) {
    var currIndex = startIndex + i;
    var showcase = showcases.querySelector('[data-photoindex="' + currIndex + '"]');
    if(!showcase) {
      showcase = document.createElement('div');
      showcase.className = 'showcase';
    }
    if(!i) shownShowcase = showcase;
    currentlyShown.appendChild(showcase);
  }
  loadAhead(startIndex);
}

var photoId = location.hash.match(/photo_[0-9]+/);
if(photoId) loadShowcase(photoId[0]);

var photoGridSquare;

window.addEventListener('hashchange', function() {
  // on clicking one of the group links, the index range part of the
  // hash is changes, so load the new group:
  var newRange = location.hash.match(/#\/([0-9]+-[0-9]+)/);
  if(newRange && newRange[1] !== indexRange) {
    location.reload();
  } else {
    // if a fullsized image was clicked, the photo_id part of the hash
    // was removed, so hide #showcases:
    var photoId = location.hash.match(/photo_[0-9]+/);
    if(!photoId) {
      showcases.style.display = 'none';
      // if a hovered thumbnail's class had been changed to -behind when
      // the fullsize image was first loaded, now change it back:
      if(photoGridSquare) {
        photoGridSquare.className = 'photo-grid-square';
      }
    }
  }
}, false);

photoGallery.addEventListener('click', function(e) {
  // if you've clicked on one of the thumbnail images, its parent is
  // an <a> element:
  var anchor = e.target.parentElement;
  // in case you didn't click on the child of an <a>, provide empty
  // string to prevent exception:
  var photoId = (anchor.href || '').match(/photo_[0-9]+$/);
  if(photoId) {
    // the thumbnail we just clicked is still being hovered and is
    // covering the fullsize image.  Store it in photoGridSquare so
    // we can remove the -behind class later:
    photoGridSquare = document.querySelector('.photo-grid-square:hover');
    // Change its class so it is no longer hovered:
    if(photoGridSquare) photoGridSquare.className = 'photo-grid-square-behind';
    loadShowcase(photoId[0]);
  }
}, false);

var dummyShowcase = document.createElement('div');
dummyShowcase.className = 'showcase';

currentlyShown.addEventListener('click', function(e) {
  if(e.target.className.match(/(right|left)-click/)) {
    var nextIndex,
        currIndex = +shownShowcase.getAttribute('data-photoindex');
    if(e.target.className.match(/right/)) {
      nextIndex = +e.target.getAttribute('data-toindex');
      if(nextIndex + rangeStart <= rangeEnd) {
        shownShowcase = showcases.querySelector('[data-photoindex="' + nextIndex + '"]');
        var nextShowcase = showcases.querySelector('[data-photoindex="' + (nextIndex + 1) + '"]');
        if(nextShowcase) currentlyShown.appendChild(nextShowcase);
        if(currentlyShown.firstChild.querySelector('img')) {
          showcases.appendChild(currentlyShown.firstChild);
        } else {
          currentlyShown.removeChild(currentlyShown.firstChild);
        }
      }
    } else {
      nextIndex = +e.target.getAttribute('data-toindex');
      if(nextIndex + rangeStart >= rangeStart - 1) {
        shownShowcase = showcases.querySelector('[data-photoindex="' + nextIndex + '"]');
        var nextShowcase =
            showcases.querySelector('[data-photoindex="' + (nextIndex - 1) + '"]') ||
            dummyShowcase;
        currentlyShown.insertBefore(nextShowcase, currentlyShown.firstChild);
        if(currentlyShown.children.length > 3) {
          showcases.appendChild(currentlyShown.lastChild);
        }
      }
    }
    loadAhead(nextIndex);
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
    shownShowcase.querySelector('.' + direction.toLowerCase() + '-click').dispatchEvent(click);
  }
}

function scrollThumbnails(direction) {
  if(showcases.style.display !== 'block') {
    document.getElementById('photo-gallery').scrollTop += (direction === 'Up' ? -75 : 75);
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
    currentlyShown.style.webkitTransform = 'translateX(' + deltaX + 'px)';
    currentlyShown.style.mozTransform    = 'translateX(' + deltaX + 'px)';
    currentlyShown.style.msTransform     = 'translateX(' + deltaX + 'px)';
    currentlyShown.style.oTransform      = 'translateX(' + deltaX + 'px)';
    currentlyShown.style.transform       = 'translateX(' + deltaX + 'px)';
  }
}, false);

showcases.addEventListener('touchend', function(e) {
  currentlyShown.style.webkitTransform = 'translateX(0px)';
  currentlyShown.style.mozTransform    = 'translateX(0px)';
  currentlyShown.style.msTransform     = 'translateX(0px)';
  currentlyShown.style.oTransform      = 'translateX(0px)';
  currentlyShown.style.transform       = 'translateX(0px)';
}, false);