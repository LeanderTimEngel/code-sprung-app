"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Loader2, PlayCircle } from 'lucide-react'
import Editor from "@monaco-editor/react"
import { auth } from "@/lib/firebase"
import { updateUserProgress } from "@/lib/userProgress"
import { getChallengeById, Challenge } from "@/lib/challenges"
import { updateLeaderboard } from "@/lib/leaderboard"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { onAuthStateChanged } from "firebase/auth"

const JUDGE0_API_URL = "https://judge0-ce.p.rapidapi.com"
const JUDGE0_API_KEY = process.env.NEXT_PUBLIC_JUDGE0_API_KEY

export default function ChallengePage({ params }: { params: { id: string } }) {
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [code, setCode] = useState("")
  const [output, setOutput] = useState<React.ReactNode | string>("")
  const [isRunning, setIsRunning] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
      } else {
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const challengeData = await getChallengeById(params.id)
        if (challengeData) {
          setChallenge(challengeData)
          setCode(challengeData.initialCode)
        } else {
          setError("Challenge not found")
        }
      } catch (err) {
        setError("Failed to load challenge")
      } finally {
        setIsLoading(false)
      }
    }
    if (user) {
      fetchChallenge()
    }
  }, [params.id, user])

  const runCode = async () => {
    setIsRunning(true)
    setOutput("")
    setError(null)

    if (!challenge) {
      setError("Challenge data is missing")
      setIsRunning(false)
      return
    }

    const submission = {
      source_code: code,
      language_id: 62, // Java
      stdin: challenge.testCases.map(tc => tc.input).join("\n")
    }

    try {
      const response = await fetch(`${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-RapidAPI-Key": JUDGE0_API_KEY,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com"
        },
        body: JSON.stringify(submission)
      })

      if (!response.ok) {
        throw new Error("Failed to execute code")
      }

      const result = await response.json()
      
      if (result.status.id <= 3) { // Accepted, Wrong Answer, Time Limit Exceeded
        const userOutput = result.stdout.trim().split("\n")
        const testResults = challenge.testCases.map((tc, index) => ({
          input: tc.input,
          expected: tc.expected,
          actual: userOutput[index],
          passed: userOutput[index] === tc.expected
        }))
        
        const allPassed = testResults.every(tr => tr.passed)
        
        setOutput(
          <div>
            <h3 className="font-bold mb-2">{allPassed ? "All test cases passed!" : "Some test cases failed. Keep trying!"}</h3>
            {testResults.map((tr, index) => (
              <div key={index} className={`mb-2 p-2 rounded ${tr.passed ? "bg-green-100" : "bg-red-100"}`}>
                <p>Test Case {index + 1}:</p>
                <p>Input: {tr.input}</p>
                <p>Expected: {tr.expected}</p>
                <p>Actual: {tr.actual}</p>
                <p>{tr.passed ? "Passed" : "Failed"}</p>
              </div>
            ))}
          </div>
        )
        
        if (allPassed) {
          const newProgress = 100
          setProgress(newProgress)
          await updateUserProgress(user.uid, challenge.id, newProgress)
          await updateLeaderboard(user.uid, user.email.split('@')[0], challenge.id)
        }
      } else {
        setOutput(`Error: ${result.status.description}`)
      }
    } catch (error) {
      console.error("Error running code:", error)
      setError("An error occurred while running your code.")
    }

    setIsRunning(false)
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!challenge) {
    return <div>Challenge not found</div>
  }

  const resetCode = async () => {
    const boilerplateCode = await resetChallengeCode(params.id);
    if (boilerplateCode) {
      setCode(boilerplateCode); // Boilerplate-Code in den Editor laden
    } else {
      console.error("Could not reset code.");
    }
  };
  
  // Button zum Zurücksetzen
  <Button variant="outline" onClick={resetCode}>
    Reset Code
  </Button>
  

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{challenge.title}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Problem Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{challenge.description}</p>
            <Progress value={progress} className="mt-4" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Code Editor</CardTitle>
          </CardHeader>
          <CardContent>
            <Editor
              height="300px"
              defaultLanguage="java"
              value={code}
              onChange={(value) => setCode(value || "")}
              theme="vs-dark"
            />
            <div className="mt-4 space-x-2">
              <Button onClick={runCode} disabled={isRunning}>
                {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Run Code"}
              </Button>
              <Button variant="outline" onClick={() => setShowHint(!showHint)}>
                {showHint ? "Hide Hint" : "Show Hint"}
              </Button>
            </div>
            {showHint && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Hint</CardTitle>
                </CardHeader>
                <CardContent>{challenge.hint}</CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Output</CardTitle>
        </CardHeader>
        <CardContent>
          {typeof output === 'string' ? (
            <pre className="bg-gray-100 p-4 rounded">{output}</pre>
          ) : (
            output
          )}
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Video Tutorial</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-w-16 aspect-h-9">
            <iframe
              src={challenge.videoUrl}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}