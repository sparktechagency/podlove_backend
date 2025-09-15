import multer from "multer";
import path from "path";
import fs from "fs";
// const storage = multer.diskStorage({
//   destination: (_req, _file, cb) => {
//     const uploadDir = path.join(__dirname, '../../uploads');
//     // Create the directory if it doesn't exist
//     fs.mkdir(uploadDir, { recursive: true }, (err) => {
//       cb(err, uploadDir);
//     });
//   },
//   filename: (_req, file, cb) => {
//     const unique = `${Date.now()}-${file.originalname}`;
//     cb(null, unique);
//   }
// });

const BASE_UPLOAD_DIR = path.join(__dirname, "../../uploads");

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    // choose subfolder by fieldname or mimetype
    // console.log("file: ", file)
    let subFolder: string;
    if (file.fieldname === "recording" || file.mimetype.startsWith("audio/")) {
      subFolder = "recordings";
    } else if (file.fieldname === "avatar" || file.mimetype.startsWith("image/")) {
      subFolder = "images";
    } else {
      return cb(new Error("Unexpected file field or type"), "");
    }

    const uploadPath = path.join(BASE_UPLOAD_DIR, subFolder);
    // ensure it exists
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },

  filename: (_req, file, cb) => {
    // use fieldname as prefix + timestamp + original extension
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}${ext}`);
  },
});

// only allow audio OR images on their fields
function fileFilter(_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (
    (file.fieldname === "recording" && file.mimetype.startsWith("audio/")) ||
    (file.fieldname === "avatar" && file.mimetype.startsWith("image/"))
  ) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid upload for field ${file.fieldname}`));
  }
}


export const upload = multer({ storage, fileFilter });

