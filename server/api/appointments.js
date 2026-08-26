/**
 * Основа API для Vercel / Netlify serverless functions.
 *
 * Перед публикацией замените функции database.* на запросы к Supabase/Firebase.
 * Важно: проверка свободного слота должна выполняться на сервере, а не только в браузере.
 */

const SLOT_MINUTES = 45;

function validTime(date, time) {
  const day = new Date(`${date}T12:00:00`).getDay();
  if (day === 0) return false;
  const [hour, minute] = time.split(':').map(Number);
  const total = hour * 60 + minute;
  const start = day === 6 ? 660 : 1080;
  const end = day === 6 ? 1020 : 1260;
  return (total - start) % SLOT_MINUTES === 0 && total >= start && total + SLOT_MINUTES <= end;
}

export default async function handler(request, response) {
  // GET /api/appointments?date=2026-08-26 — занятые слоты на дату.
  if (request.method === 'GET') {
    const { date } = request.query;
    // const appointments = await database.appointments.findMany({ where: { date, status: 'active' } });
    return response.status(200).json({ date, occupiedTimes: [] });
  }

  // POST /api/appointments — создать запись.
  if (request.method === 'POST') {
    const { service, date, time, name, phone, comment } = request.body || {};
    if (![service, date, time, name, phone, comment].every(Boolean) || !validTime(date, time)) {
      return response.status(400).json({ error: 'Проверьте данные записи.' });
    }
    // 1. В транзакции базы данных проверить, что слот не занят.
    // 2. Создать appointment с UUID и одноразовым manageToken.
    // 3. Отправить владельцу WhatsApp-уведомление через WhatsApp Business Cloud API.
    // 4. Вернуть public management URL клиенту.
    return response.status(501).json({ error: 'Подключите базу данных и WhatsApp Business API.' });
  }

  // PATCH /api/appointments/:id — отмена/перенос. Проверяйте manageToken в теле запроса.
  if (request.method === 'PATCH') {
    // Не доверяйте id из браузера без проверки одноразового токена.
    return response.status(501).json({ error: 'Подключите проверку токена и базу данных.' });
  }

  response.setHeader('Allow', ['GET', 'POST', 'PATCH']);
  return response.status(405).end('Method Not Allowed');
}
