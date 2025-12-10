module.exports = {
MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/hallmatrix',
JWT_SECRET: process.env.JWT_SECRET || 'devsecret',
PORT: process.env.PORT || 4000
}