import mongoose from "mongoose";
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: "Krescent-collab",
        });
        console.log("MongoDB connected");
    }
    catch (error) {
        console.error("MongoDB connection failed", error);
        process.exit(1);
    }
};
export default connectDB;
//# sourceMappingURL=db.js.map