import { db } from "./firebase"
import { collection, query, orderBy, limit, getDocs, setDoc, doc, increment } from "firebase/firestore"

export interface LeaderboardEntry {
  userId: string
  username: string
  score: number
}

export async function updateLeaderboard(userId: string, username: string, challengeId: string) {
  const userRef = doc(db, "leaderboard", userId)
  await setDoc(userRef, {
    username,
    score: increment(1),
    [`challenges.${challengeId}`]: true
  }, { merge: true })
}

export async function getLeaderboard(limitCount = 10): Promise<LeaderboardEntry[]> {
  const leaderboardRef = collection(db, "leaderboard")
  const q = query(leaderboardRef, orderBy("score", "desc"), limit(limitCount))
  const querySnapshot = await getDocs(q)
  
  return querySnapshot.docs.map(doc => ({
    userId: doc.id,
    username: doc.data().username,
    score: doc.data().score
  }))
}