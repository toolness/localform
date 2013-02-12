"use strict";

var Localform = (function() {
  var Localform = {
    storagePrefix: "",
    autostart: true
  };
  var RESULTS_KEY_NAME = "LF_results";
  var AUTOSAVE_KEY_NAME = "LF_autosave_result";
  var THANKS_MSG = "Thanks for your submission!";
  var STORAGE_ERR_MSG = "FATAL ERROR: Unable to store data locally!";
  var VALIDATION_ERR_MSG = "Please fill out all required fields.";
  var CONFIRM_FORM_RESET_MSG = "Clearing the form will remove all the data " +
                               "you've entered so far, and cannot be " +
                               "undone. Are you sure?";

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
      result = JSON.parse(localStorage[Localform.storagePrefix + key]);
    } catch (e) {}
    return result;
  }
  
  function setJsonStorage(key, value) {
    try {
      localStorage[Localform.storagePrefix + key] = JSON.stringify(value);
    } catch (e) {
      Localform.alert(STORAGE_ERR_MSG);
      throw e;
    }
  }
  
  function confirmFormReset(event) {
    if (!Localform.confirm(CONFIRM_FORM_RESET_MSG))
      return event.preventDefault();
    setJsonStorage(AUTOSAVE_KEY_NAME, {});
  }
  
  function onFormSubmit(event) {
    var results = Localform.getData();
    var result = Localform.saveForm(event.target);

    event.preventDefault();
    if (!event.target.checkValidity())
      return Localform.alert(VALIDATION_ERR_MSG);
    results.push(result);
    setJsonStorage(RESULTS_KEY_NAME, results);
    setJsonStorage(AUTOSAVE_KEY_NAME, {});

    Localform.submitJSON(result);
    Localform.alert(THANKS_MSG);
    event.target.removeEventListener("reset", confirmFormReset, true);
    event.target.reset();
    event.target.addEventListener("reset", confirmFormReset, true);
  }

  function inputIsTextlike(input) {
    return (input.type == "text" || input.type == "textarea" ||
            input.type == "email" || input.type == "number");
  }
  
  function sanityCheck() {
    try {
      var random = Math.random().toString();
      setJsonStorage("LF_sanitycheck", {random: random});
      if (getJsonStorage("LF_sanitycheck").random != random) {
        throw new Error("sanity check failure");
      }
    } catch (e) {
      Localform.alert(STORAGE_ERR_MSG);
    }
  }
  
  Localform.submitJSON = function(result, xhr) {
    var req = xhr || new XMLHttpRequest();
    req.open("POST", "/submit?bust=" + Date.now());
    req.setRequestHeader('Content-Type', 'application/json');
    req.send(JSON.stringify(result));
  };
  
  Localform.alert = function(msg) {
    window.alert(msg);
  };
  
  Localform.confirm = function(msg) {
    return window.confirm(msg);
  };
  
  Localform.restoreForm = function(form, data) {
    var inputs = form.querySelectorAll("input");
    [].slice.call(inputs).forEach(function(input) {
      if (!input.id)
        return;
      if (inputIsTextlike(input) && typeof(data[input.id]) == "string")
        input.value = data[input.id];
      if (input.type == "checkbox" && typeof(data[input.id] == "boolean"))
        input.checked = data[input.id];
      if (input.type == "radio" && typeof(data[input.name] == "string"))
        input.checked = (data[input.name] == input.value);
    });
  };
  
  Localform.saveForm = function(form) {
    var inputs = form.querySelectorAll("input");
    var result = {};
    [].slice.call(inputs).forEach(function(input) {
      if (!input.id)
        return;
      if (inputIsTextlike(input))
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

  window.addEventListener("DOMContentLoaded", function(event) {
    var forms;
    sanityCheck();
    if (Localform.autostart) {
      forms = document.getElementsByTagName("form");
      [].slice.call(forms).forEach(Localform.activateForm);
    }
  }, false);
  
  Localform._testing = {
    csvLine: csvLine,
    onFormSubmit: onFormSubmit
  };
  
  Localform.activateForm = function(form) {
    Localform.restoreForm(form, getJsonStorage(AUTOSAVE_KEY_NAME, {}));
    form.addEventListener("reset", confirmFormReset, true);
    form.addEventListener("change", function(event) {
      if (!event.target.form) return;
      var formData = Localform.saveForm(event.target.form);
      setJsonStorage(AUTOSAVE_KEY_NAME, formData);
    }, false);
    form.addEventListener("submit", onFormSubmit, true);
  };
  
  Localform.getDataAsCSV = function(data) {
    var lines = [];
    var keys = [];
    if (!data) data = this.getData();
    data.forEach(function(result) {
      Object.keys(result).forEach(function(key) {
        if (keys.indexOf(key) == -1) keys.push(key);
      });
    });
    keys.sort();
    lines.push(csvLine(keys));
    data.forEach(function(result) {
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
    setJsonStorage(AUTOSAVE_KEY_NAME, {});
  };
  
  return Localform;
})();
