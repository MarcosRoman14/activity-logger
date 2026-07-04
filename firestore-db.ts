import { Firestore } from "@google-cloud/firestore";
import { Task } from "./src/types";

let db: Firestore | null = null;
let firestoreAvailable = false;

// Initialize Firestore
try {
  // If we are in GCP (like Cloud Run), standard environment variables are automatically configured.
  // Locally or on other platforms, we can use default credentials or project detection.
  db = new Firestore();
  firestoreAvailable = true;
  console.log("Firestore client successfully initialized.");
} catch (error) {
  console.warn("Could not initialize Firestore client. Local JSON fallback will be used.", error);
}

/**
 * Checks if Firestore is configured and currently responsive.
 */
export async function isFirestoreReady(): Promise<boolean> {
  if (!db || !firestoreAvailable) {
    return false;
  }
  try {
    // Perform a quick metadata or simple read check to ensure the project has Firestore enabled.
    // We can try to list collections or get a document from a system test collection.
    await db.collection("_health_check").doc("status").get();
    return true;
  } catch (error: any) {
    console.warn("Firestore was initialized but is not accessible. This usually means the Firestore Native database has not been created yet in your Google Cloud Console.", error.message);
    return false;
  }
}

/**
 * Retrieves all tasks from Firestore.
 */
export async function getFirestoreTasks(): Promise<Task[] | null> {
  if (!db || !firestoreAvailable) {
    return null;
  }
  try {
    const snapshot = await db.collection("tasks").get();
    const tasks: Task[] = [];
    snapshot.forEach((doc) => {
      tasks.push(doc.data() as Task);
    });
    return tasks;
  } catch (error) {
    console.error("Error reading tasks from Firestore:", error);
    return null;
  }
}

/**
 * Saves a single task to Firestore.
 */
export async function saveFirestoreTask(task: Task): Promise<boolean> {
  if (!db || !firestoreAvailable) {
    return false;
  }
  try {
    await db.collection("tasks").doc(task.id).set(task);
    return true;
  } catch (error) {
    console.error("Error writing task to Firestore:", error);
    return false;
  }
}

/**
 * Deletes a single task from Firestore.
 */
export async function deleteFirestoreTask(id: string): Promise<boolean> {
  if (!db || !firestoreAvailable) {
    return false;
  }
  try {
    await db.collection("tasks").doc(id).delete();
    return true;
  } catch (error) {
    console.error("Error deleting task from Firestore:", error);
    return false;
  }
}

/**
 * Updates a task in Firestore.
 */
export async function updateFirestoreTask(id: string, data: Partial<Task>): Promise<boolean> {
  if (!db || !firestoreAvailable) {
    return false;
  }
  try {
    await db.collection("tasks").doc(id).update(data);
    return true;
  } catch (error) {
    console.error("Error updating task in Firestore:", error);
    return false;
  }
}

/**
 * Migrates local tasks to Firestore if Firestore is empty.
 */
export async function migrateToFirestoreIfNeeded(localTasks: Task[]): Promise<boolean> {
  if (localTasks.length === 0 || !db || !firestoreAvailable) {
    return false;
  }
  try {
    const snapshot = await db.collection("tasks").limit(1).get();
    if (snapshot.empty) {
      console.log(`Firestore 'tasks' collection is empty. Migrating ${localTasks.length} local tasks to cloud Firestore...`);
      const batch = db.batch();
      for (const task of localTasks) {
        const docRef = db.collection("tasks").doc(task.id);
        batch.set(docRef, task);
      }
      await batch.commit();
      console.log("Migration completed successfully!");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error during Firestore migration:", error);
    return false;
  }
}
