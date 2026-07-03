import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { Task, AppConfig } from "./src/types";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Default paths and configurations
const CONFIG_FILE = path.join(process.cwd(), "config.json");

const DEFAULT_CONFIG: AppConfig = {
  userInitials: "MR",
  dataDir: "./data",
  exportDir: "./exports",
  hotkey: "Alt+T",
};

// Helper to load configuration
function loadConfig(): AppConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, "utf-8");
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error("Error loading config, using default:", error);
  }
  return DEFAULT_CONFIG;
}

// Helper to save configuration
function saveConfig(config: AppConfig): void {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
    // Ensure directories exist
    const resolvedDataDir = path.resolve(process.cwd(), config.dataDir);
    const resolvedExportDir = path.resolve(process.cwd(), config.exportDir);
    if (!fs.existsSync(resolvedDataDir)) {
      fs.mkdirSync(resolvedDataDir, { recursive: true });
    }
    if (!fs.existsSync(resolvedExportDir)) {
      fs.mkdirSync(resolvedExportDir, { recursive: true });
    }
  } catch (error) {
    console.error("Error saving config:", error);
  }
}

// Ensure initial configuration and folders exist
const initialConfig = loadConfig();
saveConfig(initialConfig);

// Helper to get active tasks JSON file path
function getTasksFilePath(): string {
  const config = loadConfig();
  const resolvedDataDir = path.resolve(process.cwd(), config.dataDir);
  if (!fs.existsSync(resolvedDataDir)) {
    fs.mkdirSync(resolvedDataDir, { recursive: true });
  }
  return path.join(resolvedDataDir, "activities.json");
}

// Helper to read tasks
function readTasks(): Task[] {
  const filePath = getTasksFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading tasks:", error);
  }
  return [];
}

// Helper to write tasks
function writeTasks(tasks: Task[]): void {
  const filePath = getTasksFilePath();
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing tasks:", error);
  }
}

// API Routes

// Get configuration
app.get("/api/config", (req, res) => {
  res.json(loadConfig());
});

// Update configuration
app.post("/api/config", (req, res) => {
  const newConfig = req.body as AppConfig;
  if (!newConfig.userInitials || !newConfig.dataDir || !newConfig.exportDir) {
    res.status(400).json({ error: "Missing required configuration fields" });
    return;
  }
  // Trim and validate initials
  newConfig.userInitials = newConfig.userInitials.trim().toUpperCase().slice(0, 4);
  saveConfig(newConfig);
  res.json({ message: "Configuración guardada con éxito", config: newConfig });
});

// Get all tasks
app.get("/api/tasks", (req, res) => {
  res.json(readTasks());
});

// Create task
app.post("/api/tasks", (req, res) => {
  const { date, status, type, category, description, duration, rawText, userInitials: bodyInitials } = req.body;

  if (!date || !type || !category || !description || !duration) {
    res.status(400).json({ error: "Faltan campos obligatorios" });
    return;
  }

  const tasks = readTasks();
  const config = loadConfig();
  const userInitials = (bodyInitials || config.userInitials || "MR").trim().toUpperCase().slice(0, 4);

  // Create date components for ID: DDMMAAAA
  // date is YYYY-MM-DD
  const dateParts = date.split("-");
  if (dateParts.length !== 3) {
    res.status(400).json({ error: "Formato de fecha inválido (debe ser YYYY-MM-DD)" });
    return;
  }
  const year = dateParts[0];
  const month = dateParts[1];
  const day = dateParts[2];
  const ddmmaaaa = `${day}${month}${year}`;

  // Find consecutive daily number
  const prefix = `T-${ddmmaaaa}-${userInitials}`;
  
  // Find all tasks for this exact day and user initials prefix to calculate consecutive
  const dailyTasks = tasks.filter(t => t.id.startsWith(prefix));
  
  let nextSeq = 1;
  if (dailyTasks.length > 0) {
    const seqNumbers = dailyTasks.map(t => {
      const parts = t.id.split("-");
      const lastPart = parts[parts.length - 1]; // II## (e.g. MR01)
      const numberStr = lastPart.slice(userInitials.length); // Extract numeric part
      const parsed = parseInt(numberStr, 10);
      return isNaN(parsed) ? 0 : parsed;
    });
    nextSeq = Math.max(...seqNumbers) + 1;
  }

  const seqStr = nextSeq.toString().padStart(2, "0");
  const generatedId = `${prefix}${seqStr}`;

  // Set time of creation
  const now = new Date();
  const timeCreated = now.toTimeString().split(" ")[0]; // HH:MM:SS

  const newTask: Task = {
    id: generatedId,
    date,
    timeCreated,
    type,
    category,
    description,
    duration,
    rawText,
  };

  tasks.push(newTask);
  writeTasks(tasks);

  res.json({ message: "Actividad guardada con éxito", task: newTask });
});

// Update task
app.put("/api/tasks/:id", (req, res) => {
  const { id } = req.params;
  const updatedData = req.body as Partial<Task>;

  const tasks = readTasks();
  const index = tasks.findIndex(t => t.id === id);

  if (index === -1) {
    res.status(404).json({ error: "Actividad no encontrada" });
    return;
  }

  // Preserve the original id, date, and creation time, unless explicitly requested, but usually they stay the same
  tasks[index] = {
    ...tasks[index],
    ...updatedData,
    id: tasks[index].id, // Maintain ID
  };

  writeTasks(tasks);
  res.json({ message: "Actividad actualizada con éxito", task: tasks[index] });
});

