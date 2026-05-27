import { createHash } from 'crypto';
const password = 'able2021!';
const salt = 'dinner_salt_2024';
const hash = createHash('sha256').update(password + salt).digest('hex');
console.log(hash);
