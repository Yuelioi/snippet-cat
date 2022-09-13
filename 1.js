const fs = require("fs");
const trgPath = "e:\\Project\\Snippet Cat\\javascript.txt";
const content = "const clothing = ['shoes', 'shirts', 'socks', 'sweaters'];";
fs.writeFile(
  trgPath,
  content,
  {
    encoding: "utf8",
    flag: "a",
  },
  (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("File written successfully\n");
    }
  }
);

