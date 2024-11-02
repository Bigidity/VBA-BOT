const mongoose = require('mongoose');

const uri = 'mongodb+srv://sennevangerven214:Senne09V@cluster0.dcup2.mongodb.net/'; // Replace with your MongoDB URI

mongoose.connect(uri)
    .then(() => {
        console.log("Connection successful!");
        mongoose.disconnect();
    })
    .catch((error) => console.error("Connection failed:", error));
