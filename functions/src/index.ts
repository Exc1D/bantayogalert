import * as functions from 'firebase-functions'
import { setUserRole } from './auth/setUserRole'
import { onUserCreated } from './auth/onUserCreated'

export { setUserRole }
export { onUserCreated }

// Keep stub until more functions are added
export const stub = functions.https.onRequest((req, res) => {
  res.status(200).json({ status: 'ok' })
})
