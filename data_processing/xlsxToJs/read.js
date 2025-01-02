const readEmployee = require("./readEmployee.js");
const readTask = require("./readTask.js");

const read = ({filename}) => {
    // readEmployee({filename});
    readTask({filename});

}

read({filename: "/Users/gioi/Documents/learn/hust/datn/gr2/GR2/data_processing/data/project3.xlsx"}); // Thay bằng đường dẫn thực tế