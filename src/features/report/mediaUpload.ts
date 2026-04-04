/**
 * mediaUpload - Image compression and Firebase Storage upload utilities
 * D-86, D-87, D-88, D-89, D-90
 */
import imageCompression from 'browser-image-compression'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

function getFileExtension(file: File) {
  const [, extension = 'jpg'] = file.name.split('.')
  return extension.toLowerCase()
}

export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  }
  return await imageCompression(file, options)
}

export async function uploadMediaFiles(
  files: File[],
  reportId: string,
  onProgress?: (fileIndex: number, percent: number) => void
): Promise<string[]> {
  const storage = getStorage()
  const urls: string[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (!file) continue
    const filename = `${String(i + 1).padStart(2, '0')}.${getFileExtension(file)}`
    const storageRef = ref(storage, `reports/${reportId}/${filename}`)

    // Convert File to Blob for uploadBytes compatibility
    const blob = await file.arrayBuffer()
    const snapshot = await uploadBytes(storageRef, blob)
    const url = await getDownloadURL(snapshot.ref)
    urls.push(url)
    onProgress?.(i, 100)
  }

  return urls
}
