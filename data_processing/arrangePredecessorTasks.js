const {tasks} = require('./xlsxToJs/task.js');
const XLSX = require("xlsx");
const fs = require("fs");

function findPreceedingTasks(tasks) {
    // Chuyển đổi startTime và endTime thành Date object để so sánh
    tasks.forEach(task => {
        task.startTime = new Date(task.startTime);
        task.endTime = new Date(task.endTime);
    });

    // Sắp xếp công việc theo thời gian kết thúc tăng dần
    tasks.sort((a, b) => a.endTime - b.endTime);

    // Dùng Map để chứa các công việc với ID là key
    const preceedingTasksMap = {};

    for (let i = 0; i < tasks.length; i++) {
        const currentTask = tasks[i];
        const currentStart = currentTask.startTime;
        const preceedingTasks = [];

        // Duyệt qua các công việc trước đó
        for (let j = 0; j < i; j++) {
            const previousTask = tasks[j];
            const previousEnd = previousTask.endTime;

            // Nếu công việc trước kết thúc trước khi công việc hiện tại bắt đầu
            if (previousEnd <= currentStart) {
                // Thêm ID công việc vào preceedingTasks
                preceedingTasks.push(previousTask.id);

                // Kế thừa tất cả preceedingTasks của công việc trước đó
                const inheritedPreceedingTasks = preceedingTasksMap[previousTask.id];
                if (inheritedPreceedingTasks) {
                    inheritedPreceedingTasks.forEach(taskId => {
                        if (!preceedingTasks.includes(taskId)) {
                            preceedingTasks.push(taskId);
                        }
                    });
                }
            }
        }

        // Gán danh sách preceedingTasks cho công việc hiện tại
        preceedingTasksMap[currentTask.id] = preceedingTasks;
        tasks[i].preceedingTasks = preceedingTasks;
        
        
    }
    // save to tasks.js file
    const tasksContent = `const tasks = [\n${tasks.map(task => `
        {
          id: ${task.id},
          code: "${task.code}",
          name: "${task.name}",
          preceedingTasks: ${JSON.stringify(task.preceedingTasks)},
          startTime: "${task.startTime.toISOString()}",
          endTime: "${task.endTime.toISOString()}",
          requireAsset: ${JSON.stringify(task.requireAsset)},
          tags: ${JSON.stringify(task.tags)},
          estimateTime: ${task.estimateTime},
          requireAssign: ${JSON.stringify(task.requireAssign)},
          kpiInTask: ${JSON.stringify(task.kpiInTask)}
        }`).join(",\n")}
      ];
      module.exports = { tasks };`;
    fs.writeFileSync("/Users/gioi/Documents/learn/hust/datn/gr2/GR2/data_processing/xlsxToJs/task.js", tasksContent);
    console.log("File JS đã được tạo thành công!");
    return preceedingTasksMap;
    // Ghi kết quả vào file JS
    
}


// Thực thi
const result = findPreceedingTasks(tasks);
tasks.forEach(task => {
    console.log(`Công việc ${task.id}có preceedingTasks: ${JSON.stringify(result[task.id])}`);
});




// function findPreceedingTasks(tasks) {
//     // Sắp xếp công việc theo thời gian kết thúc tăng dần
//         // Chuyển đổi startTime và endTime thành Date object để so sánh
//         tasks.forEach(task => {
//             task.startTime = new Date(task.startTime);
//             task.endTime = new Date(task.endTime);
//         });
    
//         // Sắp xếp công việc theo thời gian kết thúc tăng dần
//         tasks.sort((a, b) => a.endTime - b.endTime);    
//     tasks.sort((a, b) => a[1] - b[1]);

//     const preceedingTasksMap = {};

//     for (let i = 0; i < tasks.length; i++) {
//         const currentTask = tasks[i];
//         const currentStart = currentTask[0];
//         const preceedingTasks = new Set();

//         // Duyệt qua các công việc trước đó
//         for (let j = 0; j < i; j++) {
//             const previousTask = tasks[j];
//             const previousEnd = previousTask[1];

//             // Nếu công việc trước kết thúc trước khi công việc hiện tại bắt đầu
//             if (previousEnd <= currentStart) {
//                 // Thêm công việc trước vào tập hợp
//                 preceedingTasks.add(JSON.stringify(previousTask));

//                 // Kế thừa tất cả preceedingTasks của công việc trước đó
//                 preceedingTasksMap[previousTask].forEach(task => {
//                     preceedingTasks.add(JSON.stringify(task));
//                 });
//             }
//         }

//         // Lấy danh sách preceedingTasks dạng mảng
//         const allPreceedingTasks = Array.from(preceedingTasks).map(task =>
//             JSON.parse(task)
//         );

//         // Loại bỏ các công việc đã được kế thừa bởi các công việc trực tiếp
//         const directPreceedingTasks = allPreceedingTasks.filter(task => {
//             const taskKey = JSON.stringify(task);
//             return !allPreceedingTasks.some(
//                 otherTask =>
//                     JSON.stringify(otherTask) !== taskKey &&
//                     preceedingTasksMap[otherTask]?.some(t => JSON.stringify(t) === taskKey)
//             );
//         });

//         // Gán danh sách preceedingTasks cho công việc hiện tại
//         preceedingTasksMap[currentTask] = directPreceedingTasks;
//     }

//     return preceedingTasksMap;
// }

// // Dữ liệu mẫu
// const tasks = [
//     [1, 3],  // Công việc 1
//     [2, 4],  // Công việc 2
//     [3, 5],  // Công việc 3
//     [4, 6],  // Công việc 4
//     [5, 7],  // Công việc 5
//     [6, 8],  // Công việc 6
//     [7, 9],  // Công việc 7
//     [8, 10], // Công việc 8
//     [9, 11], // Công việc 9
//     [10, 12],// Công việc 10
//     [11, 13],// Công việc 11
//     [11, 12],// Công việc 12
//     [12, 14],// Công việc 13
// ];

// // Thực thi
// const result = findPreceedingTasks(tasks);
// for (const [task, preceeding] of Object.entries(result)) {
//     console.log(`Công việc ${task} có preceedingTasks: ${JSON.stringify(preceeding)}`);
// }

