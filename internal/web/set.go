package web

import (
	// "log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"

	"github.com/aceberg/ExerciseDiary/internal/db"
	"github.com/aceberg/ExerciseDiary/internal/models"
)

func setHandler(c *gin.Context) {

	var formData []models.Set
	var oneSet models.Set
	var reps int
	var intensity int
	var weight decimal.Decimal

	_ = c.PostFormMap("sets")

	formMap := c.Request.PostForm
	// log.Println("MAP:", formMap)

	formLen := len(formMap["name"])
	// log.Println("LEN:", formLen)
	date := formMap["date"][0]

	for i := 0; i < formLen; i++ {
		oneSet.Date = date
		oneSet.Name = formMap["name"][i]
		weight, _ = decimal.NewFromString(formMap["weight"][i])
		reps, _ = strconv.Atoi(formMap["reps"][i])
		intensity, _ = strconv.Atoi(formMap["intensity"][i])
		oneSet.Weight = weight
		oneSet.Reps = reps
		oneSet.Intensity = intensity
		// Set default color if not provided
		if workoutColors, ok := formMap["workout_color"]; ok && i < len(workoutColors) {
			oneSet.WorkoutColor = workoutColors[i]
		} else {
			oneSet.WorkoutColor = "#03a70c" // Default color
		}

		formData = append(formData, oneSet)
	}

	db.BulkDeleteSetsByDate(appConfig.DBPath, date)
	db.BulkAddSets(appConfig.DBPath, formData)
	exData.Sets = db.SelectSet(appConfig.DBPath)

	// log.Println("FORM DATA:", formData)

	c.Redirect(http.StatusFound, "/")
}
