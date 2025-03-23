package models

import (
	"github.com/shopspring/decimal"

	"github.com/aceberg/ExerciseDiary/internal/auth"
)

// Conf - web gui config
type Conf struct {
	Host      string
	Port      string
	Theme     string
	Color     string
	Icon      string
	DBPath    string
	DirPath   string
	ConfPath  string
	NodePath  string
	HeatColor string
	PageStep  int
	Auth      bool
}

// Exercise - one exercise
type Exercise struct {
	ID        int             `db:"ID"`
	Group     string          `db:"GR"`
	Place     string          `db:"PLACE"`
	Name      string          `db:"NAME"`
	Descr     string          `db:"DESCR"`
	Image     string          `db:"IMAGE"`
	Color     string          `db:"COLOR"`
	Weight    decimal.Decimal `db:"WEIGHT"`
	Reps      int             `db:"REPS"`
	Intensity int             `db:"INTENSITY"`
}

// Set - one set
type Set struct {
	ID           int             `db:"ID" json:"ID"`
	Date         string          `db:"DATE" json:"Date"`
	Name         string          `db:"NAME" json:"Name"`
	Color        string          `db:"COLOR" json:"Color"`
	WorkoutColor string          `db:"WORKOUT_COLOR" json:"WorkoutColor"`
	Weight       decimal.Decimal `db:"WEIGHT" json:"Weight"`
	Reps         int             `db:"REPS" json:"Reps"`
	Intensity    int             `db:"INTENSITY" json:"Intensity"`
}

// AllExData - all sets and exercises
type AllExData struct {
	Exs    []Exercise
	Sets   []Set
	Weight []BodyWeight
}

// HeatMapData - data for HeatMap
type HeatMapData struct {
	X                  string   `json:"X"`
	Y                  string   `json:"Y"`
	D                  string   `json:"D"`
	V                  int      `json:"V"`
	Color              string   `json:"Color"`
	Colors             []string `json:"Colors"`
	WorkoutNames       []string `json:"WorkoutNames"`       // Names of workouts
	WorkoutIntensities []int    `json:"WorkoutIntensities"` // Intensity of each workout
	WorkoutWeights     []string `json:"WorkoutWeights"`     // Weight used for each workout
	WorkoutReps        []int    `json:"WorkoutReps"`        // Reps for each workout
}

// BodyWeight - store weight
type BodyWeight struct {
	ID     int             `db:"ID"`
	Date   string          `db:"DATE"`
	Weight decimal.Decimal `db:"WEIGHT"`
}

// GuiData - web gui data
type GuiData struct {
	Config           Conf
	Themes           []string
	ExData           AllExData
	GroupMap         map[string]string
	OneEx            Exercise
	IntensityHeatMap []HeatMapData
	ColorHeatMap     []HeatMapData
	Version          string
	Auth             auth.Conf
}
