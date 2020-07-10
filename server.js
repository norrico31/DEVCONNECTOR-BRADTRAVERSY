const express = require('express')
const app = express()

app.get('/', (req, res) => {
    res.send('Hello from express')
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`[server.js]: Running on port ${PORT}`))