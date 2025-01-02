const { DAY_WORK_HOURS } = require("../constants/kpi.const");
const { assets } = require("../data/asset");

function topologicalSort(tasks) {
  const result = [];
  const visited = new Set();
  const inProgress = new Set();
  
  function visit(task) {
    if (inProgress.has(task)) {
      throw new Error('Tasks have cyclic dependencies.');
    }
    
    if (!visited.has(task)) {
      inProgress.add(task);
      
      const dependencies = task.preceedingTasks || [];
      dependencies.forEach(depId => {
        const dependency = tasks.find(t => t.id === depId);
        if (!dependency) {
          throw new Error(`Dependency with id ${depId} not found.`);
        }
        visit(dependency);
      });
      
      inProgress.delete(task);
      visited.add(task);
      result.unshift(task);
    }
  }
  
  for (const task of tasks) {
    visit(task);
  }
  
  return result.reverse();
}

function reCalculateStartTime(startTime) {
  if (startTime.getHours() == 17){
      startTime.setDate(startTime.getDate() + 1);
      startTime.setHours(8)
  }
  return startTime;
}

function reCalculateTimeWorking(time, isStartIndex = false) {
  // Đưa về giờ làm chuẩn
  if (time.getHours() >= 17) { // giờ >=17 chuyển sang ngày hôm sau
      time.setDate(time.getDate() + 1);
      time.setHours(8 + time.getHours() - 17)
  } else if (time.getHours() >= 12) {
      time.setHours(time.getHours())
  } else if (time.getHours() < 8){
    // Nếu < 8h mà là bắt đầu của luồng công việc
      if (isStartIndex) {
          time.setHours(8)
      } else {
      // Chưa hiểu chỗ này
      time.setHours(16 + time.getHours())
      }
  };

  while (time.getDay()%6 == 0) { // Không làm chủ nhật
      time.setDate(time.getDate() + 1);
  }

  return time;
}

function reCalculateStartTime(startTime) {
  if (startTime.getHours() == 17){
      startTime.setDate(startTime.getDate() + 1);
      startTime.setHours(8)
  }

  return startTime;
}

function initBestAssignment(job) {
  let nextEndTime = job.startTime;
  job.tasks.forEach(function(task) {
    const numDay = Math.floor(task.hours / 8);
    const remainHour = task.hours % 8;
    task.startTime = reCalculateStartTime(nextEndTime);
    task.endTime = new Date(86400000000000);
    nextEndTime = task.endTime;
  });

  return job.tasks;
}

// lấy thời gian có thể dùng được asset cho task này
function getAvailableTimeForAsset(task, asset) {
  if (task.requireAsset.length == 0) {
    return new Date(0);
  }

  let availableTime = [];
  task.requireAsset.forEach(require => {
    let readyToUse = asset.readyToUse.filter(_ => JSON.stringify(_.type).includes(require.type));
    // Nếu có tài nguyên yêu cầu và đủ số lượng => trả về timeavailable = 0 
    if (readyToUse.length >= require.number) {
      availableTime.push(new Date(0));
    }
    else {
      // Nếu không đủ số lượng
      let remain = require.number - readyToUse.length;
      let inUse = asset.inUse.filter(_ => JSON.stringify(_.type).includes(require.type));
      if (inUse?.length && remain <= inUse?.length) {
        // Lấy cả bọn tài nguyên đang được sử dụng ra 
        let logs = inUse.map(_=>_.usageLogs.sort((a, b) => b.endDate - a.endDate)[0].endDate).sort((a, b) =>  a - b);
        // trả về mảng logs mới nhất của các tài nguyên đang sử dụng, trong đó chứa endDate gần nhất (tức là endDate sẽ được dùng available) của từng thằng tài nguyên đang sử dụng)), logs theo thứ tự tăng dần của endaDate của từng thằng tài nguyên đang dùng
        // Nến ví dụ cần 2 thằng thì thời điểm sớm nhất để 2 thằng đó được sử dụng là logs của thằng thứ 2 (remain - 1)
        availableTime.push(logs[remain - 1])
      } else {
        // Check từ đầu luôn khi tạo task cũng được
        throw Error("Không đủ tài nguyên")
      }
    }
  });
  return new Date(Math.max(...availableTime)); // trả về thời gian mà tài nguyên có thể available cho task đó (thời gian sớm nhất nhưng phải lấy max)
}