// Delete task
app.delete("/api/tasks/:id", (req, res) => {
  const { id } = req.params;

  let tasks = readTasks();
  const initialLength = tasks.length;
  tasks = tasks.filter(t => t.id !== id);

  if (tasks.length === initialLength) {
    res.status(404).json({ error: "Actividad no encontrada" });
    return;
  }

  writeTasks(tasks);
  res.json({ message: "Actividad eliminada con éxito" });
});

// Export tasks API
app.post("/api/export", (req, res) => {
  const { type, specificDate, startDate, endDate, userInitials } = req.body;
  const tasks = readTasks();
  const config = loadConfig();

  let filteredTasks = [...tasks];

  // Sorting tasks chronologically (by date then timeCreated)
  filteredTasks.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.timeCreated.localeCompare(b.timeCreated);
  });

  if (type === "day" && specificDate) {
    filteredTasks = filteredTasks.filter(t => t.date === specificDate);
  } else if (type === "range" && startDate && endDate) {
    filteredTasks = filteredTasks.filter(t => t.date >= startDate && t.date <= endDate);
  } // else: export all

  if (userInitials) {
    const upperInitials = userInitials.trim().toUpperCase();
    filteredTasks = filteredTasks.filter(t => {
      // ID format is T-DDMMAAAA-II##
      const parts = t.id.split("-");
      if (parts.length >= 3) {
        const lastPart = parts[2]; // e.g. MR01
        return lastPart.toUpperCase().startsWith(upperInitials);
      }
      return false;
    });
  }

  // Map translations for full names in export as requested
  const typeLabels: Record<string, string> = {
    Sys: "Sistemas",
    Com: "Comercial",
    Op: "Operaciones",
    MKT: "Marketing",
    Ab: "Abasto",
    Sop: "Soporte"
  };

  const categoryLabels: Record<string, string> = {
    B: "Bug",
    DTec: "Deuda Técnica",
    SOp: "Soporte Operativo",
    UInc: "Uso Incorrecto",
    RNeg: "Requerimiento de Negocio",
    DFunc: "Duda Funcional",
    Otr: "Otro"
  };

  // Build the export output string exactly as specified:
  /*
  [ID]: T-27042026-MR01
  Estatus: Reportado
  Tipo: Comercial
  Categoría: Requerimiento de negocio
  Descripción: Apoyo a equipo de FARMACIA para carga de "REBAJADO DE DESCUENTOS"
  Tiempo: 5 hrs

  ------------------------------------------------------------
  */
  let exportText = "";
  filteredTasks.forEach((t, idx) => {
    const tLabel = typeLabels[t.type] || t.type;
    const cLabel = categoryLabels[t.category] || t.category;

    exportText += `[ID]: ${t.id}\n`;
    exportText += `Tipo: ${tLabel}\n`;
    exportText += `Categoría: ${cLabel}\n`;
    exportText += `Descripción: ${t.description}\n`;
    exportText += `Tiempo: ${t.duration}\n`;

    if (idx < filteredTasks.length - 1) {
      exportText += `\n------------------------------------------------------------\n\n`;
    }
  });

  // Save export file to default export directory
  const resolvedExportDir = path.resolve(process.cwd(), config.exportDir);
  if (!fs.existsSync(resolvedExportDir)) {
    fs.mkdirSync(resolvedExportDir, { recursive: true });
  }

  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-");
  let filename = `export_all_${timestamp}.txt`;
  
  if (type === "day" && specificDate) {
    filename = `export_${specificDate.replace(/-/g, "")}.txt`;
  } else if (type === "range" && startDate && endDate) {
    filename = `export_range_${startDate.replace(/-/g, "")}_to_${endDate.replace(/-/g, "")}.txt`;
  }

  const exportFilePath = path.join(resolvedExportDir, filename);
  try {
    fs.writeFileSync(exportFilePath, exportText, "utf-8");
  } catch (error) {
    console.error("Error writing export file to disk:", error);
  }

  res.json({
    message: "Actividades exportadas correctamente",
    filename,
    filePath: exportFilePath,
    content: exportText,
    count: filteredTasks.length,
  });
});

// Open export folder in server workspace / backup simulation
app.get("/api/backup", (req, res) => {
  const config = loadConfig();
  const dataPath = path.resolve(process.cwd(), config.dataDir);
  const exportPath = path.resolve(process.cwd(), config.exportDir);
  
  // List files in data folder
  let dataFiles: string[] = [];
  try {
    if (fs.existsSync(dataPath)) {
      dataFiles = fs.readdirSync(dataPath);
    }
  } catch (e) {}

  // List files in export folder
  let exportFiles: string[] = [];
  try {
    if (fs.existsSync(exportPath)) {
      exportFiles = fs.readdirSync(exportPath);
    }
  } catch (e) {}

  res.json({
    dataDir: config.dataDir,
    exportDir: config.exportDir,
    resolvedDataDir: dataPath,
    resolvedExportDir: exportPath,
    dataFiles,
    exportFiles,
  });
});

// Vite middleware setup or production serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
