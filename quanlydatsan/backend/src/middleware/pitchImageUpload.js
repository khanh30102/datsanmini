const fs = require('fs');
const path = require('path');
const multer = require('multer');

const imageExtensions = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif']
]);
const uploadDirectory = path.join(__dirname, '../../uploads/pitches');

fs.mkdirSync(uploadDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadDirectory),
    filename: (_req, file, callback) => callback(null, `${require('crypto').randomUUID()}${imageExtensions.get(file.mimetype)}`)
  }),
  fileFilter: (_req, file, callback) => {
    if (!imageExtensions.has(file.mimetype)) {
      return callback(new Error('Chỉ chấp nhận ảnh JPG, PNG, WEBP hoặc GIF.'));
    }
    return callback(null, true);
  },
  limits: { files: 5, fileSize: 5 * 1024 * 1024 }
});

function uploadPitchImages(req, res, next) {
  upload.array('images', 5)(req, res, (error) => {
    if (!error) return next();
    const tooLarge = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE';
    const tooMany = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_COUNT';
    return res.status(tooLarge || tooMany ? 413 : 400).json({
      message: tooLarge ? 'Mỗi ảnh không được vượt quá 5 MB.' : tooMany ? 'Chỉ được tải lên tối đa 5 ảnh mỗi lần.' : error.message
    });
  });
}

module.exports = uploadPitchImages;