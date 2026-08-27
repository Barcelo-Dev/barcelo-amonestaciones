export interface AppEnv {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  nodeEnv: string;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV !== 'test') {
    throw new Error(
      `Falta la variable de entorno ${name}. Copia .env.example a .env.local y completa los valores.`
    );
  }
  return value || '';
}

const env: AppEnv = {
  supabaseUrl: required('SUPABASE_URL'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-do-not-use-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  nodeEnv: process.env.NODE_ENV || 'development',
};

export default env;
