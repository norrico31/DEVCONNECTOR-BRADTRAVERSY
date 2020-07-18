const express = require('express')
const app = express()
const connectDB = require('./config/db')

// Connect Database
connectDB()

app.get('/', (req, res) => {
    res.send('Hello from express')
})

// Define Routes
app.use('/api/users', require('./routes/users'))
app.use('/api/auth', require('./routes/auth'))
app.use('/api/profile', require('./routes/profile'))
app.use('/api/posts', require('./routes/posts'))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`[server.js]: Running on port ${PORT}`))