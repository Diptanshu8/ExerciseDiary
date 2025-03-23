package web

import (
	// "log"
	"strconv"
	"time"

	"github.com/aceberg/ExerciseDiary/internal/models"
)

// HeatMapResult contains both intensity and color heatmaps
type HeatMapResult struct {
	IntensityMap []models.HeatMapData
	ColorMap     []models.HeatMapData
}

// WorkoutData stores colors and names for workouts on a specific date
type WorkoutData struct {
	Colors []string
	Names  []string
}

func generateHeatMap() HeatMapResult {
	var intensityMap []models.HeatMapData
	var colorMap []models.HeatMapData
	var heat models.HeatMapData

	w := 52 // weeks to show

	max := time.Now()
	min := max.AddDate(0, 0, -7*w)

	startDate := weekStartDate(min)
	countMap := countHeat()
	workoutData := getWorkoutData()

	dow := []string{"Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"}

	for _, day := range dow {
		heat.Y = day

		for i := 0; i < w+1; i++ {
			heat.X = strconv.Itoa(i)
			heat.D = startDate.AddDate(0, 0, 7*i).Format("2006-01-02")

			// Add to intensity map
			heat.V = countMap[heat.D]
			intensityMap = append(intensityMap, heat)

			// Add to color map with all workout colors and names
			if data, exists := workoutData[heat.D]; exists {
				heat.V = len(data.Colors)
				heat.Colors = data.Colors
				heat.WorkoutNames = data.Names
				colorMap = append(colorMap, heat)
			} else {
				// Always add the cell to the color map, even without workouts
				heat.V = 0
				heat.Colors = []string{}
				heat.WorkoutNames = []string{}
				colorMap = append(colorMap, heat)
			}
		}

		startDate = startDate.AddDate(0, 0, 1)
	}

	return HeatMapResult{
		IntensityMap: intensityMap,
		ColorMap:     colorMap,
	}
}

func weekStartDate(date time.Time) time.Time {
	offset := (int(time.Monday) - int(date.Weekday()) - 7) % 7
	result := date.Add(time.Duration(offset*24) * time.Hour)
	return result
}

func countHeat() map[string]int {
	countMap := make(map[string]int)

	for _, ex := range exData.Sets {
		// Default intensity is 0, hence add 1 for basic heatmap
		countMap[ex.Date] += ex.Intensity + 1
	}

	return countMap
}

func getWorkoutData() map[string]WorkoutData {
	workoutMap := make(map[string]WorkoutData)

	for _, set := range exData.Sets {
		date := set.Date
		if set.WorkoutColor != "" {
			if _, exists := workoutMap[date]; !exists {
				workoutMap[date] = WorkoutData{
					Colors: []string{},
					Names:  []string{},
				}
			}

			data := workoutMap[date]
			data.Colors = append(data.Colors, set.WorkoutColor)
			data.Names = append(data.Names, set.Name)
			workoutMap[date] = data
		}
	}

	return workoutMap
}
