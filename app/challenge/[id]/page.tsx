"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Editor from "@monaco-editor/react";
import { auth } from "@/lib/firebase";
import { getChallengeById, Challenge } from "@/lib/challenges";
import { updateUserProgress } from "@/lib/userProgress";
import { updateLeaderboard } from "@/lib/leaderboard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { onAuthStateChanged } from "firebase/auth";

const JUDGE0_API_URL = "https://judge0-ce.p.rapidapi.com";
const JUDGE0_API_KEY = process.env.NEXT_PUBLIC_JUDGE0_API_KEY;

export default function ChallengePage({ params }: { params: { id: string } }) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [code, setCode] = useState(""); // Editor Code
  const [error, setError] = useState<string | null>(null); // Fehlerstatus
  const [isRunning, setIsRunning] = useState(false); // Code-Ausführung
  const [isLoading, setIsLoading] = useState(true); // Daten laden
  const [user, setUser] = useState(null); // Authentifizierter Nutzer
  const router = useRouter();

  // Überwache den Authentifizierungsstatus des Nutzers
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Lade Challenge-Daten
  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const challengeData = await getChallengeById(params.id);
        if (challengeData) {
          setChallenge(challengeData);
          setCode(challengeData.initialCode);
        } else {
          setError("Challenge not found");
        }
      } catch {
        setError("Failed to load challenge");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchChallenge();
    }
  }, [params.id, user]);

  // Code ausführen
  const runCode = async () => {
    setIsRunning(true);
    setError(null);

    if (!challenge) {
      setError("Challenge data is missing");
      setIsRunning(false);
      return;
    }

    const submission = {
      source_code: code,
      language_id: 62, // Java
      stdin: challenge.testCases.map((tc) => tc.input).join("\n"),
    };

    try {
      const response = await fetch(
        `${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "X-RapidAPI-Key": JUDGE0_API_KEY,
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          },
          body: JSON.stringify(submission),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to execute code");
      }

      const result = await response.json();
      if (result.status.id === 3) {
        // Wenn alle Testfälle bestanden wurden
        await updateUserProgress(user?.uid, challenge.id, 100);
        await updateLeaderboard(user?.uid, user?.email || "Anonymous", challenge.id);
      }
    } catch {
      setError("An error occurred while running your code.");
    } finally {
      setIsRunning(false);
    }
  };

  // Ladeanzeige
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Fehleranzeige
  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{challenge?.title}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Problem Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{challenge?.description}</p>
        </CardContent>
      </Card>
      <Editor
        height="300px"
        defaultLanguage="java"
        value={code}
        onChange={(value) => setCode(value || "")}
        theme="vs-dark"
      />
      <Button onClick={runCode} disabled={isRunning} className="mt-4">
        {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Run Code"}
      </Button>
    </div>
  );
}
