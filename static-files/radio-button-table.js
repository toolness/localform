$(window).ready(function() {
  $('[data-role="radio-button-table"]').each(function() {
    var table = $('<table><tr><th></th></tr></table>');
    var headerRow = $('tr', table);
    var answers = $('.answers li', this);
    table.attr("class", $(this).attr("class"));
    answers.each(function() {
      $('<th></th>').text($(this).text())
        .appendTo(headerRow);
    });
    $('.questions li', this).each(function() {
      var row = $('<tr></tr>').appendTo(table);
      var baseId = $(this).attr("id");
      $('<td></td>').text($(this).text())
        .appendTo(row);
      answers.each(function(i) {
        var id = baseId + "_" + (i+1);
        var input = $('<input type="radio">')
          .attr("name", baseId)
          .attr("value", i+1)
          .attr("id", id);
        $('<td></td>').append(input).appendTo(row);
      });
    });
    $(this).replaceWith(table);
  });
});
