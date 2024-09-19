import crypto from 'crypto';

interface WebAppUser {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  added_to_attachment_menu?: boolean;
  allows_write_to_pm?: boolean;
  photo_url?: string;
}

interface InitData {
  query_id: string;
  user: WebAppUser;
  auth_date: number;
  hash: string;
  start_params: string;
  [key: string]: string | WebAppUser | number;
}

const BOT_TOKEN = process.env.BOT_TOKEN || '';

function validateTelegramData(initData: string): InitData | null {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  const auth_date = params.get('auth_date');

  if (!hash || !auth_date) {
    console.error("Required fields are missing");
    return null;
  }

  // Формируем строку проверки данных (data_check_string)
  const dataCheckString = Array.from(params.entries())
    .filter(([key]) => key !== 'hash')
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join('\n');

  // Ключ для HMAC-SHA256
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(BOT_TOKEN)
    .digest();

  // Проверяем подпись
  const computedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (computedHash === hash) {
    // Преобразуем параметры в объект InitData
    const result: InitData = {
      query_id: params.get('query_id') || '',
      user: JSON.parse(params.get('user') || '{}') as WebAppUser, // Преобразуем строку user в объект WebAppUser
      auth_date: parseInt(params.get('auth_date') || '0', 10),
      hash: hash,
      start_params: params.get('start_params') || '',
    };

    return result;
  } else {
    console.error("Data validation failed");
    return null;
  }
}

export default validateTelegramData;
