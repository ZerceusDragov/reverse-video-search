import express from 'express'
import multer from 'multer'
import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import {runWebDetection} from './grabLinks.js'

const PORT = process.env.PORT || 3000
const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const videosDir = path.join(__dirname, 'videos')
const screenshotsDir = path.join(__dirname, 'screenshots')
if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir)
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir)

app.use(express.json())
app.use(express.static('public'))

const storage = multer.diskStorage({
  destination: 'videos/',
  filename : (req, file, cb)=>{
    try {
      const videoName = `${Date.now()}_${crypto.randomUUID()}_${file.originalname}`
      cb(null, videoName)
    } catch (error) {
      cb(error)
    }
  }
})

const upload = multer({storage})



app.post('/search', upload.single('video'), async (req, res)=>{

  try {
    if (!req.file) {
      return res.status(400).json({error: 'No video file uploaded.'})
    }
    const videoPath = req.file.path
    const screenshotsDir = path.join(__dirname, 'screenshots')
    
    const safePrefix = req.file.filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '')
    const generatedFiles = await new Promise((resolve, reject) =>{
      let files = []
      ffmpeg(videoPath)
      .on('filenames', (filenames)=>{
        files = filenames.map(name => path.join(screenshotsDir, name))
      })
      .on('end', ()=>{
        resolve(files)
      })
      .on('error', (error)=>{
        console.error(error.message)
        reject(error)
      })
      .screenshots({
        count: 3,
        folder: screenshotsDir,
        filename: `${safePrefix}-frame-%i.png`,
        size: '320x240'
      })
    })
      
      const urlList = await runWebDetection(generatedFiles)
      console.log(urlList)
      res.json({'list': urlList})

  } catch (error) {
    res.status(500).json({error: 'this request could not be processed'})
  }
    
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});