$(document).ready(function(){
  $('.menu-icon').on('click', function() {
    $(this).toggleClass('active');
  });

  $('.menu-icon').on('click', function() {
    $('.sidebar').toggleClass('toggle');
  });
});
