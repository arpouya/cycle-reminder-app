import { useEffect, useState } from "react";
import moment from "jalali-moment";
import { motion } from "framer-motion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const months = [
  "فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور",
  "مهر","آبان","آذر","دی","بهمن","اسفند"
];

const week = ["ش","ی","د","س","چ","پ","ج"];

export default function App() {
  const [cycles, setCycles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [offset, setOffset] = useState(0);

  const [manualAvg, setManualAvg] = useState(null);

  const [showHelp, setShowHelp] = useState(false);
  const [helpDone, setHelpDone] = useState(false);
  const [headerNote, setHeaderNote] = useState("");

  const [errorPopup, setErrorPopup] = useState(false);

  useEffect(() => {
  const saved = localStorage.getItem("cycles");

  if (saved) {
    try {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        const clean = parsed.filter(d =>
          d && moment(d).isValid()
        );
        setCycles(clean);
      } else {
        setCycles([]);
      }

    } catch (e) {
      setCycles([]);
    }
  }

  const savedAvg = localStorage.getItem("avgCycle");
  if (savedAvg) setManualAvg(Number(savedAvg));

  const savedHelp = localStorage.getItem("helpDone");
  const savedNote = localStorage.getItem("headerNote");

  if (savedHelp) setHelpDone(true);
  if (savedNote) setHeaderNote(savedNote);

  const savedSelected = localStorage.getItem("selected");
 if (savedSelected && moment(savedSelected).isValid()) {
  setSelected(moment(savedSelected).toISOString());
}}, []);

  useEffect(() => {
    localStorage.setItem("cycles", JSON.stringify(cycles));
  }, [cycles]);

  useEffect(() => {
    if (manualAvg) {
      localStorage.setItem("avgCycle", manualAvg);
    }
  }, [manualAvg]);

  useEffect(() => {
  if (selected) {
    localStorage.setItem("selected", moment(selected).toISOString());
  }
}, [selected]);

  const vibrate = () => navigator.vibrate?.(30);

 const toggle = (date) => {
  vibrate();

  setCycles(prev => {
    const exists = prev.some(c =>
      moment(c).isSame(moment(date), "day")
    );

    const updated = exists
      ? prev.filter(c => !moment(c).isSame(moment(date), "day"))
      : [...prev, date].slice(-6);

    const last = updated.at(-1) || null;

    setSelected(last);

    localStorage.setItem("cycles", JSON.stringify(updated));
    localStorage.setItem(
      "selected",
      last ? moment(last).toISOString() : ""
    );

    return updated;
  });
};

  const avg = () => {
    if (manualAvg) return manualAvg;

    if (cycles.length < 2) return 28;

    let diff = [];
    for (let i = 1; i < cycles.length; i++) {
      diff.push(moment(cycles[i]).diff(moment(cycles[i - 1]), "days"));
    }

    return Math.round(diff.reduce((a,b)=>a+b,0)/diff.length);
  };

  const predicted = selected
    ? moment(selected).add(avg(), "days")
    : null;

  const format = (date) => {
    if (!date) return null;

    const d = moment(date);
    const days = ["یکشنبه","دوشنبه","سه‌شنبه","چهارشنبه","پنجشنبه","جمعه","شنبه"];

    return `${days[d.day()]} ${d.jDate()} ${months[d.jMonth()]}`;
  };

  const render = (o) => {
    const base = moment().add(o, "months");
    const start = base.clone().startOf("jMonth");
    const count = start.daysInMonth();

    const cells = [];

    for (let i = 0; i < count; i++) {
      const day = start.clone().add(i, "days");

      const isCycle =
  cycles.some(c => moment(c).isSame(day, "day")) ||
  (selected && moment(selected).isSame(day, "day"));

      const isPred =
        predicted &&
        Math.abs(day.diff(predicted, "days")) <= 2;

      cells.push(
        <div
          key={i}
          onClick={() => toggle(day.toISOString())}
          style={{
            height: 40,
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            transition: "0.2s",
            background: isCycle
              ? "#0A84FF"
              : isPred
              ? "rgba(10,132,255,0.2)"
              : "rgba(255,255,255,0.04)",
            color: isCycle ? "white" : "rgba(255,255,255,0.75)"
          }}
        >
          {day.format("jD")}
        </div>
      );
    }

    return (
      <motion.div
        className="glass"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        whileTap={{ scale: 0.98 }}
        style={{
          width: "90vw",
          maxWidth: 420,
          padding: 14,
          borderRadius: 24,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(30px)",
        }}
      >
        <h3 style={{
          textAlign: "center",
          fontWeight: 600,
          marginBottom: 10
        }}>
          {months[base.jMonth()]} {base.jYear()}
        </h3>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          fontSize: 11,
          opacity: 0.6,
          marginBottom: 6,
          textAlign: "center"
        }}>
          {week.map((w,i)=><div key={i}>{w}</div>)}
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          gap: 5
        }}>
          {cells}
        </div>
      </motion.div>
    );
  };

  const next = selected
    ? moment(selected).add(avg(), "days")
    : null;

  const goToday = () => setOffset(0);

  const selectHelp = (type) => {
    if (type === "wrong") {
      setErrorPopup(true);
      return;
    }

    setHelpDone(true);
    setHeaderNote("کوچولووو منی شماااااا");

    localStorage.setItem("helpDone", "true");
    localStorage.setItem("headerNote", "کوچولووو منی شماااااا");

    setShowHelp(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      padding: 16,
      color: "white",
      fontFamily: "system-ui, -apple-system, sans-serif",
      background: "radial-gradient(circle at top,#0f172a,#05070d)"
    }}>

      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 10
      }}>
        <h2 style={{ fontSize: 30, fontWeight: 600 }}>
          💗😝 یادآوری
        </h2>

        {!helpDone && (
          <button onClick={()=>setShowHelp(true)} style={btn}>?</button>
        )}
      </div>
      {headerNote && (
      <div style={{
        textAlign: "center",
        fontSize: 15,
        opacity: 0.7
      }}>
        {headerNote}
      </div>)}
      <br/>

      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: 14,
        margin: "12px 0"
      }}>
        <button onClick={()=>setOffset(offset-1)} style={btn}>
          <FaChevronLeft />
        </button>

        <span style={{ opacity: 0.6 }}>ماه ها</span>

        <button onClick={()=>setOffset(offset+1)} style={btn}>
          <FaChevronRight />
        </button>
      </div>

      <div style={{ display:"flex", justifyContent:"center" }}>
        {render(offset)}
      </div>

      <div style={{
        marginTop: 16,
        width: "90vw",
        maxWidth: 420,
        marginInline: "auto",
        padding: 16,
        borderRadius: 22,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(30px)",
        direction: "rtl",
        textAlign: "right",
        fontFamily: "Vazirmatn, system-ui"
      }}>

        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 12 }}>
          تنظیمات سیکل
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>⏳ میانگین دوره</span>
            <span>{avg()} روز</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>🌸 پریود بعدی</span>
            <span style={{ color: next ? "#0A84FF" : "#aaa" }}>
              {next ? format(next) : "اطلاعات کافی نیست"}
            </span>
          </div>

          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              تنظیم میانگین دوره
            </div>

            <input
              type="range"
              min="20"
              max="40"
              value={manualAvg || avg()}
              onChange={(e) => setManualAvg(Number(e.target.value))}
              style={{ width: "100%" }}
            />

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              opacity: 0.7
            }}>
              <span>20</span>
              <span>{manualAvg || avg()} روز</span>
              <span>40</span>
            </div>
          </div>
        </div>

        <button
          onClick={goToday}
          style={{
            width: "100%",
            padding: 12,
            marginTop: 14,
            borderRadius: 14,
            border: "none",
            background: "#0A84FF",
            color: "white",
            fontWeight: 600
          }}
        >
          برو به امروز
        </button>
      </div>

      {showHelp && (
        <div style={{
          direction: "rtl",
          textAlign: "right",
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{
            width: "85vw",
            maxWidth: 320,
            padding: 16,
            borderRadius: 20,
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)"
          }}>
            <p>عاشقتممممم سلین خانوممممم 💗</p>
            <p>گوگوولیی/ناز/ملوسک/خوشگل/کوچولو من کیه ؟</p>

            <button
              onClick={() => selectHelp("right")}
              style={{
                width: "100%",
                height: 44,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "#0aff1e",
                color: "black",
                display: "flex",
                fontFamily: "Vazirmatn, system-ui",
                fontWeight:500,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 10
              }}
            >
              من من 😝
            </button>

            <button
              onClick={() => selectHelp("wrong")}
              style={{
                width: "100%",
                height: 44,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgb(255, 0, 0)",
                color: "black",
                display: "flex",
                fontFamily: "Vazirmatn, system-ui",
                fontWeight:500,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 10
              }}
            >
              نمیدونم یکی دیگه 😒
            </button>
          </div>
        </div>
      )}

      {errorPopup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          onClick={() => setErrorPopup(false)}
        >
          <motion.div
            initial={{ scale: 0.7, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "85vw",
              maxWidth: 320,
              padding: 16,
              fontWeight:500,
              borderRadius: 20,
              background: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(25px)",
              direction: "rtl",
              textAlign: "right"
            }}
          >
            <p>هههههه نمیذارم راهی نداری کوچولو 😝</p>

            <button
              onClick={() => setErrorPopup(false)}
              style={{
                width: "100%",
                height: 44,
                marginTop: 12,
                fontWeight:500,
                fontFamily: "Vazirmatn, system-ui",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "#0A84FF",
                color: "white"
              }}
            >
             باشه قبول =(
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

const btn = {
  width: 42,
  height: 42,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const btntwo = {
  width: 300,
  height: 42,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "#0A84FF",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};