import { db } from "./firebase"
import { collection, addDoc, getDocs, query, where, doc, getDoc } from "firebase/firestore"

export interface Challenge {
  id?: string
  title: string
  description: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  category: string
  initialCode: string
  solutionCode: string
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
    const challengesCollection = collection(db, "challenges")
    const challengesSnapshot = await getDocs(challengesCollection)
    return challengesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Challenge))
  } catch (e) {
    console.error("Error getting challenges: ", e)
    throw e
  }
}

export async function getChallengesByCategory(category: string): Promise<Challenge[]> {
  try {
    const challengesCollection = collection(db, "challenges")
    const q = query(challengesCollection, where("category", "==", category))
    const challengesSnapshot = await getDocs(q)
    return challengesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Challenge))
  } catch (e) {
    console.error("Error getting challenges by category: ", e)
    throw e
  }
}

export async function getChallengesByDifficulty(difficulty: 'Easy' | 'Medium' | 'Hard'): Promise<Challenge[]> {
  try {
    const challengesCollection = collection(db, "challenges")
    const q = query(challengesCollection, where("difficulty", "==", difficulty))
    const challengesSnapshot = await getDocs(q)
    return challengesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Challenge))
  } catch (e) {
    console.error("Error getting challenges by difficulty: ", e)
    throw e
  }
}

export async function getChallengeById(id: string): Promise<Challenge | null> {
  try {
    const challengeDoc = await getDoc(doc(db, "challenges", id))
    if (challengeDoc.exists()) {
      return { id: challengeDoc.id, ...challengeDoc.data() } as Challenge
    } else {
      return null
    }
  } catch (e) {
    console.error("Error getting challenge by ID: ", e)
    throw e
  }
}

export async function resetChallengeCode(id: string): Promise<string | null> {
  try {
    const challenge = await getChallengeById(id)
    return challenge ? challenge.initialCode : null
  } catch (e) {
    console.error("Error resetting challenge code: ", e)
    throw e
  }
}