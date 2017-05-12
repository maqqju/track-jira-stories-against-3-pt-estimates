function initExtension() {
	chrome.storage.sync.get('jiraUrl', (items) => {
		sessionStorage.setItem('jiraUrl', items.jiraUrl);

		chrome.storage.sync.get('tasks', (items) => {
			items.tasks && drawGraph(items.tasks);
		});
	});
}

function getJiraUrl(keys) {
	var jiraUrl = sessionStorage.getItem('jiraUrl');
	return jiraUrl + '?jql=key%20in%20(' + keys.join(',') + ')';
}

function drawGraph(tasks) {
	var e = {
		x : [],
		y : [],
		name : 'E',
		type : 'bar',
		marker: {
			color : 'green'
		}
	};

	var sd1 = {
		x : [],
		y : [],
		name : 'SD1',
		type : 'bar',
		marker: {
			color : 'yellow'
		}
	};
	var sd2 = {
		x : [],
		y : [],
		name : 'SD2',
		type : 'bar',
		marker: {
			color : 'orange'
		}
	};

	var sd3 = {
		x : [],
		y : [],
		name : 'SD3',
		type : 'bar',
		marker: {
			color : 'red'
		}
	};


	tasks.forEach((t,i) => {
		e.x.push(t.taskId);
		e.y.push(t.weightedAverage);

		sd1.x.push(t.taskId);
		sd1.y.push(t.standardDeviation);

		sd2.x.push(t.taskId);
		sd2.y.push(t.standardDeviation);

		t.certainty === '99' && sd3.x.push(t.taskId) && sd3.y.push(t.standardDeviation);
	});

	var data = [e,sd1,sd2,sd3];

	var layout = {
		barmode: 'stack',
		xaxis: {
			title : 'User Stories'
		},
		yaxis: {
			title : 'Time in seconds'
		}
	};

	$.ajax({
		type: 'GET',
		url : getJiraUrl(tasks.map((_t) => _t.taskId)),
		dataType: 'json',
		async: false,
		crossDomain: true,
		success: (d) => {
			var scatterPlot = {
				x: d.issues.map((_issue) => _issue.key),
				y: d.issues.map((_issue) => _issue.fields.timespent),
				mode: 'markers',
				type: 'scatter',
				text: d.issues.map((_issue) => _issue.fields.status.name),
				marker: {
					size: 12,
					color: 'black'
				}
			}

			data.push(scatterPlot);
			Plotly.newPlot(document.getElementById('graphs'), data, layout);
		}

	});

}


document.addEventListener('DOMContentLoaded', function() { 
	initExtension();
});