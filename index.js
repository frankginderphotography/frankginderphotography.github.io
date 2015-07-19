njn.controller('sidebar', {
  groups: [
    '1-12', '13-24', '25-36', '37-48', '49-60', '61-72', '73-84', '85-96', '97-108', '109-120', '121-123'
  ]
});

var photos = [];
var indexRange = (location.hash.match(/#\/([0-9]+-[0-9]+)/) || ['','1-12'])[1];
document.getElementById('leave-showcase').children[0].href = '#/' + indexRange;
var firstIndex = +indexRange.split('-')[0];
var lastIndex = +indexRange.split('-')[1];

for(var i = firstIndex; i <= lastIndex; i++) {
  var id = 'photo_' + i;
  var src = 'photos/' + id + '.jpg';
  var href = '#/' + indexRange + '/' + id;
  photos.push({ src: src, id: id, href: href });
}

njn.controller('photo-gallery', {  photos: photos });

[].forEach.call(document.getElementsByClassName('thumbnail'), function detectPortrait(thumbnail) {
  if(thumbnail.clientHeight && thumbnail.clientWidth && thumbnail.clientHeight !== thumbnail.clientWidth) {
    if(thumbnail.clientHeight > thumbnail.clientWidth) thumbnail.className = 'thumbnail-portrait';
  } else {
    window.setTimeout(detectPortrait.bind(null, thumbnail), 500);
  }
});

var showcase = document.getElementById('showcase');
var photoFloater = document.getElementById('photo-floater');
var leftClick = document.getElementById('left-click');
var rightClick = document.getElementById('right-click');

var resizeImg = function(img) {
  if(img.clientWidth) {
    (function detectWidthHeight(portrait) {
      if(portrait) {
        img.width = window.innerWidth - 104;
        img.removeAttribute('height');
        if(img.height < window.innerHeight) {
          img.style.top = (window.innerHeight - img.height) / 2 + 'px';
        } else {
          detectWidthHeight(false);
        }
      } else {
        img.height = window.innerHeight;
        img.removeAttribute('width');
        if(img.width < window.innerWidth - 103) {
          img.style.top = '0px';
        } else {
          detectWidthHeight(true);
        }
      }
    })(window.innerHeight > window.innerWidth);
    photoFloater.style.width = img.width + 105 + 'px';
    photoFloater.style.height = img.height - 2 + 'px';
  } else {
    window.setTimeout(resizeImg.bind(null, img), 500);
  }
}

var photoGridSquare;

(window.onhashchange = function() {
  var newRange = location.hash.match(/#\/([0-9]+-[0-9]+)/);
  if(newRange && newRange[1] !== indexRange) {
    location.reload(true);
  } else {
    var prevImg = photoFloater.children[1];
    var photoId = location.hash.match(/photo_[0-9]+$/);
    if(photoGridSquare) photoGridSquare.className = 'photo-grid-square';
    if(photoId) {
      var img = document.getElementById(photoId[0]);
      photoGridSquare = img.parentElement.parentElement.parentElement.parentElement;
      photoGridSquare.className = 'photo-grid-square-behind';
      var clone = img.cloneNode();
      clone.id = '';
      prevImg.tagName === 'IMG' ?
        photoFloater.replaceChild(clone, prevImg) :
        photoFloater.insertBefore(clone, rightClick);
      clone.className = 'fullsize';
      showcase.style.display = 'block';
      resizeImg(clone);
      var photoNumber = +photoId[0].match(/[0-9]+/)[0];
      var prevIndex = photoNumber > firstIndex ? photoNumber - 1 : lastIndex;
      leftClick.getElementsByTagName('a')[0].href = '#/' + indexRange + '/photo_' + prevIndex;
      var nextIndex = photoNumber < lastIndex ? photoNumber + 1 : firstIndex;
      rightClick.getElementsByTagName('a')[0].href = '#/' + indexRange + '/photo_' + nextIndex;
    } else {
      showcase.style.display = 'none';
    }
  }
})();

(window.onresize = function() {
  var img = photoFloater.children[1];
  if(img.tagName === 'IMG') resizeImg(img);
  showcase.style.width = window.innerWidth + 'px';
  showcase.style.height = window.innerHeight + 'px';
})();
