// var max = number of photos on server
// break up into groups of 24, returning strings like: '1-24', '25-48', etc:

var groups = [], max = 151;

for(var i = 1, j = 1; i <= max; i++) {
  if(i - j === 23 || i === max) {
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

var loading = document.body.removeChild(document.getElementById('loading'));
var showcases = document.getElementById('showcases');
var shownShowcase;

function loadFullSizeImg(photo, i) {
  var children = showcases.children;
  var showcase = children[photo.photoInd];
  var fullsize = showcase.getElementsByTagName('img')[0];
  var newload = false;

  if(!i) {
    document.body.appendChild(loading);
    shownShowcase = showcase;
    showcase.style.left = '0';
    showcase.style.transition = 'left 400ms ease 400ms';
  }

  if(!fullsize.src) {
    newload = true;
    if(!i) fullsize.onload = function() {
      document.body.removeChild(loading);
      showcases.style.display = 'block';
    }
    fullsize.src = photo.src;
  }

  if(!newload && !i) {
    document.body.removeChild(loading);
    showcases.style.display = 'block';
  } else if(i === 1) {
    children[photo.photoInd - 1].getElementsByClassName('right-click')[0].href = photo.href;
    showcase.style.left = '100%';
  } else if(i === -1) {
    children[photo.photoInd + 1].getElementsByClassName('left-click')[0].href = photo.href;
    showcase.style.left = '-100%';
  }
}

var photoGridSquare, lastShown;

(window.onhashchange = function() {
  var newRange = location.hash.match(/#\/([0-9]+-[0-9]+)/);
  if(newRange && newRange[1] !== indexRange) {
    location.reload();
  } else {
    var photoId = location.hash.match(/photo_[0-9]+$/);
    if(photoGridSquare) photoGridSquare.className = 'photo-grid-square';
    if(photoId) {
      photoGridSquare = document.querySelector('.photo-grid-square:hover');
      if(photoGridSquare) photoGridSquare.className = 'photo-grid-square-behind';
      var thumbnail = document.getElementById(photoId);
      var startIndex = lastShown = +thumbnail.getAttribute('data-photoindex');
      for(var i = 0, diffs = [0, 1, -1, 2, -2]; i < 5; i++) {
        var currIndex = (startIndex + diffs[i]) % photos.length;
        var currPhoto = photos.slice(currIndex)[0];
        loadFullSizeImg(currPhoto, diffs[i]);
      }
      for(var i = 0; i < photos.length; i++) {
        if(Math.abs(i - startIndex) > 1) {
          showcases.children[i].style.transition = 'none';
          showcases.children[i].style.left = '-100%';
        }
      }
    } else {
      showcases.style.display = 'none';
    }
  }
})();

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

var firstTouch;

showcases.addEventListener('touchstart', function(e) {
  (firstTouch = e.touches[0]).time = Date.now();
}, false);

showcases.addEventListener('touchmove', function(e) {
alert(firstTouch.pageY, firstTouch.pageX);
  var currTouch = e.touches[0];
  // Ensure this is a one touch swipe and not, e.g. a pinch:
  if (currTouch.length > 1 || (e.scale && e.scale !== 1)) {
    return;
  }
  var deltaX = currTouch.pageX - firstTouch.pageX,
      deltaY = currTouch.pageY - firstTouch.pageY,
      isVertical = Math.abs(deltaY) > Math.abs(deltaX);
  if(isVertical) {
    this.style.top = deltaY + 'px';
  } else {
    // disable horizontal scrolling:
    e.preventDefault();
    this.style.left = deltaX + 'px';
  }
}, false);
