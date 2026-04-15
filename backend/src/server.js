import app from "./app.js";
import { config } from "./config.js";
import { connectDB } from "./db.js";

async function bootstrap() {
  await connectDB();

  app.listen(config.port, () => {
    console.log(`Servidor rodando na porta ${config.port}`);
  });
}

bootstrap().catch((err) => {
  console.error("Falha ao iniciar servidor:", err);
  process.exit(1);
});