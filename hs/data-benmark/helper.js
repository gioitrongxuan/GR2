const { getAvailableTimeForAssetOfTask } = require('../algorithm/hs_helper');

const {markAssetsAsUsed } = require('../algorithm/hs_helper');
const { DAY_WORK_HOURS } = require('../constants/kpi.const');

function scheduleTasksWithAssetAndEmpTasks_Not_ReTimeWorking(job, assets, allTasksOutOfProject) {
  const sortedTasks = job.tasks;

  // JSON => date to string hết
  let currentAssets = JSON.parse(JSON.stringify(assets))
  for (const task of sortedTasks) {
    const { taskAssets, availableTime } = getAvailableTimeForAssetOfTask(task, currentAssets);
    task.assets = taskAssets;
    const numDay = (task.estimateTime);

    const preceedingTasks = task.preceedingTasks.map(id => job.tasks.find(t => t.id === id));
    if (preceedingTasks?.length > 0 ) {
      const maxEndTimeOfPreceedingTasks = preceedingTasks.reduce((maxEndTime, t) => Math.max(maxEndTime, t.endTime), 0);
      // Tìm thời gian bắt đầu cho nhiệm vụ sau khi tất cả các nhiệm vụ tiền điều kiện của nó đã hoàn thành và tài nguyên cần được sử dụng rảnh rỗi
      task.startTime = new Date(Math.max(availableTime, maxEndTimeOfPreceedingTasks));
    } else {
      task.startTime = new Date(Math.max(job.startTime, availableTime));
    }
    // recalculate Time
    // task.startTime = reCalculateTimeWorking(task.startTime)
    task.endTime = new Date(task.startTime.getTime() + numDay * 3600 * 1000 * 24);
    // task.endTime = reCalculateTimeWorking(task.endTime)


    // Xét ở đây
    // allTasksOutOfProject
    while (true) {
      const availableAssigneeWithTask = task.availableAssignee
      const maxLength = availableAssigneeWithTask?.length

      const availableAssignees = task.availableAssignee.filter(assignee => {
        return !allTasksOutOfProject.some(otherTask => {
          return otherTask.assignee.id === assignee.id &&
            !(task.endTime <= otherTask.startTime || task.startTime >= otherTask.endTime);
        });
      });

      if (availableAssignees?.length > 1 || (maxLength <= 3 && availableAssignees.length == maxLength) || (maxLength > 3 &&  availableAssignees?.length >= maxLength - 1) || availableAssignees?.length >= 4) {
        task.availableAssignee = availableAssignees;
        break;
      } else {
        task.startTime.setHours(task.startTime.getHours() + 1);
        task.endTime.setHours(task.endTime.getHours() + 1);
      }
    }
    // task.startTime = reCalculateTimeWorking(task.startTime)
    task.endTime = new Date(task.startTime.getTime() + numDay * 3600 * 1000 * 24);
    // task.endTime = reCalculateTimeWorking(task.endTime)
    currentAssets = markAssetsAsUsed(currentAssets, taskAssets, task.startTime, task.endTime);
  }

  return sortedTasks;
}

