'use client'

import { useState, useEffect } from 'react'
import { Box, Stack, Typography, Button, Modal, TextField, Card, CardContent, CardActions, IconButton } from '@mui/material'
import { firestore, storage } from '@/firebase'
import { collection, doc, getDocs, query, setDoc, deleteDoc, getDoc } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { v4 as uuidv4 } from 'uuid'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: '500px',
  bgcolor: 'white',
  border: 'none',
  boxShadow: 24,
  borderRadius: 2,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
}

export default function Home() {
  const [inventory, setInventory] = useState([])
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [itemQuantity, setItemQuantity] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [image, setImage] = useState(null)

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'))
    const docs = await getDocs(snapshot)
    const inventoryList = []
    docs.forEach((doc) => {
      inventoryList.push({ name: doc.id, ...doc.data() })
    })
    setInventory(inventoryList)
  }

  useEffect(() => {
    updateInventory()
  }, [])

  const addItem = async (item, quantity) => {
    let imageUrl = ''
  
    if (image) {
      const storageRef = ref(storage, `images/${uuidv4()}`)
      const uploadTask = uploadBytesResumable(storageRef, image)
  
      await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          null,
          (error) => {
            console.error("Error during upload:", error)
            reject(error)
          },
          async () => {
            imageUrl = await getDownloadURL(uploadTask.snapshot.ref)
            console.log("Image uploaded successfully. URL:", imageUrl)
            resolve()
          }
        )
      })
    }
  
    console.log("Adding item to Firestore:", { item, quantity, imageUrl })
  
    try {
      const docRef = doc(collection(firestore, 'inventory'), item)
      const docSnap = await getDoc(docRef)
  
      if (docSnap.exists()) {
        const { quantity: existingQuantity } = docSnap.data()
        await setDoc(docRef, { quantity: existingQuantity + quantity, imageUrl }, { merge: true })
      } else {
        await setDoc(docRef, { quantity, imageUrl })
      }
  
      console.log("Item added/updated successfully in Firestore.")
      await updateInventory()
    } catch (error) {
      console.error("Error adding item to Firestore:", error)
    }
  }

  const updateItemQuantity = async (item, quantity) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      await setDoc(docRef, { quantity }, { merge: true })
    }
    await updateInventory()
  }

  const removeItem = async (item) => {
    await deleteDoc(doc(collection(firestore, 'inventory'), item))
    await updateInventory()
  }

  const handleOpen = () => setOpen(true)
  const handleClose = () => {
    setOpen(false)
    setItemName('')
    setItemQuantity(1)
    setImage(null)
  }

  const handleCapture = (event) => {
    const file = event.target.files[0]
    setImage(file)
  }

  const filteredInventory = inventory.filter(({ name }) =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Box
      width="100vw"
      minHeight="100vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      sx={{ bgcolor: '#f0f4f8', p: 4 }}
    >
      <Box
        width="100%"
        sx={{
          bgcolor: '#004d40',
          p: 2,
          display: 'flex',
          justifyContent: 'center',
          position: 'fixed',
          top: 0,
          zIndex: 1,
          boxShadow: 2,
        }}
      >
        <Typography variant="h3" color="#fff" textAlign="center">
          Pantry Inventory
        </Typography>
      </Box>
      <Box
        width="100%"
        display="flex"
        flexDirection="column"
        alignItems="center"
        mt={12}
        sx={{ maxWidth: '800px', width: '100%' }}
      >
        <TextField
          id="search-bar"
          label="Search Items"
          variant="outlined"
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ marginBottom: 4 }}
        />
        <Button variant="contained" onClick={handleOpen} sx={{ marginBottom: 2, bgcolor: '#fbc02d', borderRadius: 3 }}>
          Add New Item
        </Button>
        <Modal
          open={open}
          onClose={handleClose}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={style}>
            <Typography id="modal-modal-title" variant="h6" component="h2">
              Add Item
            </Typography>
            <Stack width="100%" spacing={2}>
              <TextField
                id="outlined-basic"
                label="Item"
                variant="outlined"
                fullWidth
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
              <TextField
                id="outlined-basic"
                label="Quantity"
                type="number"
                variant="outlined"
                fullWidth
                value={itemQuantity}
                onChange={(e) => setItemQuantity(Number(e.target.value))}
              />
              <input type="file" accept="image/*" capture="camera" onChange={handleCapture} />
              <Button
                variant="contained"
                sx={{ bgcolor: '#004d40', color: '#fff' }}
                onClick={() => {
                  addItem(itemName, itemQuantity)
                  handleClose()
                }}
              >
                Add
              </Button>
            </Stack>
          </Box>
        </Modal>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          width="100%"
          gap={3}
          sx={{ marginBottom: 8 }}
        >
          {filteredInventory.length ? (
            filteredInventory.map(({ name, quantity, imageUrl }) => (
              <Card key={name} sx={{ width: '100%', bgcolor: '#fff', boxShadow: 2, borderRadius: 3 }}>
                <CardContent>
                  {imageUrl && <img src={imageUrl} alt={name} style={{ width: '120px', height: '120px', borderRadius: 6, marginBottom: 8 }} />}
                  <Typography variant="h5" component="div">
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
                    <IconButton
                      onClick={() =>
                        updateItemQuantity(name, quantity - 1)
                      }
                      disabled={quantity <= 1}
                    >
                      <RemoveIcon />
                    </IconButton>
                    <Typography variant="body2" color="text.secondary">
                      Quantity: {quantity}
                    </Typography>
                    <IconButton onClick={() => updateItemQuantity(name, quantity + 1)}>
                      <AddIcon />
                    </IconButton>
                  </Box>
                </CardContent>
                <CardActions>
                <Button size="small" onClick={() => removeItem(name)} sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                    Remove
                  </Button>
                </CardActions>
              </Card>
            ))
          ) : (
            <Typography variant="body1" color="text.secondary">
              No items found.
            </Typography>
          )}
        </Box>
      </Box>
      <Box
        width="100%"
        sx={{
          bgcolor: '#004d40',
          p: 2,
          position: 'fixed',
          bottom: 0,
          display: 'flex',
          justifyContent: 'center',
          color: '#fff',
          boxShadow: 2,
        }}
      >
        <Typography variant="body2">
          &copy; {new Date().getFullYear()} Pantry Inventory. All rights reserved.
        </Typography>
      </Box>
    </Box>
  )
}
