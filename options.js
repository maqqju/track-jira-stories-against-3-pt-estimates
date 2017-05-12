var NEW_ROW = '<div class="row"><div class="cell taskKey"><input type="text" data-type="taskId" placeholder="Enter task id here:"/></div><div class="cell estimates"><input data-type="e" type="text" placeholder="Weighted Average"/><input type="text" data-type="sd" placeholder="Standard Deviation"/></div><div class="cell certainty"><input type="radio" name="CERTAINTY_GROUP" value="95"> 95% <br/><input type="radio" name="CERTAINTY_GROUP" value="99"> 99.7% <br/></div><div class="cell"><a href><i class="fa fa-2x fa-minus"></i></a></div></div>';
var WEIGHTED_AVERAGE = 'e';
var STANDARD_DEVIATION = 'sd';
var TASK_ID = 'taskId';
var CERTAINTY_GROUP_PLACEHOLDER = "CERTAINTY_GROUP";

function removeRow(rowId, e) {
	e.preventDefault();
	e.srcElement.removeEventListener('click', this);
	var _row = document.getElementById(rowId);
	_row.parentElement.removeChild(_row);
}

function getNewIndex() {
	var _i = sessionStorage.getItem('i');
	if (_i >= 0) {
		_i++;
	} else {
		_i = 0;
	}

	sessionStorage.setItem('i',_i);
	return _i;
}

function createRow(taskId, sd, wa, certainty) {
	var rowIndex = getNewIndex();
	var rowId = 'row-'+ rowIndex;
	var newDiv = document.createElement('div');
	newDiv.innerHTML = NEW_ROW.replace(new RegExp(CERTAINTY_GROUP_PLACEHOLDER,'g'), rowId+'-certainty');
	var newRow = newDiv.firstChild;
	newRow.dataset.row = rowIndex;
	newRow.id = rowId;
	newRow.getElementsByTagName('a')[0].addEventListener('click', removeRow.bind(null, rowId));

	var _inputs = newRow.getElementsByTagName('input');

	if (taskId && sd && wa && certainty) {
		for (var i = 0; i < _inputs.length; i++) {
			switch (_inputs[i].dataset.type) {
				case WEIGHTED_AVERAGE :
					_inputs[i].value = wa;
					break;
				case TASK_ID :
					_inputs[i].value = taskId;
					break;
				case STANDARD_DEVIATION :
					_inputs[i].value = sd;
					break;
				default :
					if (_inputs[i].type === 'radio') {
						_inputs[i].checked = _inputs[i].value === certainty;
					}
			}
		};
	}
	
	return newRow;
}

function main() {

	chrome.storage.sync.get('jiraUrl', (items) => {
		if (items.jiraUrl) {
			document.getElementById('jiraUrl').value = items.jiraUrl;
		}
	});
	chrome.storage.sync.get('tasks', (items) => {
		if (items.tasks && items.tasks.length) {
			var rowsPlaceHolder = document.getElementById('rows');
			var _rows = items.tasks.map((_rd) => {
				return createRow(_rd.taskId, _rd.standardDeviation, _rd.weightedAverage, _rd.certainty);
			}).forEach((_r) => {
				rowsPlaceHolder.appendChild(_r);
			});
		}
	});

	document.getElementById('newrow').addEventListener('click', (e) => {
		var newRow = createRow();
		document.getElementById('rows').appendChild(newRow);
		e.preventDefault();
	});

	document.getElementById('save').addEventListener('click', (e) => {
		var _rows = [].slice.call(document.getElementsByClassName('row'));
		var _newTasks = _rows.map((r) => {
			var _rowData = {};

			var _inputs = [].slice.call(r.getElementsByTagName('input'));

			_inputs.forEach((el,i) => {
				switch (el.dataset.type) {
					case WEIGHTED_AVERAGE :
						_rowData.weightedAverage = el.value;
						break;
					case TASK_ID : 
						_rowData.taskId = el.value;
						break;
					case STANDARD_DEVIATION : 
						_rowData.standardDeviation = el.value;
						break;
					default :
						if (el.type === 'radio' && el.checked) {
							_rowData.certainty = el.value;
						}
						break;
				}
			});

			return _rowData;
		}).filter((_rd) => {
			return _rd.weightedAverage && _rd.taskId && _rd.standardDeviation && _rd.certainty;
		});

		var _jiraUrl = document.getElementById('jiraUrl').value;

		chrome.storage.sync.set({
			jiraUrl : _jiraUrl,
			tasks : _newTasks
		}, () => {
	    // Update status to let user know options were saved.
	    var status = document.getElementById('status');
	    status.textContent = 'Options saved.';
	    setTimeout(function() {
	      status.textContent = '';
	    }, 750);
	  })

	});

	return;
}

document.addEventListener('DOMContentLoaded', main);