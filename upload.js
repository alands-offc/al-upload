const express = require('express');
const multer = require('multer');
const methodOverride = require('method-override');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.set('json spaces', 2);
app.use(methodOverride('_method'));

global.baseurl;

// Middleware untuk mendapatkan base URL
app.use((req, res, next) => {
  const host = req.get('host');
  global.baseurl = `https://${host}/`;
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
  <a href="/">Back to Home</a>
</body>
</html>
  `;
}

// Setup untuk direktori penyimpanan
const TMP_DIR = "/tmp/"


// Konfigurasi penyimpanan file dengan multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TMP_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Route untuk upload file
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const filePath = path.join(TMP_DIR, req.file.filename);
    res.json({ 
      Url: global.baseurl + "files/" + req.file.filename, 
      fileName: req.file.originalname,
      path: filePath 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route untuk menampilkan file
app.get('/files/:filename', async (req, res) => {
  try {
    const filePath = path.join(TMP_DIR, req.params.filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ err: 'No file exists' });
    }

    const mimeType = mime.getType(filePath);
    res.set('Content-Type', mimeType);
    res.set('Content-Disposition', 'inline'); // Pastikan ditampilkan secara inline
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route untuk download file
app.get('/download/:filename', async (req, res) => {
  try {
    const filePath = path.join(TMP_DIR, req.params.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ err: 'No file exists' });
    }

    const originalFileName = req.params.filename.split('-').slice(1).join('-'); // Mengambil nama asli file
    res.set('Content-Disposition', `attachment; filename="${originalFileName}"`);
    res.download(filePath, originalFileName);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
  console.log(`Server running at http://localhost:${PORT}`);
});