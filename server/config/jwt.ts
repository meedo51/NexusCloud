import fs from 'fs';

export function getJWTSecret(): string {
  const secretPath = process.env.JWT_SECRET_FILE || '/run/secrets/jwt_secret';
  if (fs.existsSync(secretPath)) {
    console.log('✅ Using Docker secret for JWT');
    return fs.readFileSync(secretPath, 'utf-8').trim();
  }
  
  const envSecret = process.env.JWT_SECRET;
  if (envSecret && envSecret !== 'change_me_in_production') {
    console.warn('⚠️ Using JWT_SECRET from env (less secure)');
    return envSecret;
  }
  
  return 'fallback_secret_for_development_only';
}
