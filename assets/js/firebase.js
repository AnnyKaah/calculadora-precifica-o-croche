import { firebaseConfig } from './firebase-config.js'; // 1. Importa a configuração

// 2. Inicializa o Firebase usando a configuração importada
firebase.initializeApp(firebaseConfig);

// 3. Exporta os serviços do Firebase que seu app usa
export const auth = firebase.auth();
export const db = firebase.firestore();
