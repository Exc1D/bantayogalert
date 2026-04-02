import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getFirebaseStorage } from '../config/firebase'

const MAX_DIMENSION = 1024
const QUALITY = 0.7

export async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = (height / width) * MAX_DIMENSION
          width = MAX_DIMENSION
        } else {
          width = (width / height) * MAX_DIMENSION
          height = MAX_DIMENSION
        }
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', QUALITY)
    }
    img.src = URL.createObjectURL(file)
  })
}

export async function uploadMedia(
  file: File,
  userId: string,
  reportId: string
): Promise<string> {
  const compressed = await compressImage(file)
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `media/${userId}/${reportId}/${crypto.randomUUID()}.${ext}`
  const storageRef = ref(getFirebaseStorage(), path)
  await uploadBytes(storageRef, compressed)
  return getDownloadURL(storageRef)
}
