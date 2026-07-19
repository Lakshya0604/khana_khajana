import multer from 'multer'

// Disk storage hata diya — Render ka filesystem ephemeral hai,
// isliye file ko disk pe save karne ki koshish crash kar rahi thi (ENOENT error)
const storage = multer.memoryStorage()
// memoryStorage() file ko RAM mein buffer ke roop mein rakhta hai,
// disk pe kabhi likhta hi nahi — isliye "public" folder exist kare
// ya na kare, koi farak nahi padega

export const upload = multer({ storage })