function calculateLatestStartTime(jobStartTime, index, currentAssignment, task, asset) {
  let taskInThread = currentAssignment.filter(_ => _.threadIndex == index); // Tìm task với threadIndex = index
  let prevTaskEndTime = currentAssignment.filter(_ => task.preceedingTasks.includes(_.id)).map(_ => new Date(_.endTime)); // Lấy những thằng endtime của currentAssignment thỏa mãn là task tiên quyết của task hiện tại đang xét 
  let availableTimeForAsset = getAvailableTimeForAsset(task, asset); // lấy available time cho asset để thực hiện task hiện tại
  prevTaskEndTime.push(availableTimeForAsset)

  if (taskInThread.length == 0) {
    prevTaskEndTime.push(jobStartTime)

    return new Date(Math.max(...prevTaskEndTime));
  }

  let listEndTimeInThread = taskInThread.map(_ => new Date(_.endTime));

  return new Date(Math.max(...listEndTimeInThread.concat(prevTaskEndTime)));
}

function getEndTime(startTime, estimateTime) {
  let startTimeDate = new Date(startTime)
  const numDay = Math.floor(estimateTime)
  const remainHour = (estimateTime = numDay) * DAY_WORK_HOURS

  let endTime = new Date(startTimeDate + numDay * 3600 * 24 + remainHour * 3600)
  return endTime
}

function getLastestEndTime(assignment) {
  let endTime = new Date(0)
  for (let i = 0; i < assignment.length; i++) {
    const task = assignment[i].task
    const taskEndTime = new Date(task.endTime)
    if (endTime < taskEndTime) {
      endTime = taskEndTime
    }
  }
  return endTime
}
// Tính thời gian hoàn thành muộn nhất các tasks trong job
function calculateLatestCompletionTime(job) {
  let latestCompletionTime = job.startTime;

  for (let i = 0; i < job.tasks.length; i++) {
    const task = job.tasks[i];
    const taskEndTime = new Date(task.endTime);
    if (taskEndTime > latestCompletionTime) {
      latestCompletionTime = taskEndTime;
    }
  }

  return latestCompletionTime;
}

// Check xem ở luồng công việc index đối với việc giao hiện tại đã có task chưa => chưa thì là luồng đó chưa có task nào => tức là bắt đầu luồng công việc index nếu gán
function isStartIndex(currentAssignment, index) {
  let taskInThread = currentAssignment.filter(_ => _.threadIndex == index);

  if (taskInThread.length == 0){
      return true
  }
  return false;
}


function branchAndBound(numThreads, job, currentDepth, currentEndTime, currentAssignment, bestAssignment, asset) {
  if (currentDepth === job.tasks.length) {
    if (currentEndTime < calculateLatestCompletionTime(job)) {
      bestAssignment.splice(0, bestAssignment.length, ...currentAssignment);
    }
    return;
  }

  const task = job.tasks[currentDepth];

  for (let index = 0; index < numThreads; index++) {
    const numDay = Math.floor(task.estimateTime);

    const remainHour = (task.estimateTime - numDay) * 8;

    // Tính lại startTime cho task đó, đảm bảo thời gian tài nguyên sẵn sàng
    const startTime = reCalculateTimeWorking(calculateLatestStartTime(job.startTime, index, currentAssignment, task, asset), 
                                                                      isStartIndex(currentAssignment, index));

    // Endtime: starttime + duration
    const endTime = reCalculateTimeWorking(new Date(startTime.getTime() + numDay * 86400000 + remainHour * 3600000));
    const threadIndex = index;
    const newAssignment = [...currentAssignment];
    newAssignment[currentDepth] = { ...task, startTime, endTime, threadIndex };

    if (calculateLatestCompletionTime({ startTime: job.startTime, tasks: newAssignment }) > calculateLatestCompletionTime(job)) {
      continue;
    }

    branchAndBound(numThreads, job, currentDepth + 1, endTime, newAssignment, bestAssignment, asset);
  }
}

