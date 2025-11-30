import { firebaseConfig } from './firebase-config.js';

firebase.initializeApp(firebaseConfig);

export const auth = firebase.auth();
export const db = firebase.firestore();
