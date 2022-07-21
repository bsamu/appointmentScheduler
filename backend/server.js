require("dotenv").config();
const port = process.env.PORT;
const mongoose = require("mongoose");
const app = require("./app");

mongoose
    .connect(process.env.CONNECTION_STRING)
    .then(() => {
        console.log("MongoDB connected");
        app.listen(port, () => {
            console.log(`Appointment scheduler is listening on port ${port}. Run: "brew services start mongodb-community"`);
        });
    })
    .catch((error) => console.log(error));