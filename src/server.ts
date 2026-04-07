import express from "express";
import { env } from "./config/env.js";
import { notifyRouter } from "./routes/notify.route.js";

const app = express();

app.use(express.json());

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
