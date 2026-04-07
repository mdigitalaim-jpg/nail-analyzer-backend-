const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Servidor funcionando 🚀");
});

app.post("/analyze", (req, res) => {
  const { image_url } = req.body;

  console.log("Imagen recibida:", image_url);

  const result = "Curvatura 40% hacia la derecha";

  res.json({ result });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
