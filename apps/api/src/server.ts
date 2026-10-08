import { createApp } from "./app";
import { env } from "./config/env";

createApp().listen(env.PORT, () => {
  console.log(`RuangDana API berjalan di http://localhost:${env.PORT}`);
});
