import { db } from "./firebase"
import { doc, setDoc, getDoc } from "firebase/firestore"

export async function updateUserProgress(userId: string, challengeId: string, progress: number) {
  const userRef = doc(db, "userProgress", userId)
  await setDoc(userRef, {
    [challengeId]: progress
  }, { merge: true })
}

export async function getUserProgress(userId: string): Promise<Record<string, number>> {
  const userRef = doc(db, "userProgress", userId)
  const userDoc = await getDoc(userRef)

  if (userDoc.exists()) {
    return userDoc.data() as Record<string, number>
  }

  return {}
}