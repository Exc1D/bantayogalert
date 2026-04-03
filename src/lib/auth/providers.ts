import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

/**
 * Google OAuth provider instance.
 * Uses signInWithPopup (not redirect) per D-44.
 * Custom parameter prompt='select_account' prevents silent re-auth.
 */
export const googleProvider = new GoogleAuthProvider()

googleProvider.addScope('email')
googleProvider.addScope('profile')
googleProvider.setCustomParameters({
  prompt: 'select_account',
})

/**
 * Email/password provider configuration object.
 * signInWithPopup method for consistency with Google OAuth flow.
 */
export const emailPasswordProvider = {
  signInWithPopup,
}
