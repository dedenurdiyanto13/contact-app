const mongoose = require("mongoose");

mongoose.connect(
  "mongodb+srv://dede:ananiu12@cluster0.qiqgntv.mongodb.net/?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  }
);
