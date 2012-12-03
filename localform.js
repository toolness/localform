"use strict";

var Localform = (function() {
  var Localform = {};
  var KEY_NAME = "LF_results";
  var THANKS_MSG = "Thanks for your submission!";

  function setData(results) {
    try {
      localStorage[KEY_NAME] = JSON.stringify(results);
    } catch (e) {}
  }
  
  window.addEventListener("submit", function(event) {
    var inputs = event.target.querySelectorAll("input");
    var result = {};
    var results = Localform.getData();
    [].slice.call(inputs).forEach(function(input) {
      if (!input.id)
        return;
      if (input.type == "text" || input.type == "textarea")
        result[input.id] = input.value;
      if (input.type == "checkbox" || input.type == "radio")
        result[input.id] = input.checked;
    });
    results.push(result);
    setData(results);
    alert(THANKS_MSG);
  }, true);
  
  Localform.getData = function() {
    var results;
    try {
      results = JSON.parse(localStorage[KEY_NAME]);
    } catch (e) {}
    if (!Array.isArray(results))
      results = [];
    return results;
  };
  
  Localform.resetData = function() {
    setData([]);
  };
  
  return Localform;
})();
