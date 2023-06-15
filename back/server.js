const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const app = express();
const fs = require('fs');
const cors = require("cors");
app.use(cors());
app.use(fileUpload());

app.post('/upload', (req, res) => {
  if (req.files && Object.keys(req.files).length !== 0) {
    const file = req.files.file;
    const fileName = file.name;

    const directoryPath = path.join(__dirname, "../public/audio");
    fs.readdir(directoryPath , (err, files) => {
      const fileList = files;
      const existFile = fileList.find(name => name === fileName);
      if (existFile) {
         res.status(200).json({ flag: false, message: 'Existe file: ' + existFile });
      } else {
         file.mv(path.join(__dirname, './../public/audio', fileName), (err) => {
            if (err) {
              console.error(err);
              res.status(500).json({ flag: false, message: err });
            } else {
              files.push(fileName);
              res.status(200).json({ flag: true, list: files, message: 'File uploaded!' });
            }
          });  
      } 
    });

  } else {
    res.status(400).json({ flag: false, message: 'No file uploaded' });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));