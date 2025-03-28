import multer from "multer"

const storage = multer.diskStorage(
    {
        destination: function (req, file, cb) {
            cb(null, './public/temp')
        },
    
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
            cb(null, file.fieldname + '-' + uniqueSuffix)
        }
    }
)

export const upload = multer({ storage })

/*
It allows users to upload images, videos, PDFs, and other files to the server or cloud.
Multer processes files in req.file (for single files) or req.files (for multiple files)
*/