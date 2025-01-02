
    // Ghi kết quả vào file JS
    const outputJS = `const tasks = ${toJSFormat(tasks, 2)}; module.exports = {
  tasks,
}`;
    fs.writeFileSync("/Users/gioi/Documents/learn/hust/datn/gr2/GR2/data_processing/xlsxToJs/task.js", outputJS);