import XLSX from "xlsx";
import Parse from "csv-parse";

function readFile(file, encoding, cb) {
  const reader = new FileReader();
  reader.onload = () => {
    cb(reader.result);
  };
  reader.onabort = () => console.log("file reading was aborted");
  reader.onerror = () => console.log("file reading has failed");
  reader.readAsText(file, encoding || "ISO-8859-1");
}

function readODS(file, encoding) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      var workbook = XLSX.read(reader.result, {
        type: "binary"
      });
      workbook.SheetNames.forEach(function(sheetName) {
        // Here is your object
        var XL_row_object = XLSX.utils.sheet_to_row_object_array(
          workbook.Sheets[sheetName]
        );
        // var json_object = JSON.stringify(XL_row_object);
        resolve(XL_row_object);
      });
    };
    reader.onabort = () => console.log("file reading was aborted");
    reader.onerror = () => console.log("file reading has failed");
    reader.readAsBinaryString(file);
  });
}

function readXML(file, encoding) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(reader.result, "text/xml");
      resolve(xmlDoc);
    };
    reader.onabort = () => console.log("file reading was aborted");
    reader.onerror = () => console.log("file reading has failed");
    reader.readAsText(file, encoding || "utf-8");
  });
}

function readCSV(file, delimiter, encoding, quote) {
  return new Promise((resolve, reject) => {
    readFile(file, encoding, res => {
      const parser = Parse({
        delimiter: delimiter,
        from: 1,
        quote: quote || "",
        relax_column_count: true
      });
      const output = [];

      let record = null;
      let header = null;

      parser.on("readable", () => {
        while ((record = parser.read())) {
          if (!header) {
            header = [].concat(record);
            continue;
          }
          const obj = {};
          record.map((e, i) => {
            obj[header[i]] = e;
          });
          output.push(obj);
        }
      });

      // Catch any error
      parser.on("error", err => {
        reject(err.message);
      });

      // When we are done, test that the parsed output matched what expected
      parser.on("finish", () => {
        resolve(output);
      });

      parser.write(res);
      parser.end();
    });
  });
}

function parseAjoutPilote(res, object) {
  let str = res.replace(/\-\r\n/g, ""); // Parsing du fichier en ajout piloté
  var lines = str.split(/[\r\n]+/g); // tolerate both Windows and Unix linebreaks
  const notices = [];
  let obj = {};
  for (var i = 0; i < lines.length; i++) {
    if (lines[i] === "//") {
      notices.push(obj);
      obj = {};
    } else {
      const key = lines[i];
      let value = "";
      let tag = true;
      while (tag) {
        value += lines[++i];
        if (
          !(
            lines[i + 1] &&
            lines[i + 1] !== "//" &&
            (object && !object.has(lines[i + 1]))
          )
        ) {
          tag = false;
        }
      }
      if (key) {
        obj[key] = value;
      }
    }
  }
  if (Object.keys(obj).length) {
    notices.push(obj);
  }
  return notices;
}

function renameFile(file, newName) {
  let newFile = null;
  try {
    newFile = new File([file], newName, { type: file.type });
  } catch (err) {
    newFile = new Blob([file], { type: "image/jpeg" });
    newFile.name = newName;
  }
  return newFile;
}

export default {
  readFile,
  readXML,
  readCSV,
  readODS,
  parseAjoutPilote,
  renameFile
};