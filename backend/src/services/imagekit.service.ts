import ImageKit from 'imagekit';
import * as dotenv from 'dotenv';
dotenv.config();

// Ensure these exist in your .env later!
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || 'mock_public_key',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || 'mock_private_key',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/mock',
});

// Endpoint required by ImageKit React SDK to sign upload requests for security
export const getAuthenticationParameters = () => {
  return imagekit.getAuthenticationParameters();
};
