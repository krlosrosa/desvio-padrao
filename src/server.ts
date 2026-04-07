import express from "express";
import { env } from "./config/env.js";
import { notifyRouter } from "./routes/notify.route.js";

const app = express();

app.use(express.json({ limit: "512kb" }));
app.use(express.urlencoded({ extended: true, limit: "512kb" }));
app.use(express.text({ type: ["text/*", "application/xml"], limit: "512kb" }));
app.use(express.raw({ type: "application/octet-stream", limit: "512kb" }));

app.use(notifyRouter);

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const message =
      err instanceof Error ? err.message : "Erro interno ao processar a notificação";

    res.status(502).json({ ok: false, error: message });
  },
);

app.listen(env.PORT, () => {
  console.log(`Servidor em http://localhost:${env.PORT}`);
});
