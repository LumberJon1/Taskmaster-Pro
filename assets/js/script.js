var tasks = {};

var auditTasks = function(taskEl) {
  date = $(taskEl).find("span").text().trim();

  //Convert date to a moment.js object
  var time = moment(date, "L").set("hour", 17);

  //Remove any previously-applied styles
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");

  //Apply a new class if the task is approaching due or overdue
  if (moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
  }
  //Check if we are within 2 days of the task due date and apply warning styling.
  else if (Math.abs(moment().diff(time, "days")) <= 2) {
    $(taskEl).addClass("list-group-item-warning");
  }
};

var createTask = function(taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  //Check dueDate
  auditTasks(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function() {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function(list, arr) {
    // then loop over sub-array
    arr.forEach(function(task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

//Event listener for the <p> tag that changes the element to a textArea
$(".list-group").on("click", "p", function() {
  var text = $(this).text().trim();

  var textInput = $("<textarea>")
    .addClass("form-control")
    .val(text);
  $(this).replaceWith(textInput);

  textInput.trigger("focus");

});

//Event listener that triggers on blur, or when the target is unfocused, changing back to <p>
$(".list-group").on("blur", "textarea", function() {
  //Get the textValue of the element
  var text = $(this).val().trim();

  //Get parent <ul> element id
  var status = $(this).closest(".list-group")
    .attr("id")
    .replace("list-", "");

  //get task position in the list of other <li> elements
  var index = $(this)
    .closest(".list-group-item")
    .index();

  tasks[status][index].text = text;
  saveTasks();

  //recreate and load the p element
  var taskP = $("<p>").addClass("m-1").text(text);
  $(this).replaceWith(taskP);

});

//Event listener for editing task dates
$(".list-group").on("click", "span", function() {
  //get current text
  var date = $(this).text().trim();

  //create new input element
  var dateInput = $("<input>")
    .attr("type", "text")
    .addClass("form-control")
    .val(date);

  //swap elements
  $(this).replaceWith(dateInput);

  //Enable jQuery UI Datepicker
  dateInput.datepicker({
    minDate: 1,
    onClose: function() {
      $(this).trigger("change");
    }
  });

  //Focus on new element
  dateInput.trigger("focus");
});

//Event listener to handle change of date form
$(".list-group").on("change", "input[type='text']", function() {
  //get current text
  var date = $(this).val().trim();

  //get parent ul id attribute
  var status = $(this).closest(".list-group").attr("id").replace("list-", "");

  //get current task's position in list of other li elements
  var index = $(this).closest(".list-group-item").index();

  //update task in array and save to localStorage
  tasks[status][index].date = date;
  saveTasks();

  //recreate span element and add bootstrap classes
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    //Replace the text with the value from input above
    .text(date);

  //replace input with span
  $(this).replaceWith(taskSpan);

  //Pass the task li element into the auditTask function and apply any new styles
  auditTasks($(taskSpan).closest(".list-group-item"));
});

//Make cards sortable
$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function(event) {
    $(this).addClass("dropover");
    $(".bottom-trash").addClass("bottom-trash-drag");
  },
  deactivate: function(event) {
    $(this).removeClass("dropover");
    $(".bottom-trash").removeClass("bottom-trash-drag");
  },
  over: function(event) {
    $(event.target).addClass("dropover-active");
  },
  out: function(event) {
    $(event.target).removeClass("dropover-active");
  },
  update: function(event) {
    var tempArr = [];

    //Find the text values of the date and task name for each list item
    $(this).children().each(function() {
      var text = $(this).find("p").text().trim();
      var date = $(this).find("span").text().trim();

      //Add those values to a temporary array
      tempArr.push({
        text: text,
        date: date
      });
    });

    //Find the list within the global tasks array to save the updates to
    var arrName = $(this).attr("id").replace("list-", "");

    //Replace values in global array with the temporary array values and save tasks
    tasks[arrName] = tempArr;
    saveTasks();
  }
});

//Drop to trash function
$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function(event, ui) {
    ui.draggable.remove();
    $(".bottom-trash").removeClass("bottom-trash-active");
  },
  over: function(event, ui) {
    $(".bottom-trash").addClass("bottom-trash-active");
  },
  out: function(event, ui) {
    $(".bottom-trash").removeClass("bottom-trash-active");
  }
});

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function() {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function() {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-save").click(function() {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});

$("#modalDueDate").datepicker({
  minDate: 1
});

// remove all tasks
$("#remove-tasks").on("click", function() {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// load tasks for the first time
loadTasks();

//Audit tasks every 30 minutes
setInterval(function() {
  $(".card .list-group-item").each(function(index, el) {
    auditTasks(el);
  });
}, (1000 * 60) * 30);