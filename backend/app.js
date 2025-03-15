const express = require('express');
const app =express();
const cors = require('cors');
const path = require('path');
const connectDB = require('./src/config/db')

const userRoute = require('./src/routes/userRoute')
const profileRoute = require('./src/routes/userProfileRoute')



app.use(express.json());
const port = process.env.port;
app.use(cors());
//used to connect to the database
connectDB();

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use('/api/user', userRoute)
// app.use('/api/auth', authRoute)

app.use('/api/profile', profileRoute);

app.listen(port,()=>{
    console.log(`Server is running on ${port}`)
})