var photos = [];
var firstId = 0;
var lastId = 19;

for(var i = 0; i + firstId <= lastId; i++) {
  var src = 'photos/photo_' + (i + firstId) + '.jpg';
  var id = src.match(/\/(\w+)\./)[1];
  photos.push({ src: src, id: id });
}

njn.controller('photos', {
  photos: photos
});

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
  var photoId = location.hash.match(/[^#\/]+/);
  if(photoId) {
    var img = document.getElementById(photoId[0]).cloneNode();
    prevImg.tagName === 'IMG' ? showcase.replaceChild(img, prevImg) : showcase.appendChild(img);
    img.className = 'fullsize';
    showcase.style.display = 'block';
    resizeImg(img);
    var photoNumber = +photoId[0].match(/[0-9]+/)[0];
    var prevId = photoNumber > firstId ? photoNumber - 1 : lastId;
    leftClick.getElementsByTagName('a')[0].href = '#/photo_' + prevId;
    var nextId = photoNumber < lastId ? photoNumber + 1 : firstId;
    rightClick.getElementsByTagName('a')[0].href = '#/photo_' + nextId;
  } else {
    showcase.style.display = 'none';
  }
})();
