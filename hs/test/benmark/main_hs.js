// Thuật toán lõi
const fs = require('fs');
const ExcelJS = require('exceljs');
const { getTimeForProject, getLastKPIAndAvailableEmpsInTasks, DLHS, harmonySearch_Base}= require('../../algorithm/hs_helper');
const { splitKPIToEmployeesByKMeans, findBestMiniKPIOfTasks, reSplitKPIOfEmployees } = require('../../algorithm/k-mean.helper');
const { topologicalSort } = require('../../algorithm/helper');
const { KPI_TYPES } = require('../../constants/kpi.const');
const { scheduleTasksWithAssetAndEmpTasks_Not_ReTimeWorking, reScheduleTasks_Not_ReTimeWorking } = require('../../data-benmark/helper');

async function testDLHS() {
  const { project, assetHasKPIWeight, DLHS_Arguments, HS_Arguments } = require('./input')
  
  const start = performance.now()

  const {
    employees,
    assets,
    kpiTarget
  } = project
  const job = project
  
  // pre-processing KPI
  const lastKPIs = getLastKPIAndAvailableEmpsInTasks(job.tasks, [], employees)

  // Step 1
  // Step 1.1
  job.tasks = topologicalSort(job.tasks)

  // console.log("job.task: ", job.tasks.forEach(task => {
  //   console.log(task.id, task.availableAssignee.map((emp) => emp.id).join(", "))
  // }))


  // Step 3.1 and 3.2
  let kpiOfEmployeesTarget = {}
  employees.forEach((employee) => {
    kpiOfEmployeesTarget[employee.id] = {}
    for (let key in KPI_TYPES) {
      kpiOfEmployeesTarget[employee.id][key] = 0
    }
  })
  let isHasKPITarget = false
  for (let key in kpiTarget) {
    if (kpiTarget[key].value !== 0) {
      isHasKPITarget = true
    }
  }
  if (isHasKPITarget) {
    kpiOfEmployeesTarget = splitKPIToEmployeesByKMeans(job.tasks, employees, kpiTarget, assetHasKPIWeight)
    const minimumKpi = findBestMiniKPIOfTasks(job.tasks, kpiTarget, assetHasKPIWeight)
    kpiOfEmployeesTarget = reSplitKPIOfEmployees(minimumKpi, kpiOfEmployeesTarget)
  }


  // Step 2: Schedule tasks With assets and time
  job.tasks = scheduleTasksWithAssetAndEmpTasks_Not_ReTimeWorking(job, assets, [])
  let lastestEndTime = new Date(0)
  for (let i = 0; i < job.tasks?.length; i++) {
    const task = job.tasks[i]
    const endTime = new Date(task?.endTime)
    if (lastestEndTime < endTime) {
      lastestEndTime = endTime
    }
    
  }
  if (new Date(lastestEndTime) > new Date(job.endTime)) {
    throw Error("Không thể tìm được phương án phân bổ để thỏa mãn thời gian của dự án! Hãy điều chỉnh lại tài nguyên và thời gian dự kiến!")
  }

  // Step 3.3: HS
  let testResult = harmonySearch_Base(HS_Arguments, job.tasks, employees, lastKPIs, kpiTarget, kpiOfEmployeesTarget, assetHasKPIWeight)
  // Step 4: Resolve task conflict
  if (testResult?.falseDuplicate) {
    console.log("vào đây")
    reScheduleTasks_Not_ReTimeWorking(testResult.assignment, assets, [], project.endTime)
    console.log("day works: ", getTimeForProject(testResult.assignment))
  }

  const end = performance.now()
  const performanceTime = (end - start) / 1000


  // Đưa dữ liệu đầu ra
  const workbook = new ExcelJS.Workbook();
  const argumentsSheet = workbook.addWorksheet('Tham so thuat toan');
  const projectGeneralSheet = workbook.addWorksheet('Thong_Tin_Du_An')
  const taskSheet = workbook.addWorksheet('Ket_qua_phan_bo');
  // Thông tin về tham số
  argumentsSheet.addRow(['Tham số thuật toán DLHS'])
  argumentsSheet.addRow(['Key', 'Value']);
  // Thêm từng key và value vào sheet
  Object.keys(DLHS_Arguments).forEach(key => {
    argumentsSheet.addRow([key, DLHS_Arguments[key]]);
  });

  // Thông tin chung về dự án
  projectGeneralSheet.addRow(['ID_KPI_Target', 'Target A', 'Target B', 'Target C'])
  projectGeneralSheet.addRow([project.kpiTarget['A'].value, project.kpiTarget['B'].value, project.kpiTarget['C'].value])
  projectGeneralSheet.addRow(['Start Time', 'End Time'])
  projectGeneralSheet.addRow([project.startTime.toLocaleString(), project.endTime.toLocaleString()])

  // Thêm dữ liệu cho sheet kết quả phân bổ task
  taskSheet.addRow(['Thông tin phân bổ'])
  taskSheet.addRow(['Task ID (Task Name)', 'Start Time', 'End Time', 'AssigneeId (Assignee Name)', 'AssetId (Asset Name)']);
  for (let i = 0; i < testResult.assignment.length; i++) {
    const { task, assignee, assets } = testResult.assignment[i]
    let assetToPush = ''
    assets.forEach((asset) => {
      assetToPush += `${asset.id} (${asset.name}), `
    })
    assetToPush = assetToPush.substring(0, assetToPush.length - 2)
    assetToPush = `[ ${assetToPush}]`

    taskSheet.addRow([`${task.id} (${task.name})`, task.startTime.toLocaleString(), task.endTime.toLocaleString(), `${assignee.id} (${assignee.name})`, assetToPush]);
  }

  // Kết quả phân bổ
  taskSheet.addRow(['Các kết quả sau khi phân bổ'])
  let headerSheet = []
  let resultRow = []
  for (let key in kpiTarget) {
    headerSheet.push('Target KPI Type ' + key)
    headerSheet.push('Result KPI Type ' + key)
    resultRow.push(kpiTarget[key].value)
    resultRow.push(testResult.kpiAssignment[key])
  }
  
  taskSheet.addRow([...headerSheet, 'Start Time', 'End Time', 'Total Duration Works', 'Total Cost', 'Distance', 'Performence (s)'])
  taskSheet.addRow([...resultRow, getTimeForProject(testResult.assignment).startTime.toLocaleString(), getTimeForProject(testResult.assignment).endTime.toLocaleString(), getTimeForProject(testResult.assignment).totalTime, testResult.totalCost, testResult.distanceWithKPIEmployeesTarget, performanceTime])

  // Save workbook to a file
  const filePath = './output/hs_test_benmark_output.xlsx';
  await workbook.xlsx.writeFile(filePath);
  console.log(`Excel file created at: ${filePath}`);
}

testDLHS()

