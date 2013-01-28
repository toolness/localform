"use strict";

var Localform = (function() {
  var Localform = {};
  var RESULTS_KEY_NAME = "LF_results";
  var THANKS_MSG = "Thanks for your submission!";
  var STORAGE_ERR_MSG = "FATAL ERROR: Unable to store data locally!";

  function csvLine(items) {
    return items.map(function(item) {
      if (typeof(item) == "string") {
        if (item.indexOf(",") != -1 || item.indexOf("\n") != -1) {
          item = '"' + item.replace(/"/g, '""') + '"';
        }
      } else if (typeof(item) == "boolean") {
        if (item)
          item = "1";
        else
          item = "";
      }
      return item;
    }).join(',');
  }
  
  function getJsonStorage(key, defaultResult) {
    var result = defaultResult;
    try {
      result = JSON.parse(localStorage[key]);
    } catch (e) {}
    return result;
  }
  
  function setJsonStorage(key, value) {
    try {
      localStorage[key] = JSON.stringify(value);
    } catch (e) {
      alert(STORAGE_ERR_MSG);
      throw e;
    }
  }
  
  Localform.restoreForm = function(form, data) {
    var inputs = form.querySelectorAll("input");
    [].slice.call(inputs).forEach(function(input) {
      if (!input.id)
        return;
      if (input.type == "text" || input.type == "textarea")
        input.value = data[input.id];
      if (input.type == "checkbox")
        input.checked = data[input.id];
      if (input.type == "radio")
        input.checked = (data[input.name] == input.value);
    });
  };
  
  Localform.saveForm = function(form) {
    var inputs = form.querySelectorAll("input");
    var result = {};
    [].slice.call(inputs).forEach(function(input) {
      if (!input.id)
        return;
      if (input.type == "text" || input.type == "textarea")
        result[input.id] = input.value;
      if (input.type == "checkbox")
        result[input.id] = input.checked;
      if (input.type == "radio") {
        if (!(input.name in result)) {
          result[input.name] = "";
        }
        if (input.checked)
          result[input.name] = input.value;
      }
    });
    return result;
  };
  
  window.addEventListener("submit", function(event) {
    var results = Localform.getData();
    results.push(Localform.saveForm(event.target));
    setJsonStorage(RESULTS_KEY_NAME, results);
    alert(THANKS_MSG);
    event.preventDefault();
    event.target.reset();
  }, true);
  
  Localform._testing = {
    csvLine: csvLine
  };
  
  Localform.getDataAsCSV = function() {
    var lines = [];
    var keys = null;
    this.getData().forEach(function(result) {
      if (!keys) {
        keys = Object.keys(result);
        keys.sort();
        lines.push(csvLine(keys));
      }
      lines.push(csvLine(keys.map(function(key) { return result[key]; })));
    });
    return lines.join("\n");
  };
  
  Localform.getData = function() {
    var results = getJsonStorage(RESULTS_KEY_NAME);
    if (!Array.isArray(results))
      results = [];
    return results;
  };
  
  Localform.resetData = function() {
    setJsonStorage(RESULTS_KEY_NAME, []);
  };
  
  (function sanityCheck() {
    try {
      var random = Math.random().toString();
      setJsonStorage("LF_sanitycheck", {random: random});
      if (getJsonStorage("LF_sanitycheck").random != random) {
        throw new Error("sanity check failure");
      }
    } catch (e) {
      alert(STORAGE_ERR_MSG);
    }
  })();
  
  return Localform;
})();
