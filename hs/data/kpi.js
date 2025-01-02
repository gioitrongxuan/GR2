// const lastKPIs = [
//   {
//     id: 1,
//     // KPI làm việc trong quá khứ của nhân viên có id = 1, kpiInTask[i]: hiệu suất của thằng id làm việc i trong quá khứ, nếu có giá trị khác 0
//     // = -1: đã làm và phải điều chỉnh (fail)
//     kpiInTask: [0, 0.8, 0.9, 0.9, 0.9,  0.7, 0, 0.7, 0.75, 0,  0.8, 0, 0.85, 0.9, 0,  0.9, 0.85, 0.8, 0.7]
//   },
//   {
//     id: 2,
//     kpiInTask: [0, 0.75, 0.85, 0.8, 0.8,  0.8, 0, 0.5, 0.8, 0.7,  0.7, 0, 0.8, 0.8, 0,  0.85, 0.9, 0.85, 0.8]
//   },
//   {
//     id: 3,
//     kpiInTask: [0, 0.75, 0.8, 0.7, 0.7, 0.8, 0.75, 0, 0.75, 0, 0.85, 0.85, 0, 0, -1, 0.7, 0.8, 0, 0.8]
//   },
//   {
//     id: 4,
//     kpiInTask: [0, 0, 0.75, 0.7, 0.6,  0, -1, 0.65, 0.6, 0.7,  0, 0, -1, 0, 0, 0, 0.75, 0.7, 0]
//   },
//   {
//     id: 5,
//     kpiInTask: [0, 0.65, 0, -1, 0,  0, 0.9, 0.95, 0, 0.9,  0, 0.8, 0, 0.7, 0.7,  0, 0, 0, 0]
//   },
//   {
//     id: 6,
//     kpiInTask: [0, 0.85, -1, 0, 0,  0, 0.8, 0.7, 0, 0.8,  0.75, 0.9, 0, 0.7, 0.8,  0, 0, 0, 0]
//   },
//   {
//     id: 7,
//     kpiInTask: [0, 0.8, 0.7, 0.8, 0.7,  0.7, 0, 0.8, 0.8, 0.65,  -1, 0, 0.75, 0.7, 0,  0.8, 0.85, 0.75, 0.8]
//   },
//   {
//     id: 8,
//     kpiInTask: [0, 0, 0, 0.7, 0.6, 0, 0, 0.65, 0, 0.7, 0, 0, 0, 0, 0, -1, 0.8, 0.7, 0.75]
//   },
  
// ]

const lastKPIs = [
  {
    id: 1,
    // KPI làm việc trong quá khứ của nhân viên có id = 1, kpiInTask[i]: hiệu suất của thằng id làm việc i trong quá khứ, nếu có giá trị khác 0
    // = -1: đã làm và phải điều chỉnh (fail)
    kpiInTask: [0, 0.9, 0.9, 0.95, 0.95,  0.8, 0, 0.8, 0.85, 0,  0.9, 0, 0.95, 0.95, 0,  0.95, 0.85, 0.9, 0.8]
  },
  {
    id: 2,
    kpiInTask: [0, 0.85, 0.95, 0.9, 0.9,  0.9, 0, 0.6, 0.9, 0.8,  0.8, 0, 0.9, 0.9, 0,  0.95, 0.95, 0.95, -1]
  },
  {
    id: 3,
    kpiInTask: [0, 0.85, 0.9, 0.8, 0.8, 0.9, 0, 0.9, 0.85, 0, 0, -1, 0.8, 0.9, 0, 0.9, 0.9, 0.85, 0]
  },
  {
    id: 4,
    kpiInTask: [0, 0, 0.85, 0.8, 0.7,  0, -1, 0.75, 0.7, 0.8,  0, 0, -1, 0, 0, 0, 0.85, -1, 0]
  },
  {
    id: 5,
    kpiInTask: [0, 0.75, 0, -1, 0,  0, 0.95, 0.95, 0, 0.95,  0, 0.9, 0, 0.8, 0.8,  0, 0, 0, 0, 0]
  },
  {
    id: 6,
    kpiInTask: [0, 0.95, -1, 0, 0,  0, 0.9, 0.8, 0, 0.9,  0.85, 0.95, 0, 0.8, 0.9,  0, 0, 0, 0]
  },
  {
    id: 7,
    kpiInTask: [0, -1, 0.85, 0.9, 0.8,  0.8, 0, 0.9, 0.9, 0,  0, 0, 0.85, 0.8, 0,  0.9, 0.95, 0.85, 0.9]
  },
  {
    id: 8,
    kpiInTask: [0, 0, 0, 0.8, 0.7, 0, 0, 0.75, 0, 0.8, 0, 0, 0, 0, 0, -1, 0.9, 0.8, 0.85, 0]
  },
  
]

