import { db } from "./firebase"
import { collection, addDoc, getDocs, doc, getDoc } from "firebase/firestore"

export interface Challenge {
  id?: string
  title: string
  description: string
  difficulty: number
  initialCode: string // Boilerplate
  testCases: { input: string; expected: string }[]
  hint: string
  videoUrl: string
}

export async function addChallenge(challenge: Challenge) {
  try {
    const docRef = await addDoc(collection(db, "challenges"), challenge)
    console.log("Challenge added with ID: ", docRef.id)
    return docRef.id
  } catch (e) {
    console.error("Error adding challenge: ", e)
    throw e
  }
}

export async function getAllChallenges(): Promise<Challenge[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "challenges"))
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Challenge))
  } catch (e) {
    console.error("Error getting challenges: ", e)
    throw e
  }
}

export async function getChallengeById(id: string): Promise<Challenge | null> {
  try {
    const docRef = doc(db, "challenges", id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Challenge
    } else {
      console.log("No such challenge!")
      return null
    }
  } catch (e) {
    console.error("Error getting challenge: ", e)
    throw e
  }
}

export async function resetChallengeCode(challengeId: string): Promise<string | null> {
  try {
    const challenge = await getChallengeById(challengeId);
    if (challenge) {
      return challenge.initialCode; // Den initialen Boilerplate-Code zurückgeben
    }
    return null;
  } catch (e) {
    console.error("Error resetting challenge code: ", e);
    throw e;
  }
}