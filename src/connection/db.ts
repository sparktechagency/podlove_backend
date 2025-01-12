import mongoose from "mongoose";
import to from "await-to-ts";

const connectDB = async (uri: string) => {
  const [error] = await to(mongoose.connect(uri));
  if (error) {
    console.error(error);
    return;
  }
  console.log("Database connected successfully");
};

export default connectDB;
