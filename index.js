// var max = number of photos on server
// break up into groups of 24, returning strings like: '1-24', '25-48', etc:

var groups = [],
    max = 151,
    groupsOf = window.innerWidth < 551 ? 11 : 23;

for(var i = 1, j = 1; i <= max; i++) {
  if(i - j === groupsOf || i === max) {
    groups.push(j + '-' + i);
    j = i + 1;
  }
}

njn.controller('sidebar', { groups: groups });

var photos = [];
var indexRange = (location.hash.match(/#\/([0-9]+-[0-9]+)/) || ['','1-24'])[1];

var firstIndex = +indexRange.split('-')[0];
var lastIndex = +indexRange.split('-')[1];

for(var i = firstIndex; i <= lastIndex; i++) {
  var id = 'photo_' + i;
  var src = 'photos/' + id + '.jpg';
  var href = '#/' + indexRange + '/' + id;
  var thumbnail = 'thumbnails/' + id + '.png';
  photos.push({ src: src, id: id, href: href, thumbnail: thumbnail, photoInd: i - firstIndex });
}

njn.controller('photo-gallery', { photos: photos });
njn.controller('showcases', { photos: photos, indexRange: indexRange });

var photoGallery = document.getElementById('photo-gallery');
var loading = document.body.removeChild(document.getElementById('loading'));
var showcases = document.getElementById('showcases');
var currentlyShown = document.getElementById('currently-shown');
var children = showcases.children;

function loadFullSizeImg(i, photoind) {
  var showcase = showcases.querySelector('[data-photoindex="' + photoind + '"]');
  var fullsize = showcase.getElementsByTagName('img')[0];
  var photo = photos[photoind];

  if(!fullsize.src) {
    if(!i) {
      document.body.appendChild(loading);
      fullsize.onload = function() {
        document.body.removeChild(loading);
        showcases.style.display = 'block';
      }
    }
    fullsize.src = photo.src;
  } else if(!i) {
    showcases.style.display = 'block';
  }
}

var photoGridSquare;

window.onhashchange = function() {
  var newRange = location.hash.match(/#\/([0-9]+-[0-9]+)/);
  if(newRange && newRange[1] !== indexRange) location.reload();
}

photoGallery.addEventListener('click', function(e) {
  var photoId = location.hash.match(/photo_[0-9]+$/);
  if(photoId) {
    photoGridSquare = document.querySelector('.photo-grid-square:hover');
    if(photoGridSquare) photoGridSquare.className = 'photo-grid-square-behind';
    var thumbnail = document.getElementById(photoId);
    var startIndex = +thumbnail.getAttribute('data-photoindex');
    for(var i = -1; i < 2; i++) {
      var showcase = showcases.querySelector('[data-photoindex="' + (startIndex + i) + '"]');
      if(currentlyShown.children[i + 1]) {
        currentlyShown.replaceChild(showcase, currentlyShown.children[i + 1]);
      } else {
        currentlyShown.appendChild(showcase);
      }
    }
    for(var i = 0, diffs = [0, 1, -1, 2, -2]; i < 5; i++) {
      var currIndex = (startIndex + diffs[i]) % photos.length;
      currIndex = currIndex < 0 ? photos.length + currIndex : currIndex;
      loadFullSizeImg(diffs[i], currIndex);
    }
  }
}, false);

currentlyShown.addEventListener('click', function() {
  var photoId = location.hash.match(/photo_[0-9]+$/);
  if(photoId) {

  } else {
    if(photoGridSquare) photoGridSquare.className = 'photo-grid-square';
    showcases.style.display = 'none';
  }
}

var whichKey = function(e) {
  return e.key || {
    37: 'ArrowLeft',
    38: 'ArrowUp',
    39: 'ArrowRight',
    40: 'ArrowDown'
  }[e.which];
}

function navigatePhotos(direction) {
  if(showcases.style.display === 'block') {
    var leftClick  = shownShowcase.getElementsByClassName('left-click')[0];
    var rightClick = shownShowcase.getElementsByClassName('right-click')[0];
    (direction === 'Left' ? leftClick : rightClick).dispatchEvent(new MouseEvent('click'));
  }
}

function scrollThumbnails(direction) {
  if(showcases.style.display === 'none') {
    document.getElementById('photo-gallery').scrollTop += (direction === 'Up' ? -50 : 50);
  }
}

window.addEventListener('keypress', function(e) {
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
    shownShowcase.style.top = deltaY + 'px';
  } else {
    // disable horizontal scrolling:
    e.preventDefault();
    shownShowcase.style.transition = 'none';
    shownShowcase.style.left = deltaX + 'px';
  }
}, false);