function reScheduleTasks_Not_ReTimeWorking(assignment, assets, allTasksOutOfProject, projectEndTime) {
  // Làm việc với 1 assignmentTemp
  for (let i = 0; i < assignment.length; i++) {
    const { task } = assignment[i]
    const { startTime, endTime } = task
    task.startTimeTmp = new Date(startTime)
    task.endTimeTmp = new Date(endTime)
  }
  assignment.sort((itemA, itemB) => new Date(itemA.task.endTime) - new Date(itemB.task.endTime))
  assignment.forEach(({ task }) => {
    task.startTime = new Date(task.startTime)
    task.endTime = new Date(task.endTime)
  })
  // Test
  // assignment[0].task.startTime.setDate(assignment[0].task.startTime.getDate())

  // console.log("assignment: ", assignment[0].task.startTime)
  // console.log("assignment: ", assignment[0].task.startTimeTmp)
  const endTimeSaves = {}
  const assetAssignments = {};

  assignment.forEach(({ task, assignee }) => {
    let startTime = task.startTime
    const numDay = (task.estimateTime);
    const remainHour = (task.estimateTime - numDay) * DAY_WORK_HOURS;

    const preceedingTasks = task.preceedingTasks.map(id => assignment.find((item) => item.task.id === id).task)
    const timeAvailableForAsset = getAvailableTimeForAssetOfTask(task, assets).availableTime
    task.startTime = new Date(Math.max(startTime, timeAvailableForAsset));
    if (preceedingTasks?.length > 0) {
      const maxEndTimeOfPreceedingTasks = preceedingTasks.reduce((maxEndTime, t) => Math.max(maxEndTime, t.endTime), 0);
      task.startTime = new Date(Math.max(startTime, maxEndTimeOfPreceedingTasks));
    }
    if (assignee.id in endTimeSaves && endTimeSaves[assignee.id].getTime() > task.startTime.getTime()) {
      // Nếu có xung đột, cập nhật thời gian bắt đầu của task
      task.startTime = endTimeSaves[assignee.id]
    }
    // console.log("task.startTime: ", task.startTime)
    // Kiểm tra xung đột với tài nguyên
    if (task.assets?.length) {
      let assetConflict = false;
      task.assets.forEach(asset => {
        if (asset.id in assetAssignments && assetAssignments[asset.id].getTime() > task.startTime.getTime()) {
          assetConflict = true;
          // Nếu có xung đột với tài nguyên, cập nhật thời gian bắt đầu của task
          task.startTime = assetAssignments[asset.id];
          // console.log("vao day: ", task.startTime)
        }
      });

      // ReCalculate Time
      task.startTime = reCalculateTimeWorking(task.startTime)
      // Nếu có xung đột với tài nguyên, xem xét lại thời gian kết thúc của task
      if (assetConflict) {
        task.endTime = new Date(task.startTime.getTime() + numDay * 3600 * 1000 * 24 + remainHour * 3600 * 1000);
      }
    }

    // check thêm cả điều kiện về thời gian của thằng nhân viên
    while (true) {
      const isAvailable = !allTasksOutOfProject.some(otherTask => {
        return otherTask.assignee.id === assignee.id &&
          !(task.endTime <= otherTask.startTime || task.startTime >= otherTask.endTime);
      })

      if (isAvailable) {
        break;
      } else {
        task.startTime.setHours(task.startTime.getHours() + 1);
        task.endTime.setHours(task.endTime.getHours() + 1);
      }
    }

    task.startTime = reCalculateTimeWorking(task.startTime)
    // ReCalculate Time
    task.endTime = new Date(task.startTime.getTime() + numDay * 3600 * 1000 * 24 + remainHour * 3600 * 1000);
    task.endTime = reCalculateTimeWorking(task.endTime)
    // console.log("task.endTime: ", task.endTime)

    endTimeSaves[assignee.id] = task.endTime;

    // Cập nhật lại thông tin về tài nguyên được gán
    if (task.assets) {
      task.assets.forEach(asset => {
        assetAssignments[asset.id] = task.endTime;
      });
    }
  })

  let endTimeTmp = getLastestEndTime(assignment)
  // console.log("endTimeTmp: ", endTimeTmp)
  
 
  if (endTimeTmp > projectEndTime) {
    console.log("Điều chỉnh lịch nhưng không được vì vượt quá thời gian cho phép, những task bị trùng sẽ cần được ủy quyền")
    assignment.forEach(({ task }) => {
      task.startTime = new Date(task.startTimeTmp)
      task.endTime = new Date(task.endTimeTmp)
    })
  } 
}

module.exports = {
  scheduleTasksWithAssetAndEmpTasks_Not_ReTimeWorking,
  reScheduleTasks_Not_ReTimeWorking
}