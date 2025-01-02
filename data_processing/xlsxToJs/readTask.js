const XLSX = require("xlsx");
const fs = require("fs");

const readTask = ({filename}) => {
    // Đọc file Excel
    const workbook = XLSX.readFile(filename); // Thay bằng đường dẫn thực tế
    // const sheetName = workbook.SheetNames[0]; // Chọn sheet đầu tiên
    const sheet = workbook.Sheets["Input_Task"];
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    const tasks = jsonData.map((row) => ({
      id: row["Task ID"],
      code: row["Task Code"],
      name: row["Task Name"],
      preceedingTasks: row["Preceeding Tasks"]
        ? row["Preceeding Tasks"].split(",").map(Number)
        : [],
      startTime: row["Start Time"],
      endTime: row["End Time"],
      requireAsset:null,
      //  row["Require Asset"]
      //   ? eval('(' + row["Require Asset"].replace(/(\w+):\s*(\w+)/g, (match, p1, p2) => {
      //       if (p2.match(/[a-zA-Z]/)) { // Kiểm tra nếu giá trị là một chuỗi không phải số
      //         return `${p1}:"${p2}"`; // Thêm dấu ngoặc kép vào giá trị
      //       }
      //       return match; // Trả về match nguyên bản nếu giá trị không phải chuỗi
      //     }) + ')')
      //   : [],
      tags: row["Tags"] ? row["Tags"].split(", ") : [],
      estimateTime: row["Estimate Time"] ? Number(row["Estimate Time"]) : 0,
      requireAssign: row["Require Assign"]
        ? Object.fromEntries(
            row["Require Assign"].split(", ").map((assign) => {
              const [key, value] = assign.split(": ");
              return [key, Number(value)];
            })
          )
        : {},
      kpiInTask: row["KPI In Task"]
        ? row["KPI In Task"].split(", ").map((kpi) => {
            const [id, type, weight] = kpi.split("-");
            return {
              id: Number(id),
              type: type.trim(),
              weight: Number(weight),
            };
          })
        : [
            {
              id: 1,
              type: "A",
              weight: 1/68,
            }
          ],
    }));

    // Ghi kết quả vào file JS
    const outputJS = `const tasks = ${toJSFormat(tasks, 2)}; module.exports = {
  tasks,
}`;
    fs.writeFileSync("/Users/gioi/Documents/learn/hust/datn/gr2/GR2/data_processing/xlsxToJs/task.js", outputJS);

    console.log("File JS đã được tạo thành công!");
}

// Hàm chuyển đổi và định dạng dữ liệu JS với thụt lề
function toJSFormat(obj, indent = 2) {
    const space = " ".repeat(indent);
  
    if (Array.isArray(obj)) {
      return `[\n${obj.map((item) => space + toJSFormat(item, indent + 2)).join(",\n")}\n]`;
    } else if (typeof obj === "object" && obj !== null) {
      const entries = Object.entries(obj).map(
        ([key, value]) => `${space}${key}: ${toJSFormat(value, indent + 2)}`
      );
      return `{\n${entries.join(",\n")}\n${" ".repeat(indent - 2)}}`;
    } else if (typeof obj === "string") {
      return `"${obj}"`;
    } else {
      return obj;
    }
  }

module.exports = readTask
