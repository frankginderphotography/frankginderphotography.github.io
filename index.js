// var max = number of photos on server
// break up into groups of twelve, returning strings like: '1-12', '31-42', etc:

var groups = [], max = 151;

for(var i = 1, j = 1; i <= max; i++) {
  if(i - j === 11 || i === max) {
    groups.push(j + '-' + i);
    j = i + 1;
  }
}

njn.controller('sidebar', { groups: groups });

var photos = [];
var indexRange = (location.hash.match(/#\/([0-9]+-[0-9]+)/) || ['','1-12'])[1];
var showcase = document.getElementsByClassName('showcase')[0];
var photoFloater = document.getElementsByClassName('photo-floater')[0];
var fullsizeA = document.getElementsByClassName('fullsize-a')[0];

fullsizeA.href = '#/' + indexRange;
document.getElementsByClassName('leave-showcase')[0].children[0].href = '#/' + indexRange;

var firstIndex = +indexRange.split('-')[0];
var lastIndex = +indexRange.split('-')[1];

for(var i = firstIndex; i <= lastIndex; i++) {
  var id = 'photo_' + i;
  var src = 'photos/' + id + '.jpg';
  var href = '#/' + indexRange + '/' + id;
  var thumbnail = 'thumbnails/' + id + '.png';
  photos.push({ src: src, id: id, href: href, thumbnail: thumbnail, photoInd: i - firstIndex });
}

njn.controller('photo-gallery', {  photos: photos });

var loaded = {};

function loadFullSizeImg(photo, i) {
  var fullsize = loaded[photo.src];
  if(!fullsize) {
    fullsize = new Image();
    fullsize.src = photo.src;
    fullsize.className = 'fullsize';
    loaded[photo.src] = fullsize;
  }
  if(!i) {
    var prevImg = showcase.getElementsByClassName('fullsize')[0];
    fullsizeA.replaceChild(fullsize, prevImg);
    showcase.style.display = 'block';
  } else if(i === 1) {
    document.getElementById('right-click').href = photo.href;
  } else if(i === -1) {
    document.getElementById('left-click').href = photo.href;
  }
}

var photoGridSquare;

(window.onhashchange = function() {
  var newRange = location.hash.match(/#\/([0-9]+-[0-9]+)/);
  if(newRange && newRange[1] !== indexRange) {
    location.reload(true);
  } else {
    var prevImg = fullsizeA.children[0];
    var photoId = location.hash.match(/photo_[0-9]+$/);
    if(photoGridSquare) photoGridSquare.className = 'photo-grid-square';
    if(photoId) {
      photoGridSquare = document.querySelector('.photo-grid-square:hover');
      if(photoGridSquare) photoGridSquare.className = 'photo-grid-square-behind';
      var thumbnail = document.getElementById(photoId);
      var photoIndex = +photoId[0].match(/[0-9]+/)[0];
      var startIndex = +thumbnail.dataset.photoindex;
      for(var i = 0, diffs = [0, 1, -1, 2, -2]; i < 5; i++) {
        var currIndex = (startIndex + diffs[i]) % photos.length;
        var currPhoto = photos.slice(currIndex)[0];
        loadFullSizeImg(currPhoto, diffs[i]);
      }
    } else {
      showcase.style.display = 'none';
    }
  }
})();
