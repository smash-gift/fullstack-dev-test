import dotenv from "dotenv";
import app from "./app";

dotenv.config();

const PORT: number = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
