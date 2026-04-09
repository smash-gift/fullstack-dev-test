import cors from "cors";
import express, { json } from "express";
import handleErrorMiddleware from "./middlewares/handleErrorMiddleware";
import router from "./routes";

const app = express();

app.use(cors());
app.use(json());
app.use(router);
app.use(handleErrorMiddleware);

export default app;
