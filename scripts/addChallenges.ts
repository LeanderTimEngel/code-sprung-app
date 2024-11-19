import { addChallenge, Challenge } from "../lib/challenges"

const challenges: Challenge[] = [
  {
    title: "Reverse a String",
    description: "Write a function that reverses a string. The input string is given as an array of characters s.",
    difficulty: "Easy",
    category: "Strings",
    initialCode: `
public class Solution {
    public void reverseString(char[] s) {
        // Your code here
    }
}`,
    solutionCode: `
public class Solution {
    public void reverseString(char[] s) {
        int left = 0, right = s.length - 1;
        while (left < right) {
            char temp = s[left];
            s[left] = s[right];
            s[right] = temp;
            left++;
            right--;
        }
    }
}`,
    testCases: [
      { input: "['h','e','l','l','o']", expected: "['o','l','l','e','h']" },
      { input: "['H','a','n','n','a','h']", expected: "['h','a','n','n','a','H']" }
    ],
    hint: "Try using two pointers, one at the start and one at the end of the array.",
    videoUrl: "https://example.com/reverse-string-tutorial"
  },
  // Fügen Sie hier weitere Challenges hinzu...
]

async function addChallenges() {
  for (const challenge of challenges) {
    try {
      const id = await addChallenge(challenge)
      console.log(`Added challenge with ID: ${id}`)
    } catch (error) {
      console.error(`Error adding challenge: ${challenge.title}`, error)
    }
  }
}

addChallenges()