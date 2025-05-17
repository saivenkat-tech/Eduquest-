const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(fileUpload());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

app.post('/ask', async (req, res) => {
  const question = req.body.question;
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: question }]
      })
    });
    const data = await response.json();
    res.json({ answer: data.choices[0].message.content });
  } catch (error) {
    console.error('AI error:', error);
    res.status(500).json({ answer: 'Error reaching AI service.' });
  }
});

app.post('/upload', (req, res) => {
  if (!req.files || !req.files.file) return res.status(400).send('No file uploaded.');
  const file = req.files.file;
  const uploadPath = path.join(uploadDir, file.name);
  file.mv(uploadPath, err => {
    if (err) return res.status(500).send(err);
    res.send('File uploaded!');
  });
});

app.get('/files', (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.status(500).send('Unable to list files.');
    res.json(files);
  });
});

app.listen(PORT, () => console.log(`EduQuest backend running on port ${PORT}`));
