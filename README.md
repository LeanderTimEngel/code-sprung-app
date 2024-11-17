# Code-Sprung-App

Die **Code-Sprung-App** ist eine Plattform, die Anfängern das Programmieren mit interaktiven Java-Coding-Challenges erleichtert. Nutzer können sich registrieren, ihren Fortschritt speichern und ihre Fähigkeiten durch Echtzeit-Feedback verbessern.

## Features

- **Coding Challenges**: Lösen von Java-Aufgaben mit eingebautem Boilerplate-Code.
- **Live-Code-Ausführung**: Nutzung der [Judge0 API](https://judge0.com/) für die Code-Auswertung.
- **Fortschritt speichern**: Automatische Speicherung der Ergebnisse in Firebase.
- **Leaderboard**: Vergleich der Punkte mit anderen Nutzern.
- **Interaktive Tipps und Tutorials**: Unterstützung durch Hinweise und Videoerklärungen.

---

## Voraussetzungen

Bevor du das Projekt installierst, stelle sicher, dass du folgende Software installiert hast:

- **Node.js** (Version 16 oder höher)
- **npm** (Version 8 oder höher)
- **Git**
- Ein Firebase-Projekt mit den folgenden aktivierten Diensten:
  - Authentication
  - Firestore Database
- Zugang zur **Judge0 API** (API-Schlüssel erforderlich)

---

## Installation

### 1. Repository klonen
Klonen des Repositories auf dein lokales System:

```bash
git clone https://github.com/dein-benutzername/code-sprung-app.git
cd code-sprung-app
```

### 2. Abhängigkeiten installieren

Installiere die benötigten Pakete mit npm:

```bash
npm install
```

### 3. Konfiguration erstellen

Erstelle eine .env.local-Datei im Hauptverzeichnis und füge die folgenden Umgebungsvariablen hinzu:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=dein-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=dein-firebase-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=dein-firebase-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=dein-firebase-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=dein-firebase-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=dein-firebase-app-id

NEXT_PUBLIC_JUDGE0_API_KEY=dein-judge0-api-key
```