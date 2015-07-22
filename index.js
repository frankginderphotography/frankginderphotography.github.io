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
njn.controller('showcases', { photos: photos, fullwidth: window.innerWidth + 'px', indexRange: indexRange });

var loading = document.body.removeChild(document.getElementById('loading'));
var showcases = document.getElementById('showcases');
showcases.style.width = photos.length * window.innerWidth + 'px';

var numLeft;

function loadFullSizeImg(photo, i) {
  if(!i) {
    document.body.appendChild(loading);
    numLeft = photo.photoInd;
  }
  var children = showcases.children;
  var showcase = children[photo.photoInd];
  var fullsize = showcase.getElementsByTagName('img')[0];
  var newload = false;
  if(!fullsize.src) {
    newload = true;
    if(!i) fullsize.onload = function() {
      showcases.style.left = -photo.photoInd * window.innerWidth + 'px';
      showcases.style.display = 'block';
      document.body.removeChild(loading);
    }
    fullsize.src = photo.src;
  }
  if(!newload && !i) {
    showcases.style.left = -photo.photoInd * window.innerWidth + 'px';
    showcases.style.display = 'block';
    document.body.removeChild(loading);
  } else if(i === 1) {
    children[photo.photoInd - 1].getElementsByClassName('right-click')[0].href = photo.href;
  } else if(i === -1) {
    children[photo.photoInd + 1].getElementsByClassName('left-click')[0].href = photo.href;
  }
}

var photoGridSquare;

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
      var photoIndex = +photoId[0].match(/[0-9]+/)[0];
      var startIndex = +thumbnail.getAttribute('data-photoindex');
      for(var i = 0, diffs = [0, 1, -1, 2, -2]; i < 5; i++) {
        var currIndex = (startIndex + diffs[i]) % photos.length;
        var currPhoto = photos.slice(currIndex)[0];
        loadFullSizeImg(currPhoto, diffs[i]);
      }
    } else {
      showcases.style.display = 'none';
    }
  }
})();

window.onresize = function() {
  showcases.style.width = photos.length * window.innerWidth + 'px';
  showcases.style.left = -numLeft * window.innerWidth + 'px';
  var children = showcases.children;
  for(var i = 0; i < children.length; i++) {
    children[i].style.width = window.innerWidth + 'px';
  }
}
