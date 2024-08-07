const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const methodOverride = require('method-override');
const app = express();
const PORT = 3000;
const path = require("path")
app.use(express.json());
app.set('json spaces', 2);
app.use(methodOverride('_method'));
global.baseurl

app.use((req, res, next) => {

const host = req.get('host');
global.baseurl = `https://${host}/upload/`;
next();
});
function generateErrorPage(status, message) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error ${status}</title>
  <style>
    body {
      background-image: url('https://telegra.ph/file/6877f86f35d68bd8c10a4.jpg');
      color: white;
      text-align: center;
      font-family: Arial, sans-serif;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      margin: 0;
    }
    h1 {
      font-size: 5em;
      animation: blink 1s step-end infinite;
    }
    p {
      font-size: 2em;
    }
    a {
      font-size: 1.5em;
      color: lightblue;
      text-decoration: none;
      margin-top: 20px;
    }
    @keyframes blink {
      from, to {
        visibility: hidden;
      }
      50% {
        visibility: visible;
      }
    }
  </style>
</head>
<body>
  <h1>Error ${status}</h1>
  <p>${message}</p>
  <a href="/docs">Back to Docs</a>
</body>
</html>
  `;
}

// Error handling middleware

const mongoURI = 'mongodb+srv://alanqwerty:qwerty123@cluster0.cjvb1q8.mongodb.net/mydatabase?retryWrites=true&w=majority'; 
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB udh konek'))
  .catch(err => console.error(err));
const fileSchema = new mongoose.Schema({
  filename: String,
  originalname: String,
  buffer: Buffer,
  size: Number,
  mimetype: String,
  uploadDate: { type: Date, default: Date.now }
});
const File = mongoose.model('File', fileSchema);
const storage = multer.memoryStorage();
const upload = multer({ storage });
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const newFile = new File({
      filename: req.file.originalname,
      originalname: req.file.originalname,
      buffer: req.file.buffer,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
    await newFile.save();
    res.json({ Url: global.baseurl + newFile._id, fileId: newFile._id, fileName: newFile.originalname });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/files/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ err: 'No file exists' });
    }

    res.set('Content-Type', file.mimetype);
    res.send(file.buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).send(generateErrorPage(status, err.message || 'Internal Server Error'));
});

// 404 Not Found middleware
app.use((req, res) => {
  res.status(404).send(generateErrorPage(404, 'Page Not Found'));
});
app.listen(PORT, () => {
  console.log(`Serper jalan di http://localhost:${PORT}`);
});
