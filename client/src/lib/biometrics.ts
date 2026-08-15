// WebAuthn Biometric Authentication Helper (Touch ID, Face ID, Android Biometrics)

export async function isBiometricsAvailable(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return false;
  }
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export async function registerBiometricCredential(username: string): Promise<boolean> {
  if (!(await isBiometricsAvailable())) return false;

  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const userId = new TextEncoder().encode(username);

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Our Universe Security' },
        user: {
          id: userId,
          name: username,
          displayName: username === 'naveen_uid_798933' ? 'Naveen (Bangaram)' : 'Humera (Jaanu)',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },  // ES256
          { type: 'public-key', alg: -257 } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'preferred',
          requireResidentKey: false
        },
        timeout: 60000,
        attestation: 'none'
      }
    }) as PublicKeyCredential | null;

    if (credential) {
      localStorage.setItem(`ou_bio_registered_${username}`, 'true');
      localStorage.setItem(`ou_bio_cred_id_${username}`, credential.id);
      return true;
    }
    return false;
  } catch (err: any) {
    console.warn('[Biometrics Registration]:', err?.message || err);
    return false;
  }
}

export async function verifyBiometricCredential(username: string): Promise<boolean> {
  if (!(await isBiometricsAvailable())) return false;

  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: 'required',
        rpId: window.location.hostname || 'localhost'
      }
    });

    return Boolean(assertion);
  } catch (err: any) {
    console.warn('[Biometrics Verification]:', err?.message || err);
    return false;
  }
}

export function isBiometricEnrolled(username: string): boolean {
  try {
    return localStorage.getItem(`ou_bio_registered_${username}`) === 'true';
  } catch {
    return false;
  }
}

export function removeBiometricEnrollment(username: string) {
  try {
    localStorage.removeItem(`ou_bio_registered_${username}`);
    localStorage.removeItem(`ou_bio_cred_id_${username}`);
  } catch {}
}
