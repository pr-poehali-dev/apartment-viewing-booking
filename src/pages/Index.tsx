import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const APARTMENT_IMAGE = "https://cdn.poehali.dev/projects/5c9ea8b3-61dc-4ef7-9f61-5e9eefeae578/bucket/746f13f6-9d6b-4af0-90a7-dace93c14f74.jpeg";
const API_URL = "https://functions.poehali.dev/5a08dbc2-9473-421c-81e1-b8ea69be7525";

const MONTHS = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
const WEEK_DAYS = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
const TIME_SLOTS = ["10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}
function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function isDatePast(year: number, month: number, day: number) {
  const d = new Date(year, month, day);
  d.setHours(0,0,0,0);
  const t = new Date();
  t.setHours(0,0,0,0);
  return d < t;
}

export default function Index() {
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState<"calendar" | "form" | "success">("calendar");
  const [form, setForm] = useState({ name: "", phone: "", comment: "" });
  const [loading, setLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);

  useEffect(() => {
    if (!selectedDate) return;
    setBookedSlots([]);
    fetch(`${API_URL}?date=${selectedDate}`)
      .then(r => r.json())
      .then(data => setBookedSlots(data.booked || []))
      .catch(() => {});
  }, [selectedDate]);

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
    setSelectedDate(null); setSelectedTime(null);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
    setSelectedDate(null); setSelectedTime(null);
  };

  const handleDayClick = (day: number) => {
    const date = formatDate(calYear, calMonth, day);
    if (isDatePast(calYear, calMonth, day)) return;
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const availableSlots = TIME_SLOTS.filter(t => !bookedSlots.includes(t));
  const isDateFullyBooked = bookedSlots.length === TIME_SLOTS.length;
  const canProceed = selectedDate && selectedTime;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setLoading(true);
    setSubmitError(null);
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        date: selectedDate,
        display_date: selectedDate ? formatDisplayDate(selectedDate) : "",
        time: selectedTime,
        comment: form.comment,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.status === 409) {
      setSubmitError(data.error || "Это время уже занято, выберите другое");
      setBookedSlots(prev => [...prev, selectedTime!]);
      setSelectedTime(null);
      setStep("calendar");
      return;
    }
    setStep("success");
  };

  const formatDisplayDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const weekDay = new Date(y, m - 1, d).getDay();
    const wd = weekDay === 0 ? "Вс" : WEEK_DAYS[weekDay - 1];
    return `${d} ${MONTHS[m - 1]}, ${wd}`;
  };

  return (
    <div className="min-h-screen font-golos bg-[#0f0f0f] text-white">
      {/* Hero */}
      <div className="relative h-[55vh] min-h-[360px] overflow-hidden">
        <img
          src={APARTMENT_IMAGE}
          alt="Квартира"
          className="absolute inset-0 w-full h-full object-cover scale-105"
          style={{ filter: "brightness(0.45)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#0f0f0f]" />
        <div className="relative z-10 flex flex-col justify-end h-full px-6 pb-10 md:px-16 max-w-5xl mx-auto">
          <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <span className="inline-flex items-center gap-2 bg-coral-500 text-white text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              <Icon name="MapPin" size={12} />
              ул. Алябьева, д. 2
            </span>
            <h1 className="font-cormorant text-5xl md:text-7xl font-semibold leading-none mb-3">
              Запись на показ<br />
              <span className="italic text-coral-400">квартиры</span>
            </h1>
            <p className="text-white/60 text-lg max-w-md">
              2-комнатная · 41 м² · 3 этаж
            </p>
            <p className="text-3xl font-bold mt-3 text-white">
              20 500 000 <span className="text-coral-400 text-2xl">₽</span>
            </p>
            <a
              href="tel:+79165882959"
              className="inline-flex items-center gap-2 mt-5 bg-white text-[#0f0f0f] font-bold px-6 py-3 rounded-2xl hover:bg-coral-400 hover:text-white transition-all duration-200 shadow-lg text-base"
            >
              <Icon name="Phone" size={18} /> Позвонить
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 md:px-16 py-12">

        {step === "calendar" && (
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {submitError && (
              <div className="md:col-span-2 bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-4 flex items-center gap-3 text-red-400 text-sm font-medium animate-fade-in">
                <Icon name="AlertCircle" size={18} className="flex-shrink-0" />
                {submitError}
              </div>
            )}
            {/* Calendar */}
            <div className="animate-fade-in">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-coral-500 flex items-center justify-center text-sm font-bold">1</span>
                Выберите дату
              </h2>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-5">
                  <button onClick={prevMonth} className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                    <Icon name="ChevronLeft" size={18} />
                  </button>
                  <span className="font-semibold text-lg capitalize">{MONTHS[calMonth]} {calYear}</span>
                  <button onClick={nextMonth} className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                    <Icon name="ChevronRight" size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-7 mb-2">
                  {WEEK_DAYS.map(d => (
                    <div key={d} className="text-center text-xs font-medium text-white/40 py-1">{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = formatDate(calYear, calMonth, day);
                    const past = isDatePast(calYear, calMonth, day);
                    const fullyBooked = dateStr === selectedDate && isDateFullyBooked;
                    const selected = selectedDate === dateStr;
                    const isToday = dateStr === formatDate(today.getFullYear(), today.getMonth(), today.getDate());

                    return (
                      <button
                        key={day}
                        onClick={() => handleDayClick(day)}
                        disabled={past || fullyBooked}
                        className={[
                          "relative aspect-square rounded-xl text-sm font-medium transition-all duration-200",
                          selected ? "bg-coral-500 text-white shadow-lg shadow-coral-500/30 scale-110" : "",
                          !selected && !past && !fullyBooked ? "hover:bg-coral-500/20 hover:text-coral-300 cursor-pointer" : "",
                          past ? "text-white/20 cursor-default" : "",
                          fullyBooked && !past ? "text-white/25 cursor-default line-through" : "",
                          isToday && !selected ? "ring-1 ring-coral-500/60" : "",
                        ].join(" ")}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10 text-xs text-white/40">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-coral-400" /> Частично занято</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-white/20" /> Полностью занято</span>
                </div>
              </div>
            </div>

            {/* Time Slots */}
            <div className="animate-fade-in" style={{ animationDelay: "0.15s" }}>
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${selectedDate ? "bg-coral-500" : "bg-white/15"}`}>2</span>
                Выберите время
              </h2>

              {!selectedDate ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[200px] text-center">
                  <Icon name="CalendarDays" size={36} className="text-white/20 mb-3" />
                  <p className="text-white/40">Сначала выберите дату на календаре</p>
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <p className="text-coral-400 text-sm font-medium mb-4 flex items-center gap-2">
                    <Icon name="Calendar" size={14} />
                    {formatDisplayDate(selectedDate)}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {TIME_SLOTS.map(slot => {
                      const busy = bookedSlots.includes(slot);
                      const sel = selectedTime === slot;
                      return (
                        <button
                          key={slot}
                          onClick={() => !busy && setSelectedTime(slot)}
                          disabled={busy}
                          className={[
                            "py-3 rounded-xl text-sm font-semibold transition-all duration-200",
                            sel ? "bg-coral-500 text-white shadow-lg shadow-coral-500/30" : "",
                            !sel && !busy ? "bg-white/8 hover:bg-coral-500/20 hover:text-coral-300 border border-white/10" : "",
                            busy ? "bg-white/4 text-white/20 cursor-default border border-white/5 line-through" : "",
                          ].join(" ")}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-white/30 text-xs mt-4">Доступно {availableSlots.length} из {TIME_SLOTS.length} слотов</p>
                </div>
              )}

              <button
                onClick={() => canProceed && setStep("form")}
                disabled={!canProceed}
                className={[
                  "w-full mt-6 py-4 rounded-2xl font-bold text-lg transition-all duration-300",
                  canProceed
                    ? "bg-coral-500 hover:bg-coral-400 text-white shadow-xl shadow-coral-500/25 hover:scale-[1.02] active:scale-[0.98]"
                    : "bg-white/8 text-white/30 cursor-default border border-white/10",
                ].join(" ")}
              >
                {canProceed ? (
                  <span className="flex items-center justify-center gap-2">Продолжить <Icon name="ArrowRight" size={20} /></span>
                ) : "Выберите дату и время"}
              </button>
            </div>
          </div>
        )}

        {step === "form" && (
          <div className="animate-slide-up max-w-lg mx-auto">
            <button onClick={() => setStep("calendar")} className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-8 transition-colors">
              <Icon name="ArrowLeft" size={16} /> Назад к выбору времени
            </button>

            <h2 className="text-3xl font-semibold mb-2">Ваши данные</h2>
            <p className="text-white/50 mb-8">
              Запись на <span className="text-coral-400 font-medium">{selectedDate && formatDisplayDate(selectedDate)} в {selectedTime}</span>
            </p>

            <div className="bg-coral-500/10 border border-coral-500/30 rounded-2xl p-4 mb-8 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-coral-500/20 flex items-center justify-center flex-shrink-0">
                <Icon name="Home" size={18} className="text-coral-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">Квартира на ул. Алябьева, д. 2</p>
                <p className="text-white/50 text-xs mt-0.5">2-комнатная · 41 м² · Этаж 3 · 20 500 000 ₽</p>
                <p className="text-coral-400 text-sm font-medium mt-1">{selectedDate && formatDisplayDate(selectedDate)} · {selectedTime}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Имя *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Введите ваше имя"
                  required
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-coral-500 focus:bg-white/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Телефон *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+7 (___) ___-__-__"
                  required
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-coral-500 focus:bg-white/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Комментарий</label>
                <textarea
                  value={form.comment}
                  onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                  placeholder="Дополнительные вопросы или пожелания..."
                  rows={3}
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-coral-500 focus:bg-white/10 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !form.name || !form.phone}
                className={[
                  "w-full py-4 rounded-2xl font-bold text-lg mt-2 transition-all duration-300",
                  !loading && form.name && form.phone
                    ? "bg-coral-500 hover:bg-coral-400 text-white shadow-xl shadow-coral-500/25 hover:scale-[1.02] active:scale-[0.98]"
                    : "bg-white/8 text-white/30 cursor-default",
                ].join(" ")}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Отправляем...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Записаться на показ <Icon name="CheckCircle" size={20} />
                  </span>
                )}
              </button>
              <p className="text-white/25 text-xs text-center">
                Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
              </p>
            </form>
          </div>
        )}

        {step === "success" && (
          <div className="animate-scale-in flex flex-col items-center text-center py-16 max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full bg-coral-500/15 flex items-center justify-center mb-6 ring-4 ring-coral-500/20">
              <Icon name="CheckCircle" size={40} className="text-coral-400" />
            </div>
            <h2 className="font-cormorant text-5xl font-semibold mb-3">Вы записаны!</h2>
            <p className="text-white/50 text-lg mb-2">
              Показ запланирован на{" "}
              <span className="text-coral-400 font-medium">{selectedDate && formatDisplayDate(selectedDate)} в {selectedTime}</span>
            </p>
            <p className="text-white/40 mb-10">
              Мы свяжемся с вами по номеру <span className="text-white/70">{form.phone}</span> для подтверждения
            </p>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 w-full text-left mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-coral-500/20 flex items-center justify-center">
                  <Icon name="Info" size={14} className="text-coral-400" />
                </div>
                <span className="font-semibold text-sm">Что взять с собой</span>
              </div>
              <ul className="space-y-2 text-sm text-white/50">
                <li className="flex items-center gap-2"><Icon name="Check" size={14} className="text-coral-400 flex-shrink-0" /> Паспорт</li>
                <li className="flex items-center gap-2"><Icon name="Check" size={14} className="text-coral-400 flex-shrink-0" /> Список вопросов для менеджера</li>
                <li className="flex items-center gap-2"><Icon name="Check" size={14} className="text-coral-400 flex-shrink-0" /> Хорошее настроение 😊</li>
              </ul>
            </div>

            <button
              onClick={() => { setStep("calendar"); setSelectedDate(null); setSelectedTime(null); setForm({ name: "", phone: "", comment: "" }); }}
              className="text-coral-400 hover:text-coral-300 text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Icon name="RotateCcw" size={14} /> Записаться на другое время
            </button>
          </div>
        )}
      </div>

      <footer className="border-t border-white/8 mt-16 py-8 px-6 md:px-16 max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-white/25 text-sm">
        <span>© 2026 Агентство недвижимости</span>
        <div className="flex items-center gap-6">
          <a href="tel:+79165882959" className="hover:text-white/60 transition-colors flex items-center gap-1.5">
            <Icon name="Phone" size={13} /> +7 (916) 588-29-59
          </a>
          <a href="https://t.me/+79165882959" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors flex items-center gap-1.5">
            <Icon name="Send" size={13} /> Telegram
          </a>
        </div>
      </footer>
    </div>
  );
}