// const lastKPIs = [
//   {
//     id: 1,
//     // KPI làm việc trong quá khứ của nhân viên có id = 1, kpiInTask[i]: hiệu suất của thằng id làm việc i trong quá khứ, nếu có giá trị khác 0
//     // = -1: đã làm và phải điều chỉnh (fail)
//     kpiInTask: [0, 0.9, 0.9, 0.95, 0.95,  0.8, 0, 0.8, 0.85, 0,  0.9, 0, 0.95, 0.95, 0,  0.95, 0.85, 0.9, 0.8]
//   },
//   {
//     id: 2,
//     kpiInTask: [0, 0.85, 0.95, 0.9, 0.9,  0.9, 0, 0.6, 0.9, 0.8,  0.8, 0, 0.9, 0.9, 0,  0.95, 0.95, 0.95, -1]
//   },
//   {
//     id: 3,
//     kpiInTask: [0, 0.85, 0.9, 0.8, 0.8, 0.9, 0, 0.9, 0.85, 0, 0, -1, 0.8, 0.9, 0, 0.9, 0.9, 0.85, 0]
//   },
//   {
//     id: 4,
//     kpiInTask: [0, 0, 0.85, 0.8, 0.7,  0, -1, 0.75, 0.7, 0.8,  0, 0, -1, 0, 0, 0, 0.85, -1, 0]
//   },
//   {
//     id: 5,
//     kpiInTask: [0, 0.75, 0, -1, 0,  0, 0.95, 0.95, 0, 0.95,  0, 0.9, 0, 0.8, 0.8,  0, 0, 0, 0, 0]
//   },
//   {
//     id: 6,
//     kpiInTask: [0, 0.95, -1, 0, 0,  0, 0.9, 0.8, 0, 0.9,  0.85, 0.95, 0, 0.8, 0.9,  0, 0, 0, 0]
//   },
//   {
//     id: 7,
//     kpiInTask: [0, -1, 0.85, 0.9, 0.8,  0.8, 0, 0.9, 0.9, 0,  0, 0, 0.85, 0.8, 0,  0.9, 0.95, 0.85, 0.9]
//   },
//   {
//     id: 8,
//     kpiInTask: [0, 0, 0, 0.8, 0.7, 0, 0, 0.75, 0, 0.8, 0, 0, 0, 0, 0, -1, 0.9, 0.8, 0.85, 0]
//   },
  
// ]



// arr[i][j]: hiệu suất làm việc taskID = j của thằng nhân viên employeeId = i  
const lastKPIMatrix = [
  [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [-1, 0.8, 0.9, 0.9, 0.9,  0.7, -1, 0.7, 0.75, -1, 0.8, -1, 0.85, 0.9, -1, 0.9, 0.85, 0.8, 0.7],
  [-1, 0.75, 0.85, 0.8, 0.8,  0.8, -1, 0.5, 0.8, 0.7, 0.7, -1, 0.8, 0.8, -1, 0.85, 0.9, 0.85, 0.8],
  [-1, 0.75, 0.8, 0.7, 0.7, 0.8, 0.75, -1, 0.75, -1, 0.85, 0.85, -1, -1, -1, 0.7, 0.8, -1, 0.8],
  [-1, -1, 0.75, 0.7, 0.6,  -1, -1, 0.65, 0.6, 0.7,  -1, -1, -1, -1, -1, -1, 0.75, 0.7, -1],
  [-1, 0.65, -1, -1, -1, -1, 0.9, 0.95, -1, 0.9, -1, 0.8, -1, 0.7, 0.7, -1, -1, -1, -1],
  [-1, 0.85, -1, -1, -1, -1, 0.8, 0.7, -1, 0.8,  0.75, 0.9, -1, 0.7, 0.8, -1, -1, -1, -1],
  [-1, 0.8, 0.7, 0.8, 0.7, 0.7, -1, 0.8, 0.8, 0.65, -1, -1, 0.75, 0.7, -1,  0.8, 0.85, 0.75, 0.8],
  [-1, -1, -1, 0.7, 0.6, -1, -1, 0.65, -1, 0.7, -1, -1, -1, -1, -1, -1, 0.8, 0.7, 0.75]
]

module.exports = {
  lastKPIs,
  lastKPIMatrix
}