function findOptimalAssignment(job, numThreads, asset) {
  const bestAssignment = initBestAssignment(job);
  branchAndBound(numThreads, job, 0, job.startTime, [], bestAssignment, asset);
  bestAssignment.sort((a, b) => a.index - b.index);

  return bestAssignment;
}

function groupBy(array, property) {
  return array.reduce((result, obj) => {
    const key = obj[property];

    if (!result[key]) {
      result[key] = [];
    }

    result[key].push(obj);
    return result;
  }, {});
}


function calculateRandomAssigneCost(job) {
  let totalCost = 0;
  for (let i = 0; i < Object.keys(job).length; i++) {
      const tasks = job[i];
      const startTime = new Date(Math.min(...tasks.map(_ => new Date(_.startTime))));
      const endTime = new Date(Math.max(...tasks.map(_ => new Date(_.endTime))));
      let salary = 0;
      if (tasks[0].assignee == null){
          salary = Math.max(...employees.map(_ => _.salary))
      } else {
          salary = tasks[0].assignee.salary
      };
      const taskCost = (endTime - startTime) / (1000 * 60 * 60 * 24) * salary;
      totalCost = totalCost + taskCost;
  }

  return totalCost;
}

function duplicateSchedule(employee, startTime, endTime){
  let currentTask = allTask.filter(_ => _.responsibleEmployees.toString().split(',').includes(employee._id.toString()));
  let duplicateTask = [];

  for (let i = 0; i < currentTask.length; i++){
    if (((startTime <= currentTask[i].startDate) && (endTime <= currentTask[i].startDate)) ||
      ((startTime >= currentTask[i].endDate) && (endTime >= currentTask[i].endDate))) {
      continue;
    }
    duplicateTask.push(currentTask[i]);
  }

  return duplicateTask;
}

function assignTasks(jobIndex, assignments, bestAssignment, currentCost, minCost, checkDuplicateFlag) {
  if (jobIndex === Object.keys(jobs).length) {
    if (currentCost < calculateRandomAssigneCost(bestAssignment)) {
      if ((JSON.stringify(assignments) != undefined) && (Object.keys(assignments).length == Object.keys(jobs).length)) {
        Object.keys(bestAssignment).forEach(key => bestAssignment[key] = JSON.parse(JSON.stringify(assignments[key])));
        Object.keys(assignments).forEach(key => delete assignments[key]);
      }
      return;
    }
    return;
  }

  const jobKey = Object.keys(jobs)[jobIndex];
  const tasks = JSON.parse(JSON.stringify(jobs[jobKey]));

  for (let i = 0; i < employees.length; i++) {
    const startTime = new Date(Math.min(...tasks.map(_ => new Date( _.startTime))));
    const endTime = new Date(Math.max(...tasks.map(_ => new Date(_.endTime))));
    let noneDuplicate = !checkDuplicateFlag || (duplicateSchedule(employees[i], startTime, endTime).length === 0);
    if ((!Object.values(assignments).flat().some(assignment => assignment.assignee === employees[i])) && noneDuplicate) {
      const taskCost = (endTime - startTime) / (1000 * 30 * 60 * 60 * 24) * employees[i].salary;

      if((currentCost + taskCost) > calculateRandomAssigneCost(bestAssignment)){
        Object.keys(assignments).forEach(key => delete assignments[key]);
        continue;
      }
      tasks.forEach(task =>
        task.assignee = employees[i]
      )
      let obj = {}
      obj[jobKey] = tasks
      assignments = Object.assign(assignments, obj);

      minCost = currentCost + taskCost
      assignTasks(jobIndex + 1, assignments, bestAssignment, currentCost + taskCost, minCost, checkDuplicateFlag);

    }
  }
}

function branchAndBoundEmployee(jobs, employees, checkDuplicateFlag) {
  var bestAssignment = Object.assign({}, JSON.parse(JSON.stringify(jobs)));
  const minCost = Number.MAX_SAFE_INTEGER;
  var assignments = Object.assign({});
  assignTasks(0, assignments, bestAssignment, 0, minCost, checkDuplicateFlag);

  return bestAssignment;
}

