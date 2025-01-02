const XLSX = require("xlsx");
const fs = require("fs");

const readEmployee = ({filename}) => {
    // Đọc file Excel
    const workbook = XLSX.readFile(filename); // Thay bằng đường dẫn thực tế
    // const sheetName = workbook.SheetNames[0]; // Chọn sheet đầu tiên
    const sheet = workbook.Sheets["Input_Employee"];
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    // Format dữ liệu như yêu cầu
    const employees = jsonData.map((row) => ({
      id: row["Employee ID"],
      name: row["Employee Name"],
      employeeNumber: row["Employee Code"],
      position: "Staff", // Mặc định vị trí hoặc có thể sửa theo yêu cầu
      tags: [],
      level: 5, // Nếu cần, bạn có thể tính từ "degree" hoặc các cột khác
      costPerHour: row["Cost Per Hour"],
      qualities: row["Capacities"]
      ? Object.fromEntries(
          row["Capacities"]
            .replace(/[\[\]]/g, "") // Loại bỏ dấu []
            .split(", ")
            .map((attr) => attr.split(": ").map((v) => (isNaN(v) ? v : Number(v)))) // Chuyển đổi giá trị số
        )
      : {},
    }));

    // Ghi kết quả vào file JS
    const outputJS = `const employees = ${toJSFormat(employees,2)};`;
    fs.writeFileSync("./data_processing/xlsxToJs/employee.js", outputJS);

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

module.exports = readEmployee
