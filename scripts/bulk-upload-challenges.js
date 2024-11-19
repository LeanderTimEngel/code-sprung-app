const admin = require('firebase-admin');
const serviceAccount = require('./path/to/your-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const challenges = [
  // Your challenge data here
  // Example:
  {
    title: "Hello World",
    description: "Write a Java program that prints 'Hello, World!' to the console.",
    difficulty: "Easy",
    category: "Basics",
    initialCode: "public class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}",
    solutionCode: "public class Solution {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, World!\");\n    }\n}",
    testCases: [
      { input: "", expected: "Hello, World!" }
    ],
    hint: "Use System.out.println() to print text to the console",
    videoUrl: "https://example.com/hello-world-tutorial"
  },
  // Add more challenges here
];

async function bulkUploadChallenges() {
  const batch = db.batch();
  
  challenges.forEach((challenge) => {
    const docRef = db.collection('challenges').doc(); // Auto-generate ID
    batch.set(docRef, challenge);
  });

  try {
    await batch.commit();
    console.log('Bulk upload completed successfully');
  } catch (error) {
    console.error('Error during bulk upload:', error);
  }
}

bulkUploadChallenges();