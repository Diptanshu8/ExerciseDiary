var id = 0;
var today = null;

function addExercise(name, weight, reps, intensity, color) {
    id = id + 1;
    html_to_insert=`<tr id="${id}">
    <td>
        <input name="name" type="text" class="form-control" value="${name}">
    </td><td>
        <input name="weight" type="number" step="any" min="0" class="form-control" value="${weight}">
    </td><td>
        <input name="reps" type="number" min="0" class="form-control" value="${reps}">
    </td><td>
        <input name="intensity" type="number" min="0" class="form-control" value="${intensity}">
    </td><td>
        <input name="workout_color" type="color" class="form-control form-control-color" value="${color || '#03a70c'}">
    </td><td>
        <button class="btn del-set-button" type="button" title="Delete" onclick="delExercise(${id})">
            <i class="bi bi-x-square"></i>
        </button>
    </td></tr>`;

    document.getElementById('todayEx').insertAdjacentHTML('beforeend', html_to_insert);
};

function setFormContent(sets, date) {
    window.sessionStorage.setItem("today", date);
    today = date;
    document.getElementById('todayEx').innerHTML = "";
    document.getElementById("formDate").value = date;
    document.getElementById("realDate").value = date;

    // Update heatmap highlights
    if (window.intensityChart) {
        window.intensityChart.data.datasets[0].selectedDate = date;
        window.intensityChart.update();
    }
    if (window.colorChart) {
        window.colorChart.data.datasets[0].selectedDate = date;
        window.colorChart.update();
    }

    if (sets) {
        let len = sets.length;
        for (let i = 0 ; i < len; i++) {
            if (sets[i].Date == date) {
                addExercise(sets[i].Name, sets[i].Weight, sets[i].Reps, sets[i].Intensity, sets[i].WorkoutColor);
            }
        }
    }
};

function setFormDate(sets) {
    let date = window.sessionStorage.getItem("today");
    if (!date) {
        date = new Date().toISOString().split('T')[0];
    }
    setFormContent(sets, date);
};

function setWeightDate() {
    let date = document.getElementById("realDate").value;
    document.getElementById("weightDate").value = date;
};

function delExercise(exID) {
    document.getElementById(exID).remove();
};

function moveDayLeftRight(where, sets) {
    dateStr = document.getElementById("realDate").value;

    let year  = dateStr.substring(0,4);
    let month = dateStr.substring(5,7);
    let day   = dateStr.substring(8,10);
    var date  = new Date(year, month-1, day);

    date.setDate(date.getDate() + parseInt(where));
    let left = date.toLocaleDateString('en-CA');

    setFormContent(sets, left);
};

function addAllGroup(exs, gr) {
    if (exs) {
        let len = exs.length;
        for (let i = 0 ; i < len; i++) {
            if (exs[i].Group == gr) {
                addExercise(exs[i].Name, exs[i].Weight, exs[i].Reps, exs[i].Intensity);
            }
        }
    }
}
