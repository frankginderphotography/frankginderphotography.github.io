angular.module('homePage', [])
  .directive('fginderNavbar', function() {
    return {
      link: function(scope, element) {
        element.width($(window).width() - 20);
      }
    };
  })
  .directive('fginderPhotoContainer', function() {
    return {
      link: function(scope, element) {
        element.height($(window).height() - 100);
      }
    };
  })
  .directive('fginderFullsize', function() {
    return {
      link: function(scope, element) {
        element.css('max-width', $(window).width());
      }
    };
  })
  .directive('fginderImageCover', function() {
    return {
      link: function(scope, element) {
        element[0].oncontextmenu = function(e) {
          e.preventDefault();
        }
      }
    };
  })
  .controller('photoController', ['$scope', function($scope) {
    $scope.photos = [
      'black_white_street',
      'black_white_alley',
      'brick_warehouse',
      'graffiti_shed'
    ];
  }]);

window.resize = location.reload;
document.body.onorientationchange = function() { location.reload(); }
