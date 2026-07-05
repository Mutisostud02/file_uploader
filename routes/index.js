const home = require('../controllers');
const { isAuthenticated } = require('../controllers/isAuthenticated');
const index = require('express').Router()

//multer middleware
const express = require('express')
const multer  = require('multer');
const { prisma } = require('../lib/prisma');
const fs = require("fs/promises");
const cloudinary = require('../lib/cloudinary.js')

//routes
index.get('/', home.home);
index.get('/protected-route', isAuthenticated, home.protectedRoute)
index.get('/fileUploader', isAuthenticated, home.fileUploaderGet)
index.get('/fileUploader/files/:id', home.getFile)
index.get('/logout', isAuthenticated, home.logOut);
index.post('/fileUploader/files/delete/:id', isAuthenticated, home.deleteFile);
index.post('/fileUploader/delete/:id', isAuthenticated, home.deleteFolderFile);
index.post('/folders', isAuthenticated, home.createFolder)
index.get('/fileUploader/folders/:id', isAuthenticated, home.getFolder)
index.get('/folders/:id/edit', isAuthenticated, home.editFolder)
index.post('/folders/:id/edit', isAuthenticated, home.updateFolder)
index.post('/folders/delete/:id', isAuthenticated, home.deleteFolder)
index.post('/fileUploader/folders/delete/:id', isAuthenticated, home.deleteFile)
index.get('/fileUploader/files/download/:id', isAuthenticated, home.downloadFile)

//multer config validate
const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
    "text/plain",
];

const upload = multer({
    dest: "uploads/",
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
    },
    fileFilter(req, file, cb) {
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Unsupported file type"));
        }
    },
});


//multer routes
index.post("/fileUploader", (req, res, next) => {
    upload.array("files", 10)(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).send("Each file must be smaller than 10 MB.");
            }
        }

        if (err) {
            return res.status(400).send(err.message);
        }

        next();
    });
}, async (req, res, next) => {
    try {
        console.log(req.files)
        const folderId = req.body.folderId ? Number(req.body.folderId) : null

        await Promise.all(
            req.files.map(async (file) => {
            try {
                const result = await cloudinary.uploader.upload(file.path, {
                    resource_type: "auto",
                });

                await prisma.file.create({
                    data: {
                        file_url: result.secure_url,
                        public_id: result.public_id,
                        resourceType: result.resource_type,
                        originalName: file.originalname,
                        mimeType: file.mimetype,
                        userId: req.user.id,
                        folderId,
                    }
                });
            } finally {
                await fs.unlink(file.path).catch(() => {});
            }
    })
);
        res.redirect('/fileUploader')
    } catch(err) {
        next(err)
    }
})

module.exports = index;