// Authorized User Credentials for Our Universe Private Space
export const AUTHORIZED_USERS = [
  {
    uid: 'naveen_uid_798933' as const,
    email: 'naveen@ouruniverse.app',
    realName: 'Naveen',
    nickname: 'Naveen',
    petName: 'Bangaram ❤️',
    role: 'owner' as const,
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    city: 'Hyderabad, India',
    pin: '7989'
  },
  {
    uid: 'humera_uid_140299' as const,
    email: 'humera@ouruniverse.app',
    realName: 'Humera',
    nickname: 'Humera',
    petName: 'Jaanu ❤️',
    role: 'partner' as const,
    photoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    city: 'Bengaluru, India',
    pin: '1402'
  }
];

export const IS_AUTHORIZED_EMAIL = (email: string) => {
  return AUTHORIZED_USERS.some(u => u.email.toLowerCase() === email.trim().toLowerCase());
};
