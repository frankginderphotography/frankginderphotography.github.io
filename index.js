var photos = [];
var indexRange = location.hash.match(/#\/([0-9]+-[0-9]+)/) || ['','0-19'];
var firstIndex = +indexRange[1].split('-')[0];
var lastIndex = +indexRange[1].split('-')[1];

for(var i = firstIndex; i <= lastIndex; i++) {
  var id = 'photo_' + i;
  var src = 'photos/' + id + '.jpg';
  photos.push({ src: src, id: id });
}

njn.controller('photos', {  photos: photos });

var showcase = document.getElementById('showcase');
var leftClick = document.getElementById('left-click');
var rightClick = document.getElementById('right-click');

var resizeImg = function(img) {
  if(window.innerHeight > window.innerWidth) {
    img.width = window.innerWidth;
    img.style.height = 'auto';
  } else {
    img.height = window.innerHeight;
    img.width.height = 'auto';
  }
  img.style.left = (window.innerWidth - img.width) / 2 + 'px';
  leftClick.style.left = parseInt(img.style.left) - 50 + 'px';
  rightClick.style.left = parseInt(img.style.left) + img.width + 'px';
};

(window.onresize = function() {
  var img = showcase.lastChild;
  if(img.tagName === 'IMG') resizeImg(img);
  showcase.style.width = window.innerWidth + 'px';
  showcase.style.height = window.innerHeight + 'px';
})();

(window.onhashchange = function() {
  var prevImg = showcase.lastChild;
  var photoId = location.hash.match(/photo_[0-9]+$/);
  if(photoId) {
    var img = document.getElementById(photoId[0]).cloneNode();
    img.id = '';
    prevImg.tagName === 'IMG' ? showcase.replaceChild(img, prevImg) : showcase.appendChild(img);
    img.className = 'fullsize';
    showcase.style.display = 'block';
    resizeImg(img);
    var photoNumber = +photoId[0].match(/[0-9]+/)[0];
    var prevIndex = photoNumber > firstIndex ? photoNumber - 1 : lastIndex;
    leftClick.getElementsByTagName('a')[0].href = '#/photo_' + prevIndex;
    var nextIndex = photoNumber < lastIndex ? photoNumber + 1 : firstIndex;
    rightClick.getElementsByTagName('a')[0].href = '#/photo_' + nextIndex;
  } else {
    showcase.style.display = 'none';
  }
})();
