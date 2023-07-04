const multer = require("multer");
const path = require("path");
const { existsSync, mkdirSync } = require("node:fs");

const dir = "./uploads/customer/image";
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    let math = ["image/png", "image/jpeg", "image/jpg"];
    if (math.indexOf(file.mimetype) === -1) {
      let errorMess = `The file <strong>${file.originalname}</strong> is invalid. Only allowed to upload image jpeg or png.`;
      return cb(errorMess, null);
    }

    // console.log("log", file);
    cb(null, `${dir}`);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const uploadImageUser = multer({ storage: storage });

module.exports = uploadImageUser;
