import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  deleteDoc, 
  writeBatch
} from "firebase/firestore";
import { Task } from "./types";

// COLOQUE AQUÍ SU CONFIGURACIÓN DE FIREBASE O UTILICE VARIABLES DE ENTORNO
// Puede definir estas variables con el prefijo VITE_ en su archivo .env o panel de configuración.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ,
  appId: import.meta.env.VITE_FIREBASE_APP_ID 
};

// Verifica si la configuración es real (el usuario cambió el "ddd" por su apiKey real)
export const isFirebaseConfigured = (): boolean => {
  return (
    typeof firebaseConfig === "object" &&
    firebaseConfig.apiKey !== undefined &&
    firebaseConfig.apiKey !== "ddd" &&
    firebaseConfig.apiKey.trim() !== ""
  );
};

let db: any = null;

if (isFirebaseConfigured()) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("¡Firebase inicializado con éxito! Conectado directamente a Firestore.");
  } catch (error) {
    console.error("Error al inicializar Firebase en el navegador:", error);
  }
}

/**
 * Obtener actividades desde Firestore
 */
export async function getClientTasks(): Promise<Task[] | null> {
  if (!db) return null;
  try {
    const colRef = collection(db, "tasks");
    const snapshot = await getDocs(colRef);
    const tasks: Task[] = [];
    snapshot.forEach((docSnap) => {
      tasks.push(docSnap.data() as Task);
    });
    return tasks;
  } catch (error) {
    console.error("Error al leer de Firestore:", error);
    throw error;
  }
}

/**
 * Guardar una actividad en Firestore
 */
export async function saveClientTask(task: Task): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, "tasks", task.id);
    await setDoc(docRef, task);
  } catch (error) {
    console.error("Error al guardar en Firestore:", error);
    throw error;
  }
}

/**
 * Eliminar una actividad de Firestore
 */
export async function deleteClientTask(id: string): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, "tasks", id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error al eliminar de Firestore:", error);
    throw error;
  }
}

/**
 * Migrar datos del servidor local hacia su Firestore la primera vez que se configure
 */
export async function migrateLocalToFirestore(localTasks: Task[]): Promise<boolean> {
  if (!db || localTasks.length === 0) return false;
  try {
    const colRef = collection(db, "tasks");
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      console.log(`Migrando ${localTasks.length} actividades locales a su Firestore en la nube...`);
      const batch = writeBatch(db);
      for (const task of localTasks) {
        const docRef = doc(db, "tasks", task.id);
        batch.set(docRef, task);
      }
      await batch.commit();
      console.log("¡Migración completada exitosamente!");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error al migrar datos locales a Firestore:", error);
    return false;
  }
}