function scheduleTasks(job) {
  // console.log("job.startTime: ", job.startTime)
  // Sắp xếp các nhiệm vụ theo thứ tự topological
  const sortedTasks = topologicalSort(job.tasks);

  // Gán startTime và endTime cho từng nhiệm vụ
  let currentTime = job.startTime;
  for (const task of sortedTasks) {
    // Kiểm tra xem tất cả các nhiệm vụ tiên quyết đã hoàn thành chưa
    const preceedingTasks = task.preceedingTasks.map(id => job.tasks.find(t => t.id === id));
    if (preceedingTasks?.length > 0 ) {
      const maxEndTimeOfPreceedingTasks = preceedingTasks.reduce((maxEndTime, t) => Math.max(maxEndTime, t.endTime), 0);
      const timeAvailableForAsset = getAvailableTimeForAsset(task, assets)
      task.startTime = new Date(Math.max(timeAvailableForAsset, maxEndTimeOfPreceedingTasks));
      // task.startTime = new Date(maxEndTimeOfPreceedingTasks);
    } else {
      task.startTime = job.startTime;
    }
    task.endTime = new Date(task.startTime.getTime() + task.estimateTime * 3600 * 1000 * 24);
    currentTime = task.endTime;
  }

  return sortedTasks;
}

function scheduleTasksWithAsset(job, assets) {
  // console.log("job.startTime: ", job.startTime)
  // Sắp xếp các nhiệm vụ theo thứ tự topological
  const sortedTasks = topologicalSort(job.tasks);
  
  

  // Gán startTime và endTime cho từng nhiệm vụ
  let currentTime = job.startTime;
  for (const task of sortedTasks) {
    // Kiểm tra xem tất cả các nhiệm vụ tiên quyết đã hoàn thành chưa
    const preceedingTasks = task.preceedingTasks.map(id => job.tasks.find(t => t.id === id));
    if (preceedingTasks?.length > 0 ) {
      const maxEndTimeOfPreceedingTasks = preceedingTasks.reduce((maxEndTime, t) => Math.max(maxEndTime, t.endTime), 0);
      const timeAvailableForAsset = getAvailableTimeForAsset(task, assets)
      task.startTime = new Date(Math.max(timeAvailableForAsset, maxEndTimeOfPreceedingTasks));
      // task.startTime = new Date(maxEndTimeOfPreceedingTasks);
    } else {
      task.startTime = job.startTime;
    }
    task.endTime = new Date(task.startTime.getTime() + task.estimateTime * 3600 * 1000 * 24);
    currentTime = task.endTime;
  }

  return sortedTasks;
}

function reCalculateTimeWorking (time, isStartIndex = false)  {
  if (time.getHours() >= 17) {
      time.setDate(time.getDate() + 1);
      time.setHours(8 + time.getHours() - 17)
  } else if (time.getHours() >= 12) {
      time.setHours(time.getHours())
  } else if (time.getHours() < 8){
      if (isStartIndex) {
          time.setHours(8)
      } else {
      time.setHours(16 + time.getHours())
      }
  };

  while (time.getDay()%6 == 0) {
      time.setDate(time.getDate() + 1);
  }

  return time;
}

function reCalculateStartTime(startTime) {
  if (startTime.getHours() == 17){
      startTime.setDate(startTime.getDate() + 1);
      startTime.setHours(8)
  }

  return startTime;
}


function scheduleTasksNotParalell(job) {
  // console.log("job.startTime: ", job.startTime)
  // Sắp xếp các nhiệm vụ theo thứ tự topological
  // const sortedTasks = topologicalSort(job.tasks);

  // Gán startTime và endTime cho từng nhiệm vụ
  let currentTime = job.startTime;
  for (const task of job.tasks) {
    // Kiểm tra xem tất cả các nhiệm vụ tiên quyết đã hoàn thành chưa
    // const preceedingTasks = task.preceedingTasks.map(id => job.tasks.find(t => t.id === id));
    // if (preceedingTasks?.length > 0 ) {
    //   const maxEndTimeOfPreceedingTasks = preceedingTasks.reduce((maxEndTime, t) => Math.max(maxEndTime, t.endTime), 0);
    //   // task.startTime = new Date(Math.max(currentTime, maxEndTimeOfPreceedingTasks));
    //   task.startTime = new Date(maxEndTimeOfPreceedingTasks);
    // } else {
    //   task.startTime = job.startTime;
    // }
    task.startTime = currentTime
    task.endTime = new Date(task.startTime.getTime() + task.estimateTime * 3600 * 1000 * 24);
    currentTime = task.endTime;
  }

  return job.tasks;
}

