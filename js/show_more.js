$(document).ready(function () {
  $('.load-more').on('click', function () {
    var $hiddenItems = $('.photo-listing li:nth-child(n + 13):not(.active)');

    if (!$hiddenItems.length) {
      return;
    }

    $hiddenItems.addClass('active');
    $(this).addClass('hide');

    var $firstNewItem = $hiddenItems.first();
    $('html, body').animate({
      scrollTop: $firstNewItem.offset().top - 20
    }, 600);
  });
});
