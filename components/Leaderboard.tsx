import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from '@/lib/firebase'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'

interface LeaderboardEntry {
  id: string
  username: string
  score: number
}

export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchLeaderboard() {
      setIsLoading(true)
      try {
        const leaderboardRef = collection(db, 'leaderboard')
        const q = query(leaderboardRef, orderBy('score', 'desc'), limit(10))
        const querySnapshot = await getDocs(q)
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as LeaderboardEntry))
        setLeaderboard(data)
      } catch (error) {
        console.error("Error fetching leaderboard:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  if (isLoading) {
    return <div>Loading leaderboard...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <ul>
          {leaderboard.map((entry, index) => (
            <li key={entry.id} className="flex justify-between items-center py-2">
              <span>{index + 1}. {entry.username}</span>
              <span>{entry.score}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}