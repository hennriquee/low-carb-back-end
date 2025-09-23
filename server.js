import express from "express";
import cors from "cors";
import { PrismaClient } from "./generated/prisma/index.js";
import cloudinary from "./cloudinary.js";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();
const app = express();
app.use(express.json());
app.use(cors());

// LOGINS DE ACESSO
const admLogins = [{ user: "Luciana", password: "lulowcarb988" }];

// Acordar o servidor
app.get("/", (req, res) => {
  res.sendStatus(200);
});

app.post("/login", (req, res) => {
  const { user, password } = req.body;
  const admin = admLogins.find(
    (adm) => adm.user === user && adm.password === password
  );

  if (admin) {
    return res.json({ token: "admloggado.200" });
  } else {
    return res.status(401).json({ error: "Usuário ou senha inválidos" });
  }
});

app.get("/produtos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const product = await prisma.produto.findFirst({ where: { id: id } });
    res.status(200).json(product);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao buscar produto", error: error.message });
  }
});

app.get("/produtos", async (req, res) => {
  try {
    const products = await prisma.produto.findMany();
    res.status(200).json(products);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao buscar produtos", error: error.message });
  }
});

app.post("/produtos/cadastro", async (req, res) => {
  try {
    await prisma.produto.create({
      data: {
        category: req.body.category,
        title: req.body.title,
        text: req.body.text,
        zerolactose: req.body.zerolactose,
        zerogluten: req.body.zerogluten,
        zerosugar: req.body.zerosugar,
        price: req.body.price,
        images: req.body.images,
      },
    });
    res.status(201).json({ message: "Produto inserido com sucesso" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao inserir produto", error: error.message });
  }
});

app.put("/produtos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.produto.update({
      where: { id: id },
      data: { ...req.body },
    });
    res.status(201).json({ message: "Produto editado com sucesso!" });
  } catch {
    res
      .status(500)
      .json({ message: "Erro ao editar produto", error: error.message });
  }
});

app.delete("/produtos/:id", async (req, res) => {
  const { id } = req.params;
  const produto = await prisma.produto.findUnique({ where: { id } });

  if (!produto) {
    return res.status(404).json({ error: "Produto não encontrado" });
  }

  if (produto.images && produto.images.length > 0) {
    for (const imageUrl of produto.images) {
      // Extrair o public_id da URL
      const parts = imageUrl.split("/");
      const fileName = parts[parts.length - 1];
      const publicId = fileName.split(".")[0]; // remove extensão

      await cloudinary.uploader.destroy(publicId);
    }
  }

  await prisma.produto.delete({
    where: { id: id },
  });

  res.status(200).json({ message: "Produto deletado com sucesso!" });
});

app.listen(3000);
