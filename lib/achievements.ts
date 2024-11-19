import { db } from "./firebase"
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from "firebase/firestore"

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
}

export async function getAchievements(userId: string): Promise<Achievement[]> {
  try {
    const docRef = doc(db, "userAchievements", userId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data().achievements as Achievement[]
    } else {
      return []
    }
  } catch (e) {
    console.error("Error getting achievements: ", e)
    throw e
  }
}

export async function addAchievement(userId: string, achievement: Achievement) {
  try {
    const docRef = doc(db, "userAchievements", userId)
    await updateDoc(docRef, {
      achievements: arrayUnion(achievement)
    })
  } catch (e) {
    console.error("Error adding achievement: ", e)
    throw e
  }
}

// Define achievement criteria and check functions
const ACHIEVEMENTS = {
  FIRST_CHALLENGE: {
    id: "FIRST_CHALLENGE",
    name: "First Steps",
    description: "Complete your first challenge",
    icon: "🎉",
    check: (completedChallenges: number) => completedChallenges === 1
  },
  FIVE_CHALLENGES: {
    id: "FIVE_CHALLENGES",
    name: "Getting Started",
    description: "Complete 5 challenges",
    icon: "🚀",
    check: (completedChallenges: number) => completedChallenges === 5
  },
  TEN_CHALLENGES: {
    id: "TEN_CHALLENGES",
    name: "On a Roll",
    description: "Complete 10 challenges",
    icon: "🔥",
    check: (completedChallenges: number) => completedChallenges === 10
  }
}

export async function checkAndUpdateAchievements(userId: string, completedChallenges: number) {
  const userAchievements = await getAchievements(userId)
  const newAchievements = Object.values(ACHIEVEMENTS).filter(
    achievement => !userAchievements.some(ua => ua.id === achievement.id) && achievement.check(completedChallenges)
  )

  for (const achievement of newAchievements) {
    await addAchievement(userId, achievement)
  }

  return newAchievements
}