function calculateStartDateFromEndDate(endDate, duration, unitTime = 'days') {
  if (unitTime === 'days') {
    let numDay = Math.floor(duration)
    let remainHour = (duration - numDay) * DAY_WORK_HOURS
    let startDate = new Date(endDate).getTime() - (remainHour * 3600 * 1000 + numDay * 24 * 3600 * 1000)
    return new Date(startDate)
  } else {
    // unitTime = hours
    let startDate = new Date(endDate).getTime() - duration * 3600 * 1000
    return new Date(startDate)
  }
}

function calculateEndDateFromStartDate(startDate, duration, unitTime = 'days') {
  // console.log("startDate, duration, unitTIme: ", startDate, duration, unitTime)
  if (unitTime === 'days') {
    let numDay = Math.floor(duration)
    let remainHour = (duration - numDay) * DAY_WORK_HOURS
    let endDate = new Date(startDate).getTime() + (remainHour * 3600 * 1000 + numDay * 24 * 3600 * 1000)
    return new Date(endDate)
  } else {
    let endDate = new Date(startDate).getTime() + duration * 3600 * 1000
    return new Date(endDate)
  }
}

const calculateCPM = (tasks, projectStartTime, projectEndTime, unitTime) => {
  if (!tasks || !tasks?.length) {
    return []
  }
  let updateTasks = [...tasks]
  // console.log("updateTasks: ", updateTasks.map((item) => item.code))


  //
  let successors = {
    // key: code of task
    // value: [] array list tasks v that v has key is one of preceedingTasks 
  }

  for(let i = 0; i < updateTasks?.length; i++) {
    let task = updateTasks[i]
    task.ES = new Date(0)
    task.EF = new Date(0)
    task.LS = new Date("2100-04-30T00:00:00Z")
    task.LF = Date("2100-04-30T00:00:00Z")
    if (!successors[task?.code]) {
      successors[task.code] = []
    }
    let preceedingTasks = task?.preceedingTasks
    if (preceedingTasks && preceedingTasks?.length > 0) {
      preceedingTasks.forEach((item) => {
        let taskCode = item

        // taskCode is prev of this task => this taskCode has successor is this task.code

        if (!successors[taskCode]) {
          successors[taskCode] = []
        }
        successors[taskCode].push(task.code)
      })
      // console.log("task.code: ", task.code, "pre: ", preceedingTasks.map((item) => item.link))
    }
  }

  for(let i = 0; i < updateTasks?.length; i++) {
    let task = updateTasks[i]
    let preceedingTasks = task?.preceedingTasks && task?.preceedingTasks?.length ? 
      task?.preceedingTasks.map((item) => updateTasks?.find((taskItem) => taskItem?.id === item))
      : []
    if (!preceedingTasks || !preceedingTasks?.length) {
      task.ES = new Date(projectStartTime)
    } else {
      task.ES = new Date(Math.max(...preceedingTasks.map((item) => item.EF)))
    }
    task.ES = reCalculateTimeWorking(task.ES)
    task.EF = calculateEndDateFromStartDate(task.ES, task?.estimateNormalTime, unitTime)
    task.EF = reCalculateTimeWorking(task.EF)
  }

  updateTasks = updateTasks.reverse()
  // console.log("updateTasks: ", updateTasks.map((item) => item.code))
  for(let i = 0; i < updateTasks?.length; i++) {
    let task = updateTasks[i]
    // let preceedingTasks = task?.preceedingTasks && task?.preceedingTasks?.length ? 
    //   task?.preceedingTasks.map((item) => updateTasks?.find((taskItem) => taskItem?.code === item?.link))
    //   : []
    // console.log("pre: ", task.code, preceedingTasks)
    let successorTasks = successors[task.code] && successors[task.code]?.length > 0 ? 
      successors[task.code].map((item) => updateTasks.find((task) => task.code === item)) : []
    
    if (!successorTasks || !successorTasks?.length) {
      task.LF = new Date(projectEndTime)
    } else {
      task.LF = new Date(Math.min(...successorTasks.map((item) => item.LS)))
    }
    task.LS = calculateStartDateFromEndDate(task.LF, task?.estimateNormalTime, unitTime)
  }
  return updateTasks.reverse()
}

