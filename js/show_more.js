$(document).ready(function () {
  $('.load-more').click(function (e) {
    $('.photo-listing li:nth-child(n + 12)').nextAll().addClass('active');
    $(this).addClass('hide');
  });
});
