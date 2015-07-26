// var max = number of photos on server
// break up into groups of 24, returning strings like: '1-24', '25-48', etc.
// if small screen, groups of 12 instead to minimize loading time

var groups = [],
    max = 151,
    groupsOf = window.innerWidth < 551 ? 11 : 23;

for(var i = 1, j = 1; i <= max; i++) {
  if(i - j === groupsOf || i === max) {
    groups.push(j + '-' + i);
    j = i + 1;
  }
}

// populate links for the above groups:

njn.controller('sidebar', { groups: groups });

var indexRange = (location.hash.match(/#\/([0-9]+-[0-9]+)/) || ['','1-24'])[1];
var firstIndex = +indexRange.split('-')[0];
var lastIndex = +indexRange.split('-')[1];

var photos = [];

for(var i = firstIndex; i <= lastIndex; i++) {
  var id = 'photo_' + i;
  photos.push({
    id:        id,
    src:       'photos/' + id + '.jpg',
    href:      '#/' + indexRange + '/' + id,
    thumbnail: 'thumbnails/' + id + '.png',
    photoInd:  i - firstIndex
  });
}

njn.controller('photo-gallery', { photos: photos });
njn.controller('showcases', { photos: photos, indexRange: indexRange });

var photoGallery = document.getElementById('photo-gallery');
var loading = document.body.removeChild(document.getElementById('loading'));
var showcases = document.getElementById('showcases');
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
  var thumbnail = document.getElementById(photoId);
  var startIndex = +thumbnail.getAttribute('data-photoindex');
  while(currentlyShown.firstChild) {
    showcases.appendChild(currentlyShown.firstChild);
  }
  for(var i = -1; i < 2; i++) {
    var currIndex = getIndex(startIndex, i);
    var showcase = showcases.querySelector('[data-photoindex="' + currIndex + '"]');
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
    // the thumbnail you just clicked is still being hovered and is
    // covering the fullsize image.  Store it in photoGridSquare so
    // we can remove the -behind class later:
    photoGridSquare = document.querySelector('.photo-grid-square:hover');
    // Change its class so it is no longer hovered:
    if(photoGridSquare) photoGridSquare.className = 'photo-grid-square-behind';
    loadShowcase(photoId[0]);
  }
}, false);

currentlyShown.addEventListener('click', function(e) {
  if(e.target.className.match(/(right|left)-click/)) {
    var nextIndex;
    if(e.target.className.match(/right/)) {
      nextIndex = getIndex(+e.target.getAttribute('data-toindex'), 1);
      var nextShowcase = showcases.querySelector('[data-photoindex="' + nextIndex + '"]');
      currentlyShown.appendChild(nextShowcase);
      showcases.appendChild(currentlyShown.firstChild);
    } else {
      nextIndex = getIndex(+e.target.getAttribute('data-toindex'), -1);
      var nextShowcase  = showcases.querySelector('[data-photoindex="' + nextIndex + '"]');
      currentlyShown.insertBefore(nextShowcase, currentlyShown.firstChild);
      showcases.appendChild(currentlyShown.lastChild);
    }
    shownShowcase = currentlyShown.children[1];
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
    document.getElementById('photo-gallery').scrollTop += (direction === 'Up' ? -50 : 50);
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
    var prevLeft = parseInt(currentlyShown.style.left);
    currentlyShown.style.left = prevLeft + deltaX + 'px';
    alert(prevLeft, currentlyShown.style.left);
  }
}, false);