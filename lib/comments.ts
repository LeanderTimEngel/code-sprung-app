import { db } from "./firebase"
import { collection, addDoc, getDocs, query, where, orderBy } from "firebase/firestore"

export interface Comment {
  id?: string
  challengeId: string
  userId: string
  username: string
  content: string
  createdAt: Date
}

export async function addComment(comment: Omit<Comment, 'id' | 'createdAt'>) {
  try {
    const docRef = await addDoc(collection(db, "comments"), {
      ...comment,
      createdAt: new Date()
    })
    console.log("Comment added with ID: ", docRef.id)
    return docRef.id
  } catch (e) {
    console.error("Error adding comment: ", e)
    throw e
  }
}

export async function getCommentsByChallengeId(challengeId: string): Promise<Comment[]> {
  try {
    const commentsRef = collection(db, 'comments');
    const q = query(
      commentsRef, 
      where('challengeId', '==', challengeId),
      orderBy('createdAt', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
  } catch (e) {
    console.error("Error getting comments: ", e);
    throw e;
  }
}