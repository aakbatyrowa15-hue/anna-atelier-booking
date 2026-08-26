const WHATSAPP_NUMBER = '77084428028';
const STORAGE_KEY = 'anna-atelier-bookings';
let selectedTime = null;
let activeBookingId = null;

const form = document.querySelector('#booking-form');
const dateInput = document.querySelector('#date');
const slots = document.querySelector('#slots');
const errorBox = document.querySelector('#form-error');
const confirmation = document.querySelector('#confirmation');
const manageDialog = document.querySelector('#manage-dialog');

const localDate = new Date();
localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
dateInput.min = localDate.toISOString().slice(0, 10);
document.querySelector('#year').textContent = new Date().getFullYear();

function bookings() { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
function saveBookings(items) { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
function formatDate(date) { return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00`)); }
function timesForDate(date) {
  const day = new Date(`${date}T12:00:00`).getDay();
  if (day === 0) return [];
  const start = day === 6 ? 11 * 60 : 18 * 60;
  const end = day === 6 ? 17 * 60 : 21 * 60;
  return Array.from({ length: (end - start) / 45 }, (_, i) => {
    const total = start + i * 45;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  });
}
function renderSlots() {
  selectedTime = null;
  slots.innerHTML = '';
  if (!dateInput.value) { slots.innerHTML = '<p class="slots-placeholder">Сначала выберите дату</p>'; return; }
  const available = timesForDate(dateInput.value);
  if (!available.length) { slots.innerHTML = '<p class="slots-placeholder">По воскресеньям ателье не работает. Выберите другую дату.</p>'; return; }
  const occupied = new Set(bookings().filter(b => b.date === dateInput.value && b.status !== 'cancelled').map(b => b.time));
  const now = new Date();
  available.forEach(time => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'slot'; button.textContent = time;
    const slotDate = new Date(`${dateInput.value}T${time}:00`);
    button.disabled = occupied.has(time) || slotDate < now;
    button.title = occupied.has(time) ? 'Это время уже занято' : '';
    button.addEventListener('click', () => { document.querySelectorAll('.slot').forEach(s => s.classList.remove('selected')); button.classList.add('selected'); selectedTime = time; errorBox.textContent = ''; });
    slots.append(button);
  });
}
dateInput.addEventListener('change', renderSlots);

function waLink(message) { return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`; }
form.addEventListener('submit', event => {
  event.preventDefault();
  errorBox.textContent = '';
  if (!form.checkValidity()) { errorBox.textContent = 'Пожалуйста, заполните все поля формы.'; form.reportValidity(); return; }
  if (!selectedTime) { errorBox.textContent = 'Пожалуйста, выберите свободное время.'; return; }
  const booking = { id: crypto.randomUUID(), service: form.service.value, date: dateInput.value, time: selectedTime, name: form.name.value.trim(), phone: form.phone.value.trim(), comment: form.comment.value.trim(), status: 'active', createdAt: new Date().toISOString() };
  saveBookings([...bookings(), booking]);
  activeBookingId = booking.id;
  const manageUrl = `${location.origin}${location.pathname}?manage=${booking.id}`;
  const message = `Новая запись в AnnA%0A%0AУслуга: ${booking.service}%0AДата: ${formatDate(booking.date)}%0AВремя: ${booking.time}%0AКлиент: ${booking.name}%0AТелефон: ${booking.phone}%0AЗадача: ${booking.comment}%0A%0AУправление записью: ${manageUrl}`;
  document.querySelector('#confirmation-name').textContent = booking.name;
  document.querySelector('#whatsapp-confirm').href = waLink(message.replace(/%0A/g, '\n'));
  confirmation.showModal();
  form.reset(); renderSlots();
});

function openManage(id) {
  const booking = bookings().find(item => item.id === id);
  if (!booking || booking.status === 'cancelled') return;
  activeBookingId = id;
  document.querySelector('#manage-details').textContent = `${formatDate(booking.date)}, ${booking.time}`;
  manageDialog.showModal();
}
document.querySelectorAll('.dialog-close').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelector('#manage-link').addEventListener('click', () => { confirmation.close(); openManage(activeBookingId); });
document.querySelector('#cancel-booking').addEventListener('click', () => {
  saveBookings(bookings().map(item => item.id === activeBookingId ? { ...item, status: 'cancelled' } : item));
  manageDialog.close(); renderSlots();
  alert('Запись отменена. Если планы изменятся, выберите новое удобное время.');
});
const queryBooking = new URLSearchParams(location.search).get('manage');
if (queryBooking) { window.addEventListener('load', () => openManage(queryBooking)); }

/*
  Публикация: localStorage предназначен только для демо-версии. Для работы с нескольких
  устройств замените functions bookings/saveBookings на запросы к API: GET /api/appointments,
  POST /api/appointments, PATCH /api/appointments/:id. См. server/README.md.
*/
