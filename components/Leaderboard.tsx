"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getLeaderboard, LeaderboardEntry } from "@/lib/leaderboard"

export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await getLeaderboard()
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
            <li key={entry.userId} className="flex justify-between items-center py-2 border-b last:border-b-0">
              <span>{index + 1}. {entry.username}</span>
              <span>{entry.score} points</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}