// Thuật toán lõi
const fs = require('fs');
const ExcelJS = require('exceljs');
const { getTimeForProject, getLastKPIAndAvailableEmpsInTasks, DLHS, reScheduleTasks, scheduleTasksWithAssetAndEmpTasks, getEmployeesCost}= require('../../../algorithm/hs_helper');
const { splitKPIToEmployeesByKMeans, findBestMiniKPIOfTasks, reSplitKPIOfEmployees } = require('../../../algorithm/k-mean.helper');
const { topologicalSort } = require('../../../algorithm/helper');
const { KPI_TYPES } = require('../../../constants/kpi.const');
const { scheduleTasksWithAssetAndEmpTasks_Not_ReTimeWorking, reScheduleTasks_Not_ReTimeWorking } = require('../../../data-benmark/helper');

const workbook = new ExcelJS.Workbook();
const argumentsSheet = workbook.addWorksheet('Tham so thuat toan');
const projectGeneralSheet = workbook.addWorksheet('Thong_Tin_Du_An')
const worksheet = workbook.addWorksheet('Ket_qua_phan_bo');

async function soSanhThuatToan() {
  const { project, assetHasKPIWeight, DLHS_Arguments, HS_Arguments } = require('./input')
  
  const start = performance.now()

  const {
    employees,
    assets,
    kpiTarget
  } = project
  const job = project




  // console.log("job: ", job.tasks)

  
  const lastKPIs = getLastKPIAndAvailableEmpsInTasks(job.tasks, [], employees)

  
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
    
  worksheet.addRow(['No Iter', 'Task ID', 'Preceedings', 'Emp ID', 'Asset ID', 'Start Time', 'End Time', 'Total Day Works', 'Total Cost of Emps', 'Time Exce (ms)'])

  const worksheetAsset = workbook.addWorksheet('Input_Asset');
  const worksheetTask = workbook.addWorksheet('Input_Task');
  const worksheetEmp = workbook.addWorksheet('Input_Employee');

  worksheetAsset.addRow(['ID', 'Name', 'Type', 'Status', 'Qualities Capacity Level', 'Usage Logs'])
  const assetsALL = [...assets.inUse, ...assets.readyToUse]
  assetsALL.forEach((asset) => {
    worksheetAsset.addRow([asset.id, asset.name, asset.type, asset.status, asset.qualities['level'], JSON.stringify(asset?.usageLogs)])
  })

  worksheetEmp.addRow(['ID', 'Name', 'Cost Per Hour', 'Qualities_Degree', 'Qualities_Year_Of_Exp', 'Qualities_English', 'Qualities_Backend', 'Qualities_Frontend', 'Qualities_Docker', 'Qualities_CI_CD', 'Qualities_Unit_Test', 'Qualities_Manual_Test', 'Qualities_Automation_Test'])

  employees.forEach((employee) => {
    worksheetEmp.addRow([employee.id, employee.name, employee.costPerHour, employee.qualities?.degree, employee.qualities?.year_of_exp, employee.qualities?.english, employee.qualities?.backend, employee.qualities?.frontend, employee.qualities?.docker, employee.qualities?.ci_cd, employee.qualities?.unit_test, employee.qualities?.manual_test, employee.qualities?.automation_test])
  })

  worksheetTask.addRow(['ID', 'Name', 'Preceedings', 'Estimate Effort', 'Require Asset Type', 'Require Asset Number', 'Require Asset Capacity', 'Require Assign'])
  job.tasks.forEach((task) => {
    worksheetTask.addRow([task.id, task.name, task.preceedingTasks.join(", "), task.estimateTime, task.requireAsset[0].type, task.requireAsset[0].number, task.requireAsset[0].quality[0].level, task?.requireAssign])
  })
  worksheet.addRow(['No Iter', 'Task ID', 'Preceedings', 'Asset', 'Assignee ID', 'Start Time', 'End Time', 'Total Day Works', 'Total Cost of Emps', 'Time Exce'])


  let minTimeCost = Infinity
  let minEmpsCost = Infinity
  let minTimeExce = Infinity


  let totalTimeCost = 0
  let totalEmpsCost = 0
  let totalTimeExce = 0

  for (let t = 0; t < 100; t++) {
    console.log("t: ", t + 1)
    
    let testResult = {}
    const start = performance.now();
    job.tasks = topologicalSort(job.tasks)


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
    // Step 1.2
    if (isHasKPITarget) {
      kpiOfEmployeesTarget = splitKPIToEmployeesByKMeans(job.tasks, employees, kpiTarget, assetHasKPIWeight)
      const minimumKpi = findBestMiniKPIOfTasks(job.tasks, kpiTarget, assetHasKPIWeight)
      kpiOfEmployeesTarget = reSplitKPIOfEmployees(minimumKpi, kpiOfEmployeesTarget)
    }


    job.tasks = scheduleTasksWithAssetAndEmpTasks(job, assets, [])
    let lastestEndTime = new Date(0)
    for (let i = 0; i < job.tasks?.length; i++) {
      const task = job.tasks[i]
      const endTime = new Date(task?.endTime)
      if (lastestEndTime < endTime) {
        lastestEndTime = endTime
      }
      
    }
    // console.log("lastestEndTime: ", lastestEndTime)
    if (new Date(lastestEndTime) > new Date(job.endTime)) {
      throw Error("Không thể tìm được phương án phân bổ để thỏa mãn thời gian của dự án! Hãy điều chỉnh lại tài nguyên và thời gian dự kiến!")
    }

    // Step 2
    testResult = DLHS(DLHS_Arguments, job.tasks, employees, lastKPIs, kpiTarget, kpiOfEmployeesTarget, assetHasKPIWeight)
    // Step 3
    if (testResult?.falseDuplicate) {
      // console.log("vào đây")
      reScheduleTasks(testResult.assignment, assets, [], project.endTime)
      console.log("day works: ", getTimeForProject(testResult.assignment))
    }


    const end = performance.now();
    const timeExce = end - start

    const getTimeWorks = getTimeForProject(testResult.assignment).totalTime
    const empCost = getEmployeesCost(testResult.assignment)
    console.log(getTimeForProject(testResult.assignment).startTime, getTimeForProject(testResult.assignment).endTime, empCost, testResult.falseDuplicate, getTimeForProject(testResult.assignment).totalTime)
    totalTimeCost += getTimeWorks
    totalEmpsCost += empCost
    totalTimeExce += timeExce

    if (minTimeCost > getTimeWorks) {
      minTimeCost = getTimeWorks
    }

    if (minEmpsCost > empCost) {
      minEmpsCost = empCost
    }

    if (minTimeExce > timeExce) {
      minTimeExce = timeExce
    }


    for (let k = 0; k < testResult.assignment.length; k++) {
      const { task, assignee, assets } = testResult.assignment[k]
      const taskID = task.id
      const assigneeId = assignee.id
      worksheet.addRow([t + 1, taskID, task.preceedingTasks.join(", "), assigneeId, assets[0].id, task.startTime, task.endTime, getTimeWorks, empCost, timeExce])
    }
  }

  worksheet.addRow(['Num Iter', 'Average Emps Cost', 'Average Time Works', 'Average Time Exec (ms)', 'Min Emps Cost', 'Min Time Works', 'Min Time Exec (ms)'])
  worksheet.addRow([100, totalEmpsCost / 100, totalTimeCost / 100, totalTimeExce / 100, minEmpsCost, minTimeCost, minTimeExce])
  const filePath = './output/output_sosanh_dlhs_100.xlsx';
  await workbook.xlsx.writeFile(filePath);

}
soSanhThuatToan()