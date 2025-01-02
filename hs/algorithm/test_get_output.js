
const fs = require('fs');
const ExcelJS = require('exceljs');
const { tasks } = require('../data/task');
const { assets } = require('../data/asset');
const { employees } = require('../data/employee');
const { lastKPIs } = require('../data/kpi');

const { topologicalSort } = require('./helper');
const { scheduleTasksWithAsset, getAvailableEmployeesForTasks, checkIsFitnessSolution, compareSolution, reScheduleTasks, getKpiOfEmployees, DLHS, getTimeForProject, getDistanceOfKPIEmployeesTarget_2 } = require('./hs_helper');
const { kMeansWithEmployees, splitKPIToEmployeesByKMeans, findBestMiniKPIOfTasks, reSplitKPIOfEmployees } = require('./k-mean.helper');


async function testAndFillDataToExcel() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Task KPIs');
  const employeesheet = workbook.addWorksheet('Task KPIs of Employee');

  const START_DATE = new Date()
  START_DATE.setFullYear(2024, 4, 1)
  START_DATE.setHours(0, 0, 0, 0)
  job = {
    startTime: START_DATE,
    tasks: tasks
  }
  job.tasks = topologicalSort(tasks)
  job.tasks = scheduleTasksWithAsset(job, assets)
  // console.log("job.tasks: ", job.tasks)
  // console.log("assets: ", assets.inUse[0].usageLogs)
  job.tasks = getAvailableEmployeesForTasks(job.tasks, employees, lastKPIs)
  const BW_max = 2, BW_min = 1, PSLSize = 5, numOfSub = 3, Max_FEs = 10000, FEs = 0, R = 100, HMS = 60
  const clusters = kMeansWithEmployees(employees, 4) 

  const kpiTarget = {
    'A': { value: 0.8, weight: 0.35 },
    'B': { value: 0.8, weight: 0.35 },
    'C': { value: 0.8, weight: 0.3 },
  }

  const DLHS_Arguments = {
    HMS, BW_max, BW_min, PSLSize, numOfSub, R, Max_FEs
  }
  const assetHasKPIWeight = 0.1

  let count = 0;
  let kpiOfEmployeesTarget = splitKPIToEmployeesByKMeans(job.tasks, clusters, employees, kpiTarget, assetHasKPIWeight)
  const minimumKpi = findBestMiniKPIOfTasks(job.tasks, kpiTarget, assetHasKPIWeight)
  kpiOfEmployeesTarget = reSplitKPIOfEmployees(minimumKpi, kpiOfEmployeesTarget)

  do {
    worksheet.addRow(['ID_KPI_Target', 'Target A', 'Target B', 'Target C'])
    worksheet.addRow([count + 1, kpiTarget['A'].value, kpiTarget['B'].value, kpiTarget['C'].value])
    // Add headers
    worksheet.addRow(['ID', 'Task ID', 'AssigneeId', 'MachineId', 'Start Time', 'End Time', ' ', 'Total Cost', 'Distance Of KPI', 'Total KPI A', 'Total KPI B', 'TotalKPI C', '', 'AssigneeId', 'KPI A when splits', 'KPI A of Assignee with All Tasks', 'KPI B when splits', 'Total KPI B of Assignee with All Tasks', 'KPI C when splits', 'Total KPI C of Assignee with All Tasks']);
    for (let j = 0; j < 5; j++) {
      // add vào đây 
      let testResult = DLHS(DLHS_Arguments, job.tasks, employees, lastKPIs, kpiTarget, kpiOfEmployeesTarget, assetHasKPIWeight)
      for (let i = 1; i < 20; i++) {
        const result = DLHS(DLHS_Arguments, job.tasks, employees, lastKPIs, kpiTarget, kpiOfEmployeesTarget, assetHasKPIWeight)
      
        const checkIsFitnessSolutionResult = checkIsFitnessSolution(result, kpiTarget, kpiOfEmployeesTarget, assetHasKPIWeight)
        if (checkIsFitnessSolutionResult) {
          testResult = result
          break
        }
        if (!compareSolution(testResult, result, kpiTarget, kpiOfEmployeesTarget)) {
          testResult = result
        }
      }
      reScheduleTasks(testResult.assignment, assets)
      const kpiAssignment = testResult.kpiAssignment
      const kpiOfEmployee = testResult.kpiOfEmployees
      for (let i = 0; i < testResult.assignment.length; i++) {
        const { task, assignee, assets } = testResult.assignment[i]
        worksheet.addRow([j + 1, task.id, assignee.id, assets[0].id, task.startTime, task.endTime, ' ', testResult.totalCost, testResult.distanceWithKPIEmployeesTarget, kpiAssignment['A'], kpiAssignment['B'], kpiAssignment['C'],  ' ', assignee.id, kpiOfEmployeesTarget[assignee.id]['A'], kpiOfEmployee[assignee.id]['A'], kpiOfEmployeesTarget[assignee.id]['B'], kpiOfEmployee[assignee.id]['B'], kpiOfEmployeesTarget[assignee.id]['C'], kpiOfEmployee[assignee.id]['C']]);
      }    
  
      employeesheet.addRow(['Target A', 'Target B', 'Target C'])
      employeesheet.addRow([kpiTarget['A'].value, kpiTarget['B'].value, kpiTarget['C'].value])
      employeesheet.addRow(['ID', 'Employee ID', 'KPI A when splits', 'Total KPI A of Assignee with All Tasks', 'KPI B when splits', 'Toal KPI B of Assignee with All Tasks', 'KPI C when splits', 'Total KPI C of Assignee with All Tasks', '', 'Total KPI A', 'Total KPI B', 'TotalKPI C', 'Distance']);
      for (let i = 0; i < employees.length; i++) {
        employeesheet.addRow([i + 1, employees[i].id, kpiOfEmployeesTarget[employees[i].id]['A'], kpiOfEmployee[employees[i].id]['A'], kpiOfEmployeesTarget[employees[i].id]['B'], kpiOfEmployee[employees[i].id]['B'], kpiOfEmployeesTarget[employees[i].id]['C'], kpiOfEmployee[employees[i].id]['C'], '', kpiAssignment['A'], kpiAssignment['B'], kpiAssignment['C'], testResult.distanceWithKPIEmployeesTarget]);
      }
      console.log("j = ", j + 1)
      
    }
    // Tang KPI chi tieu
    const rand = count % 3;
    if (rand === 1) {
      kpiTarget['A'].value += 0.01
    } else if (rand === 2) {
      kpiTarget['B'].value += 0.01
    } else {
      kpiTarget['C'].value += 0.01
    }
    count++;
  }
  while (kpiTarget['A'].value <= 0.83 && kpiTarget['B'].value <= 0.83 && kpiTarget['C'].value <= 0.83) 
  

  // Save workbook to a file
  const filePath = '../output/100_output.xlsx';
  await workbook.xlsx.writeFile(filePath);
  console.log(`Excel file created at: ${filePath}`);
}

testAndFillDataToExcel()