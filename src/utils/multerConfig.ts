import multer from "multer";
import path from "path";
import fs from "fs";
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    // Create the directory if it doesn't exist
    fs.mkdir(uploadDir, { recursive: true }, (err) => {
      cb(err, uploadDir);
    });
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${file.originalname}`;
    cb(null, unique);
  }
});

export const upload = multer({ storage });