function checkHasAvailableSolution(tasks, projectStartTime, projectEndTime, tasksOutOfProject = []) {
  let parallelTaskFlows = {}
  let result = {
    isHasAvailableSolution: true,
    error_code: ''
  }
  let maxEF = new Date(Math.max(...tasks.map((item) => item.EF)))
  let minLS = new Date(Math.min(...tasks.map((item) => item.LS)))

  if (maxEF > projectEndTime || minLS < projectStartTime) {
    result = {
      isHasAvailableSolution: false,
      error_code: 'out_of_time'
    }
  }

  for(let i = 0; i < tasks?.length; i++) {
    let task = tasks[i]
    if(!parallelTaskFlows[task.code]) {
      parallelTaskFlows[task.code] = {
        ES: task.ES,
        LF: task.LF,
        parallelTasks: []
      }
    }

    let currentEF = task?.EF
    let currentLS = task?.LS
    let parallelTasks = tasks.filter((taskItem) => {
      const { ES, EF, LS, LF } = taskItem
      if ((currentEF > LS || EF > currentLS) && taskItem.code !== task.code) {
        return true
      } else {
        return false
      }
    })
    if(parallelTasks && parallelTasks?.length) {
      let parallelTasksWithCurrentTask = [...parallelTasks, task]
      parallelTaskFlows[task.code].parallelTasks = parallelTasksWithCurrentTask
    }
  }

  // console.log("parallelTaskFlows: ", parallelTaskFlows)


  for(let taskCode in parallelTaskFlows) {
    // console.log("taskcode: ", taskCode)
    const { ES, LF, parallelTasks } = parallelTaskFlows[taskCode]
    // console.log("taskcode: ", taskCode, parallelTasks.map((item) => item.code))
    if (parallelTasks && parallelTasks?.length) {
      let availableAssigneeForTask = []
      parallelTasks.forEach((task) => {
        let availableAssignee = task?.availableAssignee
        if (availableAssignee && availableAssignee?.length) {
          availableAssignee = availableAssignee.filter((assignee) => {
            if (!tasksOutOfProject || !tasksOutOfProject?.length) {
              return true
            }
            let findTaskConflictWithEmp = tasksOutOfProject.find((taskOutOf) => taskOutOf.assignee === assignee._id && taskOutOf.startDate <= ES && taskOutOf.endDate >= LF)
            if (findTaskConflictWithEmp) {
              return false
            } else {
              return true
            }
          })

          if (availableAssignee) {
            availableAssignee.forEach((assignee) => {
              if(!availableAssigneeForTask.includes(assignee._id)) {
                availableAssigneeForTask.push(assignee._id)
              }
            })
          }
        }
      })

      // Nếu số nhân viên phù hợp < số task song song => lỗi
      // console.log("flow: ", taskCode, "check length: ", availableAssigneeForTask?.length, parallelTasks?.length)
      if (availableAssigneeForTask?.length < parallelTasks?.length) {
        result = {
          isHasAvailableSolution: false,
          error_code: 'not_enough_employee_for_parallel'
        }
      }
    }
  }

  return result
}

module.exports = {
  topologicalSort,
  initBestAssignment,
  getAvailableTimeForAsset,
  calculateLatestStartTime,
  calculateLatestCompletionTime,
  isStartIndex,
  branchAndBound,
  findOptimalAssignment,
  groupBy,
  calculateRandomAssigneCost,
  duplicateSchedule,
  assignTasks,
  branchAndBoundEmployee,
  scheduleTasks,
  scheduleTasksNotParalell,
  getEndTime,
  getLastestEndTime,
  calculateCPM,
  checkHasAvailableSolution
}
