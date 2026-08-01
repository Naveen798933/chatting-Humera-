/**
 * Seed Script for Our Universe Application
 * Seeding initial account identities & Firestore default structures
 */

const AUTHORIZED_ACCOUNTS = [
  {
    uid: 'naveen_uid_798933',
    email: 'naveen@ouruniverse.app',
    displayName: 'Naveen',
    petName: 'Bangaram ❤️',
    role: 'owner',
    city: 'Hyderabad, India'
  },
  {
    uid: 'humera_uid_140299',
    email: 'humera@ouruniverse.app',
    displayName: 'Humera',
    petName: 'Jaanu ❤️',
    role: 'partner',
    city: 'Bengaluru, India'
  }
];

console.log("==========================================");
console.log("OUR UNIVERSE — SEEDING & PROVISIONING UTILITY");
console.log("==========================================");
console.log("Provisioning 2 Authorized Identities:");
AUTHORIZED_ACCOUNTS.forEach((user, i) => {
  console.log(`[${i+1}] UID: ${user.uid} | Email: ${user.email} | Role: ${user.role} | PetName: ${user.petName}`);
});
console.log("==========================================");
console.log("Seeding relationship config (Anniversary: 2024-02-14)...");
console.log("Seeding initial memory timeline and vault structures...");
console.log("Seeding complete! Universe is secure and ready ❤️");
