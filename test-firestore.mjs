import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
    "projectId": "studio-2935714752-24641",
    "appId": "1:996982313737:web:771dee1603e733470279d8",
    "storageBucket": "studio-2935714752-24641.appspot.com",
    "apiKey": "AIzaSyBxUyKltELPLjwxsFoVfSIHNEIZtYq0pS0",
    "authDomain": "studio-2935714752-24641.firebaseapp.com",
    "measurementId": "",
    "messagingSenderId": "996982313737"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFetch() {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        console.log("SUCCESS! Got docs:", querySnapshot.docs.length);
    } catch (error) {
        console.error("FAILED to fetch products:", error);
    }
}

testFetch();
