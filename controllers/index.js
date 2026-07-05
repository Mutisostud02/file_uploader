const { prisma } = require("../lib/prisma");
const cloudinary = require('../lib/cloudinary.js')

function home(req, res) {
    res.render('home')
}

async function protectedRoute(req, res) {  
    res.render('protected-route', { currentUser: req.user});
}

async function fileUploaderGet(req, res, next) {  
    try {
        const user = await prisma.user.findUnique({ 
            where: {id: req.user.id},
            include: {
                folders: {
                    include: {
                        files: true
                    }
                },
                files: {
                    where: {
                        folderId: null
                    }
                }
            },
        })
        res.render('fileUploader', { 
            currentUser: req.user,
            user: user,
            deleted: req.query.deleted,
            files: user.files || [],
            folders: user.folders || [],
            created: req.query.created,
            updated: req.query.updated,
        });
    } catch(err) {
        next(err)
    }

}
async function deleteFolderFile(req, res, next) {
    try {
        const fileId = Number(req.params.id);

        const file = await prisma.file.findFirst({
            where: {
                id: fileId,
                userId: req.user.id
            },
            select: {
                folderId: true,
                public_id: true
            }
        })

        if(!file) {
            return res.status(404).send("File not found.")
        }
        const result = await cloudinary.uploader.destroy(file.public_id);

        if (result.result !== "ok" && result.result !== "not found") {
            throw new Error("Failed to delete file from Cloudinary");
        }

        const folderId = file.folderId;
        await prisma.file.delete({
            where: {
                id: fileId
            }
        })

        if(folderId) {
            return res.redirect(`/fileUploader/folders/${folderId}?deleted=true`)
        }
        return res.redirect('/fileUploader?deleted=true');

    } catch(err) {
        next(err)
    }
}

async function deleteFile(req, res, next) {
    try {
        const fileId = Number(req.params.id);

        const file = await prisma.file.findFirst({
            where: {
                id: fileId,
                userId: req.user.id
            }
        })

        if(!file) {
            return res.status(404).send("File not found.")
        }

        const result = await cloudinary.uploader.destroy(file.public_id);

        if (result.result !== "ok" && result.result !== "not found") {
            throw new Error("Failed to delete file from Cloudinary");
        }

        await prisma.file.delete({
            where: {
                id: fileId
            }
        })

        return res.redirect('/fileUploader');

    } catch(err) {
        next(err)
    }
}
async function createFolder(req, res, next) {
    try {
        const folderName = req.body.folder_name
        ?.trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

        if(!folderName) {
            return res.redirect('/fileUploader?error=empty_folder');
        }
        await prisma.folder.create({
            data: {
                name: folderName,
                userId: req.user.id,
            }
        })
        return res.redirect('/fileUploader?created=true')
    } catch(err) {
        if(err.code === 'P2002') {
            return res.redirect('/fileUploader?error=folder_exists')
        }
        next(err)
    }
}

async function getFolder(req, res, next) {
    try {
        const folderId = Number(req.params.id);

        const folder = await prisma.folder.findFirst({
            where: {
                id: folderId,
                userId: req.user.id
            },
            include: {
                files: true
            }
        })
        
        if(!folder) {
            return res.status(404).send("Folder not found.")
        }

        res.render("folder", {
            folder,
            files: folder.files,
            currentUser: req.user
        })
                                
    } catch(err) {
        next(err)
    }
}

async function editFolder(req, res, next) {
    try {
        const folderId = Number(req.params.id);
        const folder = await prisma.folder.findFirst({
            where: {
                id: folderId,
                userId: req.user.id
            }
        });
        if(!folder) {
            return res.status(404).send("Folder not found")
        }    
        res.render("editFolder", {folder})

    } catch (err) {
        next(err)
    }
}

async function updateFolder(req, res, next) {
    try {
        const folderId = Number(req.params.id);
        const name = req.body.folder_name
        ?.trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

        if(!name) {
            return res.redirect(`/folders/${folderId}/edit?error=empty`)
        }

        const folder = await prisma.folder.findFirst({
            where: {
                id: folderId,
                userId: req.user.id
            }
        })
        
        if(!folder) {
            return res.status(404).send("Folder not found")
        }

        await prisma.folder.update({
            where: {
                id: folderId
            },
            data: {
                name,
            }
        });
        res.redirect("/fileUploader?updated=true")

    } catch (err) {
        if (err.code === "P2002") {
            return res.redirect(`/folders/${req.params.id}/edit?error=exists`);
        }

        next(err);
    }
}

async function deleteFolder(req, res, next) {
    try {
        const folderId = Number(req.params.id);

        const folder = await prisma.folder.findFirst({
            where: {
                id: folderId,
                userId: req.user.id
            },
            include: {
                files: true
            }
        });

        if(!folder) {
            return res.status(404).send("Folder not found")
        }

        await Promise.all(
            folder.files.map(async (file) => {
                const result = await cloudinary.uploader.destroy(file.public_id);

                if (result.result !== "ok" && result.result !== "not found") {
                    throw new Error("Failed to delete file from Cloudinary");
                }
            })
        )

        await prisma.folder.delete({
            where: {
                id: folderId
            }
        })
        res.redirect('/fileUploader')

    } catch(err) {
        next(err)
    }
}

async function getFile(req, res, next) {
    try {
        const fileId = Number(req.params.id);
        const file = await prisma.file.findFirst({
            where: {
                id : fileId,
                userId: req.user.id,
            }
    })
    if(!file) {
        return res.status(404).send("File not found!")
    }
    res.render("file", {
        file
    })
    } catch(err) {
        next(err)
    }
}

async function logOut(req, res, next) {
    req.logout((err) => {
        if(err) {
            return next(err);
        }
        res.redirect("/")
    })
}

async function downloadFile(req, res, next) {
    try {
        const fileId = Number(req.params.id);

        const file = await prisma.file.findFirst({
            where: {
                id: fileId,
                userId: req.user.id,
            }
        })

        if(!file) {
            return res.status(404).send("File not found");
        }

        const url = cloudinary.url(file.public_id, {
            flags: "attachment",
            resource_type: file.resourceType,
        });

        res.redirect(url);

    } catch(err) {
        next(err)
    }
}

module.exports = { 
    home, 
    deleteFile, 
    deleteFolderFile, 
    protectedRoute, 
    fileUploaderGet, 
    createFolder,
    getFolder,
    editFolder,
    getFile,
    updateFolder,
    deleteFolder,
    downloadFile,
    logOut,
}
