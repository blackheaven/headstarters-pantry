'use client';
import Image from "next/image";
// import styles from "./page.module.css";
// import { Inventory, QrCodeScanner, Summarize } from "@mui/icons-material";
import {
  Button,
  Grid,
  Box,
  Typography,
  TextField,
} from "@mui/material";
import Divider from '@mui/material/Divider';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CardActions from '@mui/material/CardActions';
import { useState } from "react";
import { initializeApp } from "firebase/app";
import { addDoc, collection, deleteDoc, doc, getDocs, getFirestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface Item {
  id: string;
  title: string;
  img: string;
}

const COLLECTION_NAME = 'pantry_items';

async function storeAddItem(id: string, title: string, pictureFile: File) {
  const storage = getStorage();
  try {
    const fileName = `images/${Date.now()}_${pictureFile.name}`;
    const storageRef = ref(storage, fileName);

    // Upload the image to Storage
    await uploadBytes(storageRef, pictureFile);

    const downloadUrl = await getDownloadURL(storageRef);
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {id, title, img: downloadUrl});
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

async function storeGetItems() {
  const itemsCollection = collection(db, COLLECTION_NAME);
  const querySnapshot = await getDocs(itemsCollection);

  const items: Item[] = [];
  querySnapshot.forEach((doc) => {
    items.push({ id: doc.id, ...doc.data() });
  });

  return items;
}

async function storeDeleteItem(itemId: string) {
  try {
    const docRef = doc(db, COLLECTION_NAME, itemId); 
    await deleteDoc(docRef);
    console.log("Document deleted successfully!");
  } catch (e) {
    console.error("Error deleting document: ", e);
  }
}

export default function Home() {
  const [items, setItems] = useState([]);
  let [imgFile, setImgFile] = useState(null);
  let [title, setTitle] = useState("");
  const refresh = async () => {
    const items = await storeGetItems();
    console.log("Fetched");
    console.log(items);
    setItems(items);
  };
  const newItem = async () => {
    await storeAddItem("" + (1000000 + Math.floor(Math.random() * 1000000)), title, imgFile);
    setTitle("");
    await refresh();
  };
  const deleteItem = async (id: string) => {
    await storeDeleteItem(id);
    await refresh();
  };
  const updateSearch = (part: string) => {
    setTitle(part);
  };
  return (
    <Box>
      <div>
        <Typography variant="h1">My pantry</Typography>
        <TextField
          hiddenLabel
          id="search"
          variant="outlined"
          size="small"
          value={title}
          onChange={(event) => { updateSearch(event.target.value); }}
        />
        <Button
          variant="contained"
          component="label"
        >
          Upload File
          <input
            hidden
            type="file"
            accept="image/*"
            onChange={(event) => { setImgFile(event.target.files[0]); }}
          />
        </Button>
        <Button
          variant="contained"
          onClick={() => { newItem(); }}
        >
          New item
        </Button>
      </div>
      <Button
        variant="contained"
        onClick={() => { refresh(); }}
      >
        Refresh
      </Button>
      <br />
      <Divider />
      <br />
      <br />
      <br />
      <div>
        <Grid container spacing={2}>
          {items.filter((item) => item.title.toLowerCase().indexOf(title.toLowerCase()) >= 0).map(
            (item) => (
              <Grid xs={4} key={item.id}>
                <Card variant="outlined">
                  <CardMedia
                    sx={{ height: 140 }}
                    image={item.img}
                    title={item.title}
                  />
                  <CardContent>
                    <Typography gutterBottom variant="h5" component="div">
                      {item.title}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => { deleteItem(item.id) }}>Delete</Button>
                  </CardActions>
                </Card>
              </Grid>
            )
          )}
        </Grid>
      </div>
    </Box>
  );
}
