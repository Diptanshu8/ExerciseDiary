var id = 0;
var today = null;

function addExercise(name, weight, reps, intensity, color) {
    id = id + 1;
    var table = document.getElementById("todayEx");
    var row = table.insertRow(-1);
    
    // Name cell
    var cell1 = row.insertCell(0);
    cell1.innerHTML = `
        <input type="text" class="form-control" name="name" value="${name}" readonly>
        <input type="hidden" name="weight" value="0">
        <input type="hidden" name="reps" value="0">
    `;
    
    // Intensity cell
    var cell2 = row.insertCell(1);
    cell2.innerHTML = `
        <input type="number" class="form-control" name="intensity" value="${intensity}" min="0" max="10">
    `;
    
    // Color cell
    var cell3 = row.insertCell(2);
    cell3.innerHTML = `
        <input type="color" class="form-control form-control-color" name="workout_color" value="${color}">
    `;
    
    // Delete button cell
    var cell4 = row.insertCell(3);
    cell4.innerHTML = `
        <button class="btn del-set-button" onclick="this.parentElement.parentElement.remove();">
            <i class="bi bi-trash"></i>
        </button>
    `;
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
