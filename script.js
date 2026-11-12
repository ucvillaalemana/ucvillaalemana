// Menú adaptable y actualización del año del pie de página.
const menuButton = document.getElementById('menu-button');
const navigation = document.getElementById('navegacion');

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const isOpen = navigation.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
  });
  navigation.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navigation.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Abrir menú');
    });
  });
}
const yearElement = document.getElementById('year');
if (yearElement) yearElement.textContent = new Date().getFullYear();


// Ficha local: los datos del menor no se almacenan ni se envían automáticamente.
(() => {
  const form = document.getElementById('enrollment-form');
  if (!form) return;
  const panel = document.getElementById('ficha-panel');
  const feedback = document.getElementById('form-feedback');
  const category = document.getElementById('student-category');
  const birth = document.getElementById('student-birth');
  const hint = document.getElementById('category-hint');
  const phone = document.getElementById('guardian-phone');

  // Evita fechas futuras sin depender de una fecha rígida.
  const now = new Date();
  const localToday = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  birth.max = localToday;

  document.querySelectorAll('[data-category]').forEach((link) => {
    link.addEventListener('click', () => {
      category.value = link.dataset.category;
      showYearHint();
    });
  });

  function showYearHint() {
    const year = birth.value ? Number(birth.value.slice(0, 4)) : null;
    const ranges = { 'Sub 6': [2019, 2021], 'Sub 12': [2014, 2015], 'Sub 15': [2011, 2013] };
    const range = ranges[category.value];
    if (year && range && (year < range[0] || year > range[1])) {
      hint.textContent = 'La fecha de nacimiento no coincide con los años publicados para esta categoría. Puedes generar la ficha, pero confirma el grupo con la escuela.';
      hint.classList.add('field-warning');
    } else {
      hint.textContent = 'Las categorías y años son referenciales según los afiches. La escuela confirmará el grupo correspondiente.';
      hint.classList.remove('field-warning');
    }
  }
  category.addEventListener('change', showYearHint);
  birth.addEventListener('change', showYearHint);

  // Un cambio invalida la ficha anterior: no mostramos información desactualizada.
  form.addEventListener('input', () => {
    if (!panel.hidden) {
      panel.hidden = true;
      feedback.textContent = 'Cambiaste los datos. Genera la ficha nuevamente para actualizarla.';
    }
  });

  function setValue(id, value) {
    document.getElementById(id).textContent = value || 'No informado';
  }
  function displayDate(value) {
    const [year, month, day] = value.split('-').map(Number);
    return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(year, month - 1, day));
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const digits = phone.value.replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 13) {
      phone.setCustomValidity('Ingresa un teléfono válido (8 a 13 dígitos).');
      phone.reportValidity();
      phone.setCustomValidity('');
      return;
    }
    const values = {
      student: document.getElementById('student-name').value.trim(),
      dob: birth.value,
      category: category.value,
      guardian: document.getElementById('guardian-name').value.trim(),
      phone: phone.value.trim(),
      email: document.getElementById('guardian-email').value.trim(),
      note: document.getElementById('enrollment-note').value.trim()
    };
    if (!values.student || !values.guardian) {
      feedback.textContent = 'Escribe el nombre del alumno y del apoderado.';
      return;
    }
    const date = new Date();
    setValue('sheet-date', new Intl.DateTimeFormat('es-CL', {day:'2-digit',month:'long',year:'numeric'}).format(date));
    setValue('sheet-student', values.student);
    setValue('sheet-birth', displayDate(values.dob));
    setValue('sheet-category', values.category === 'Por confirmar' ? 'Por confirmar con la escuela' : values.category);
    setValue('sheet-guardian', values.guardian);
    setValue('sheet-phone', values.phone);
    setValue('sheet-email', values.email);
    setValue('sheet-note', values.note);

    // WhatsApp abre un mensaje breve para coordinar. No comparte datos del menor.
    const message = [
      'Hola, soy ' + values.guardian + '.',
      'Generé una ficha de preinscripción de la Escuela UC Villa Alemana.',
      'Categoría de interés: ' + (values.category === 'Por confirmar' ? 'por confirmar' : values.category) + '.',
      'Quisiera saber cómo entregar la ficha y confirmar cupos. Gracias.'
    ].join('\n');
    document.getElementById('send-whatsapp').href = 'https://wa.me/56926807340?text=' + encodeURIComponent(message);
    panel.hidden = false;
    feedback.textContent = 'Ficha generada. Revísala antes de compartir o imprimir.';
    panel.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });

  document.getElementById('print-ficha').addEventListener('click', () => {
    if (!panel.hidden) window.print();
  });
})();
