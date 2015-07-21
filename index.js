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

var fullsizeA = document.getElementsByClassName('fullsize-a')[0];
fullsizeA.href = '#/' + indexRange;


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
njn.controller('showcases', { photos: photos });

var showcases = document.getElementById('showcases');
var loaded = {};

function loadFullSizeImg(photo, i) {
  if(!showcases.style.width)
    showcases.style.width = photos.length * document.getElementById('outer').offsetWidth + 'px';
  if(!i) {
    showcases.style.display = 'block';
    showcases.style.left = -photo.photoInd * document.getElementById('outer').offsetWidth + 'px';
  }
  var showcase = showcases.children[photo.photoInd];
  if(!showcase.style.width) showcase.style.width = document.getElementById('outer').offsetWidth + 'px';
  var fullsize = showcase.getElementsByTagName('img')[0];
  if(!fullsize.src) {
    showcase.style.left = photo.photoInd * parseInt(window.getComputedStyle(showcase).width) + 'px';
    fullsize.onload = function() {
      var loading = showcase.getElementsByClassName('loading')[0];
      showcase.removeChild(loading);
    }
    fullsize.src = photo.src;
  }
  if(i === 1) {
    showcases.children[i - 1].getElementsByClassName('right-click')[0].href = photo.href;
  } else if(i === -1) {
    showcases.children[i + 1].getElementsByClassName('left-click')[0].href = photo.href;
  }
}

var photoGridSquare;

(window.onhashchange = function() {
  var newRange = location.hash.match(/#\/([0-9]+-[0-9]+)/);
  if(newRange && newRange[1] !== indexRange) {
    location.reload();
  } else {
    var prevImg = fullsizeA.children[0];
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
