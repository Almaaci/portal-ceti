// ============================================================
// PORTAL CETI — App.jsx completo y corregido
// ============================================================

import { useState, useEffect, useRef } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { auth, authAux, db, storage } from "./firebase";
import {
  collection, addDoc, setDoc, getDocs, getDoc, updateDoc, deleteDoc,
  doc, query, orderBy, where, serverTimestamp, onSnapshot,
} from "firebase/firestore";
import {
  ref, uploadBytesResumable, getDownloadURL, deleteObject,
} from "firebase/storage";

// ─── PALETA ──────────────────────────────────────────────────
const C = {
  azul:      "#1a3a6b",
  azulM:     "#1e4d8c",
  azulC:     "#2563eb",
  azulS:     "#dbeafe",
  naranja:   "#e85d04",
  naranjaM:  "#f97316",
  naranjaS:  "#fff7ed",
  exito:     "#16a34a",
  exitoS:    "#dcfce7",
  peligro:   "#dc2626",
  peligroS:  "#fee2e2",
  adv:       "#d97706",
  advS:      "#fef3c7",
  purpura:   "#7c3aed",
  purpuraS:  "#ede9fe",
  fondo:     "#f0f4f8",
  card:      "#ffffff",
  texto:     "#0f172a",
  suave:     "#475569",
  muy:       "#94a3b8",
  borde:     "#e2e8f0",
};

const fmtFecha = (ts) => {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const colorRol = (rol) => {
  if (rol === "Administrador") return [C.peligro,  C.peligroS];
  if (rol === "Maestro")       return [C.azulC,    C.azulS];
  return                              [C.exito,    C.exitoS];
};

const iniciales = (str = "") =>
  str.split(" ").slice(0, 2).map(w => w[0] || "").join("").toUpperCase() || "??";

// ─── LOGO ────────────────────────────────────────────────────
function Logo({ size = "md" }) {
  const s = size === "lg" ? { w: 64, font: 22 } : size === "sm" ? { w: 28, font: 11 } : { w: 42, font: 15 };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: s.w, height: s.w, borderRadius: "50%",
        background: `linear-gradient(135deg, ${C.naranja} 0%, ${C.naranjaM} 50%, ${C.azulC} 100%)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 3px 12px rgba(232,93,4,0.4)`, flexShrink: 0,
      }}>
        <svg viewBox="0 0 40 40" width={s.w * 0.6} height={s.w * 0.6} fill="none">
          <circle cx="20" cy="8" r="4" fill="white" />
          <path d="M14 16 Q20 13 26 16 L28 28 L22 26 L24 20 L20 22 L16 20 L18 26 L12 28Z" fill="white" />
          <path d="M26 18 L34 14 L32 22Z" fill="white" opacity="0.8" />
        </svg>
      </div>
      <div>
        <div style={{ fontWeight: 900, fontSize: s.font, color: size === "lg" ? C.azul : "#fff", letterSpacing: -0.5, lineHeight: 1 }}>ceti</div>
        <div style={{ fontSize: s.font * 0.6, fontWeight: 700, color: size === "lg" ? C.naranja : C.naranjaM, letterSpacing: 1, textTransform: "uppercase" }}>Colomos</div>
      </div>
    </div>
  );
}

// ─── COMPONENTES BASE ─────────────────────────────────────────
function Campo({ label, value, onChange, placeholder, type = "text", disabled = false }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.suave, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>}
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          width: "100%", padding: "10px 13px", borderRadius: 9,
          border: `1.5px solid ${focus ? C.azulC : C.borde}`,
          fontSize: 14, outline: "none", background: disabled ? C.fondo : "#fff",
          color: C.texto, boxSizing: "border-box", transition: "border-color 0.2s", fontFamily: "inherit",
        }}
      />
    </div>
  );
}

function CampoArea({ label, value, onChange, placeholder, rows = 4, disabled = false }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.suave, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>}
      <textarea
        rows={rows} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          width: "100%", padding: "10px 13px", borderRadius: 9,
          border: `1.5px solid ${focus ? C.azulC : C.borde}`,
          fontSize: 14, outline: "none", background: disabled ? C.fondo : "#fff",
          color: C.texto, boxSizing: "border-box", resize: "vertical",
          transition: "border-color 0.2s", fontFamily: "inherit",
        }}
      />
    </div>
  );
}

function CampoSelect({ label, value, onChange, options, disabled = false }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.suave, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>}
      <select
        value={value} onChange={onChange} disabled={disabled}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          width: "100%", padding: "10px 13px", borderRadius: 9,
          border: `1.5px solid ${focus ? C.azulC : C.borde}`,
          fontSize: 14, outline: "none", background: disabled ? C.fondo : "#fff",
          color: C.texto, boxSizing: "border-box", cursor: "pointer", fontFamily: "inherit",
        }}
      >
        {options.map((o) =>
          typeof o === "string"
            ? <option key={o} value={o}>{o}</option>
            : <option key={o.value} value={o.value}>{o.label}</option>
        )}
      </select>
    </div>
  );
}

function Btn({ children, onClick, variante = "primario", ancho = false, disabled = false, style: extra = {} }) {
  const [press, setPress] = useState(false);
  const estilos = {
    primario:   { background: `linear-gradient(135deg, ${C.azulC}, ${C.azul})`, color: "#fff", border: "none", boxShadow: "0 4px 14px rgba(37,99,235,0.25)" },
    peligro:    { background: `linear-gradient(135deg, ${C.peligro}, #b91c1c)`, color: "#fff", border: "none" },
    secundario: { background: "#fff", color: C.texto, border: `1.5px solid ${C.borde}` },
    naranja:    { background: `linear-gradient(135deg, ${C.naranjaM}, ${C.naranja})`, color: "#fff", border: "none" },
    exito:      { background: `linear-gradient(135deg, ${C.exito}, #15803d)`, color: "#fff", border: "none" },
    ghost:      { background: "transparent", color: C.azulC, border: `1.5px solid ${C.azulC}` },
  };
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseDown={() => setPress(true)} onMouseUp={() => setPress(false)} onMouseLeave={() => setPress(false)}
      style={{
        ...(estilos[variante] || estilos.primario),
        padding: "10px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13,
        cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.15s",
        transform: press ? "scale(0.97)" : "scale(1)",
        width: ancho ? "100%" : "auto", fontFamily: "inherit",
        display: "inline-flex", alignItems: "center", gap: 6,
        opacity: disabled ? 0.6 : 1, ...extra,
      }}
    >
      {children}
    </button>
  );
}

function Tarjeta({ children, style = {}, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => onClick && setHover(true)}
      onMouseLeave={() => onClick && setHover(false)}
      style={{
        background: C.card, borderRadius: 14,
        border: `1px solid ${hover ? C.azulC : C.borde}`,
        padding: "20px 22px",
        boxShadow: hover ? "0 6px 20px rgba(37,99,235,0.12)" : "0 2px 8px rgba(0,0,0,0.05)",
        cursor: onClick ? "pointer" : "default",
        transform: hover ? "translateY(-2px)" : "translateY(0)",
        transition: "all 0.18s ease",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Badge({ children, color, bg }) {
  return (
    <span style={{
      background: bg, color, fontWeight: 700, fontSize: 11,
      padding: "3px 10px", borderRadius: 20, display: "inline-block",
    }}>
      {children}
    </span>
  );
}

function Alerta({ tipo, children, onClose }) {
  const conf = {
    exito: { bg: C.exitoS, color: C.exito, icon: "✅" },
    error: { bg: C.peligroS, color: C.peligro, icon: "❌" },
    info:  { bg: C.azulS,   color: C.azulC,   icon: "ℹ️" },
    adv:   { bg: C.advS,    color: C.adv,     icon: "⚠️" },
  };
  const k = conf[tipo] || conf.info;
  return (
    <div style={{
      padding: "11px 16px", borderRadius: 10, background: k.bg,
      color: k.color, fontWeight: 600, fontSize: 13,
      display: "flex", alignItems: "center", gap: 8, marginTop: 10,
    }}>
      {k.icon} {children}
      {onClose && <span onClick={onClose} style={{ marginLeft: "auto", cursor: "pointer", opacity: 0.6 }}>✕</span>}
    </div>
  );
}

function Avatar({ letras, color, size = 38 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${color}, ${color}bb)`,
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 800, fontSize: size * 0.33, flexShrink: 0,
      boxShadow: `0 2px 8px ${color}40`,
    }}>
      {letras}
    </div>
  );
}

function Modal({ titulo, onClose, children, ancho = 560 }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 20,
    }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: C.card, borderRadius: 18, width: "100%", maxWidth: ancho,
        maxHeight: "90vh", overflow: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 22px", borderBottom: `1px solid ${C.borde}`,
          position: "sticky", top: 0, background: C.card, zIndex: 1,
        }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.texto }}>{titulo}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.muy, lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ padding: "22px" }}>{children}</div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{
        width: 36, height: 36, border: `3px solid ${C.borde}`,
        borderTop: `3px solid ${C.azulC}`, borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function EstadoBadge({ estado }) {
  if (estado === "leido") return <Badge color={C.exito} bg={C.exitoS}>🟢 Leído</Badge>;
  return <Badge color={C.azulC} bg={C.azulS}>🔵 No leído</Badge>;
}

// ─── SIDEBAR ─────────────────────────────────────────────────
function Sidebar({ pantalla, setPantalla, correo, rol, onCerrar }) {
  const items = [
    { id: "inicio",   icono: "🏠", label: "Inicio" },
    { id: "avisos",   icono: "📢", label: "Avisos" },
    { id: "mensajes", icono: "💬", label: "Mensajes" },
    { id: "usuarios", icono: "👥", label: "Usuarios" },
    { id: "informes", icono: "📊", label: "Informes" },
  ];
  const visibles = items.filter(i => !(i.id === "usuarios" && rol === "Estudiante"));
  const [colapsar, setColapsar] = useState(false);

  return (
    <div style={{
      width: colapsar ? 64 : 220, minHeight: "100vh",
      background: `linear-gradient(180deg, ${C.azul} 0%, #0a1f40 100%)`,
      display: "flex", flexDirection: "column", flexShrink: 0,
      position: "sticky", top: 0, height: "100vh",
      transition: "width 0.2s", overflow: "hidden",
    }}>
      <div style={{
        padding: "18px 14px", borderBottom: "1px solid rgba(255,255,255,0.1)",
        display: "flex", alignItems: "center", justifyContent: colapsar ? "center" : "space-between", gap: 8,
      }}>
        {!colapsar && <Logo />}
        {colapsar && (
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.naranja}, ${C.azulC})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: 14,
          }}>C</div>
        )}
        <button onClick={() => setColapsar(!colapsar)} style={{
          background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 7,
          color: "rgba(255,255,255,0.7)", cursor: "pointer", padding: "4px 6px", fontSize: 11,
        }}>
          {colapsar ? "▶" : "◀"}
        </button>
      </div>

      {!colapsar && (
        <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Avatar letras={iniciales(correo)} color={C.naranja} size={34} />
            <div style={{ minWidth: 0 }}>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 11.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{correo}</div>
              <div style={{ marginTop: 2 }}>
                <Badge color={colorRol(rol)[0]} bg="rgba(255,255,255,0.15)">{rol}</Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
        {visibles.map((item) => (
          <button
            key={item.id}
            onClick={() => setPantalla(item.id)}
            title={colapsar ? item.label : ""}
            style={{
              width: "100%", padding: colapsar ? "12px 0" : "10px 12px",
              borderRadius: 10, border: "none", cursor: "pointer",
              display: "flex", alignItems: "center",
              justifyContent: colapsar ? "center" : "flex-start",
              gap: 10, marginBottom: 2, fontWeight: 600, fontSize: 13,
              background: pantalla === item.id ? "rgba(255,255,255,0.15)" : "transparent",
              color: pantalla === item.id ? "#fff" : "rgba(255,255,255,0.55)",
              borderLeft: colapsar ? "none" : `3px solid ${pantalla === item.id ? C.naranjaM : "transparent"}`,
              transition: "all 0.15s", fontFamily: "inherit", textAlign: "left",
            }}
          >
            <span style={{ fontSize: 17 }}>{item.icono}</span>
            {!colapsar && item.label}
          </button>
        ))}
      </nav>

      <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <button
          onClick={onCerrar}
          style={{
            width: "100%", padding: "10px 0", borderRadius: 10, border: "none",
            background: "rgba(220,38,38,0.15)", color: "#fca5a5",
            cursor: "pointer", fontSize: colapsar ? 18 : 13,
            fontWeight: 600, fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          {colapsar ? "🚪" : "🚪 Cerrar sesión"}
        </button>
      </div>
    </div>
  );
}

// ─── TOPBAR ───────────────────────────────────────────────────
function TopBar({ pantalla, rol }) {
  const titulos = {
    inicio: "🏠 Inicio", avisos: "📢 Avisos Institucionales",
    mensajes: "💬 Mensajes", usuarios: "👥 Usuarios", informes: "📊 Informes",
  };
  const [c0, c1] = colorRol(rol);
  return (
    <div style={{
      background: C.card, borderBottom: `1px solid ${C.borde}`,
      padding: "13px 26px", display: "flex", alignItems: "center", justifyContent: "space-between",
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)", position: "sticky", top: 0, zIndex: 100,
    }}>
      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.texto }}>
        {titulos[pantalla] || "Portal CETI"}
      </h2>
      <Badge color={c0} bg={c1}>{rol}</Badge>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────
function Login() {
  const [correo, setCorreo]         = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando]     = useState(false);
  const [error, setError]           = useState("");

  const handleLogin = async () => {
    if (!correo || !contrasena) { setError("Ingresa correo y contraseña."); return; }
    setCargando(true); setError("");
    try {
      await signInWithEmailAndPassword(auth, correo.trim().toLowerCase(), contrasena);
    } catch (e) {
      const msgs = {
        "auth/user-not-found":     "No existe una cuenta con ese correo.",
        "auth/wrong-password":     "Contraseña incorrecta.",
        "auth/invalid-credential": "Correo o contraseña incorrectos.",
        "auth/too-many-requests":  "Demasiados intentos. Intenta más tarde.",
      };
      setError(msgs[e.code] || "Correo o contraseña incorrectos.");
    } finally { setCargando(false); }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: `linear-gradient(135deg, ${C.azul} 0%, #0a1f40 50%, ${C.azulM} 100%)`,
      padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{
          background: "rgba(255,255,255,0.97)", borderRadius: 22,
          padding: "40px 38px", boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
        }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 30 }}>
            <Logo size="lg" />
            <div style={{ marginTop: 14, textAlign: "center" }}>
              <div style={{ fontWeight: 900, fontSize: 22, color: C.azul, letterSpacing: -0.5 }}>Portal Institucional</div>
              <div style={{ fontSize: 13, color: C.suave, marginTop: 4 }}>Centro de Enseñanza Técnica Industrial</div>
            </div>
          </div>
          <Campo label="Correo institucional" value={correo} onChange={e => setCorreo(e.target.value)} placeholder="usuario@ceti.mx" type="email" />
          <Campo label="Contraseña" value={contrasena} onChange={e => setContrasena(e.target.value)} placeholder="••••••••" type="password" />
          {error && <Alerta tipo="error">{error}</Alerta>}
          <Btn ancho variante="primario" onClick={handleLogin} disabled={cargando} style={{ marginTop: 16, padding: "13px 0", fontSize: 15 }}>
            {cargando ? "Verificando..." : "🔐 Iniciar sesión"}
          </Btn>
        </div>
        <div style={{ textAlign: "center", marginTop: 18, color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
          © {new Date().getFullYear()} CETI Colomos — Sistema Institucional
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD MEJORADO ───────────────────────────────────────
function Dashboard({ correo, rol, stats, actividad, setPantalla, setFiltroUsuarios }) {
  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";

  const tarjetas = [
    { icono: "👥", val: stats.totalUsuarios,     label: "Usuarios totales",  color: C.azulC,   bg: C.azulS,   accion: () => { setPantalla("usuarios"); setFiltroUsuarios("Todos"); } },
    { icono: "🎓", val: stats.totalEstudiantes,  label: "Estudiantes",       color: C.exito,   bg: C.exitoS,  accion: () => { setPantalla("usuarios"); setFiltroUsuarios("Estudiante"); } },
    { icono: "🧑‍🏫",val: stats.totalMaestros,     label: "Maestros",          color: C.purpura, bg: C.purpuraS,accion: () => { setPantalla("usuarios"); setFiltroUsuarios("Maestro"); } },
    { icono: "⚙️", val: stats.totalAdmins,       label: "Administradores",   color: C.peligro, bg: C.peligroS,accion: () => { setPantalla("usuarios"); setFiltroUsuarios("Administrador"); } },
    { icono: "📢", val: stats.totalAvisos,       label: "Avisos",            color: C.naranja, bg: C.naranjaS,accion: () => setPantalla("avisos") },
    { icono: "💬", val: stats.totalMensajes,     label: "Mensajes",          color: C.azulM,   bg: C.azulS,   accion: () => setPantalla("mensajes") },
    { icono: "📊", val: stats.totalInformes,     label: "Informes",          color: C.adv,     bg: C.advS,    accion: () => setPantalla("informes") },
  ];

  // Solo mostrar Usuarios si no es estudiante
  const tarjetasVisibles = tarjetas.filter((_, i) => {
    if (rol === "Estudiante" && i <= 3) return false;
    return true;
  });

  return (
    <div>
      {/* Saludo */}
      <div style={{
        background: `linear-gradient(135deg, ${C.azul} 0%, ${C.azulM} 100%)`,
        borderRadius: 16, padding: "24px 28px", marginBottom: 24,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        boxShadow: "0 4px 20px rgba(26,58,107,0.3)",
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>{saludo} 👋</h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: 0 }}>
            Sesión como <strong style={{ color: "#fff" }}>{correo}</strong> · <strong style={{ color: C.naranjaM }}>{rol}</strong>
          </p>
        </div>
        <Logo />
      </div>

      {/* Tarjetas de estadísticas clickeables */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
        {tarjetasVisibles.map((s, i) => (
          <Tarjeta
            key={i}
            onClick={s.accion}
            style={{ padding: "16px 18px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 46, height: 46, borderRadius: 12, background: s.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, flexShrink: 0,
              }}>
                {s.icono}
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 900, color: C.texto, lineHeight: 1 }}>{s.val ?? "—"}</div>
                <div style={{ fontSize: 11, color: C.suave, marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: s.color, fontWeight: 700 }}>
              Ver {s.label.toLowerCase()} →
            </div>
          </Tarjeta>
        ))}
      </div>

      {/* Actividad reciente */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>

        {/* Últimos usuarios — solo admin/maestro */}
        {rol !== "Estudiante" && (
          <Tarjeta>
            <h4 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 800, color: C.texto }}>👥 Últimos usuarios</h4>
            {actividad.usuarios.length === 0
              ? <div style={{ color: C.muy, fontSize: 13 }}>Sin datos</div>
              : actividad.usuarios.map((u, i) => (
                <div
                  key={i}
                  onClick={() => { setPantalla("usuarios"); setFiltroUsuarios("Todos"); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, marginBottom: 12,
                    cursor: "pointer", padding: "6px 8px", borderRadius: 8,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = C.fondo}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <Avatar letras={iniciales(u.nombre || u.correo)} color={colorRol(u.rol)[0]} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.texto, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.nombre || u.correo}</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 2 }}>
                      <Badge color={colorRol(u.rol)[0]} bg={colorRol(u.rol)[1]}>{u.rol}</Badge>
                      <span style={{ fontSize: 10, color: C.muy }}>{fmtFecha(u.fechaCreacion)}</span>
                    </div>
                  </div>
                </div>
              ))
            }
            <div
              onClick={() => { setPantalla("usuarios"); setFiltroUsuarios("Todos"); }}
              style={{ fontSize: 12, color: C.azulC, fontWeight: 700, cursor: "pointer", marginTop: 4 }}
            >
              Ver todos los usuarios →
            </div>
          </Tarjeta>
        )}

        {/* Últimos avisos */}
        <Tarjeta>
          <h4 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 800, color: C.texto }}>📢 Últimos avisos</h4>
          {actividad.avisos.length === 0
            ? <div style={{ color: C.muy, fontSize: 13 }}>Sin datos</div>
            : actividad.avisos.map((a, i) => (
              <div
                key={i}
                onClick={() => setPantalla("avisos")}
                style={{
                  marginBottom: 12, padding: "8px 10px", borderRadius: 8,
                  cursor: "pointer", transition: "background 0.15s",
                  borderBottom: i < actividad.avisos.length - 1 ? `1px solid ${C.borde}` : "none",
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.fondo}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: C.texto, marginBottom: 3 }}>{a.titulo}</div>
                <div style={{ display: "flex", gap: 10, fontSize: 11, color: C.muy }}>
                  <span>✍️ {a.autor || "—"}</span>
                  <span>📅 {fmtFecha(a.fechaCreacion)}</span>
                </div>
              </div>
            ))
          }
          <div onClick={() => setPantalla("avisos")} style={{ fontSize: 12, color: C.azulC, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>
            Ver todos los avisos →
          </div>
        </Tarjeta>

        {/* Últimos informes */}
        <Tarjeta>
          <h4 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 800, color: C.texto }}>📊 Últimos informes</h4>
          {actividad.informes.length === 0
            ? <div style={{ color: C.muy, fontSize: 13 }}>Sin datos</div>
            : actividad.informes.map((inf, i) => (
              <div
                key={i}
                onClick={() => setPantalla("informes")}
                style={{
                  marginBottom: 12, padding: "8px 10px", borderRadius: 8,
                  cursor: "pointer", transition: "background 0.15s",
                  borderBottom: i < actividad.informes.length - 1 ? `1px solid ${C.borde}` : "none",
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.fondo}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: C.texto, marginBottom: 3 }}>{inf.titulo}</div>
                <div style={{ display: "flex", gap: 10, fontSize: 11, color: C.muy }}>
                  <span>✍️ {inf.autor || "—"}</span>
                  <span>📅 {fmtFecha(inf.fecha)}</span>
                </div>
              </div>
            ))
          }
          <div onClick={() => setPantalla("informes")} style={{ fontSize: 12, color: C.azulC, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>
            Ver todos los informes →
          </div>
        </Tarjeta>
      </div>
    </div>
  );
}

// ─── AVISOS ───────────────────────────────────────────────────
function Avisos({ correo, rol }) {
  const esAdmin   = rol === "Administrador";
  const esMaestro = rol === "Maestro";
  const puede     = esAdmin || esMaestro;

  const [avisos,   setAvisos]   = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalForm,setModalForm]= useState(false);
  const [editando, setEditando] = useState(null);
  const [msg,      setMsg]      = useState(null);

  const vacioForm = { titulo: "", contenido: "", tipo: "General" };
  const [form, setForm] = useState(vacioForm);

  useEffect(() => {
    const q = query(collection(db, "avisos"), orderBy("fechaCreacion", "desc"));
    const unsub = onSnapshot(q, snap => {
      setAvisos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCargando(false);
    }, () => setCargando(false));
    return unsub;
  }, []);

  const abrirNuevo  = () => { setEditando(null); setForm(vacioForm); setMsg(null); setModalForm(true); };
  const abrirEditar = (a) => { setEditando(a); setForm({ titulo: a.titulo, contenido: a.contenido, tipo: a.tipo || "General" }); setMsg(null); setModalForm(true); };

  const guardar = async () => {
    if (!form.titulo.trim() || !form.contenido.trim()) { setMsg({ tipo: "error", txt: "Título y contenido son requeridos." }); return; }
    try {
      if (editando) {
        await updateDoc(doc(db, "avisos", editando.id), { titulo: form.titulo, contenido: form.contenido, tipo: form.tipo, fechaActualizacion: serverTimestamp() });
        setMsg({ tipo: "exito", txt: "Aviso actualizado." });
      } else {
        await addDoc(collection(db, "avisos"), { titulo: form.titulo, contenido: form.contenido, tipo: form.tipo, autor: correo, correoAutor: correo, fechaCreacion: serverTimestamp(), fechaActualizacion: serverTimestamp() });
        setMsg({ tipo: "exito", txt: "Aviso publicado." });
      }
      setModalForm(false);
    } catch (e) { setMsg({ tipo: "error", txt: "Error: " + e.message }); }
  };

  const eliminar = async (aviso) => {
    if (!(esAdmin || (esMaestro && aviso.correoAutor === correo))) { setMsg({ tipo: "error", txt: "Sin permiso." }); return; }
    if (!confirm(`¿Eliminar aviso "${aviso.titulo}"?`)) return;
    await deleteDoc(doc(db, "avisos", aviso.id));
  };

  const colorTipo = { General: [C.azulC, C.azulS], Urgente: [C.peligro, C.peligroS], Informativo: [C.exito, C.exitoS] };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: C.texto }}>Avisos Institucionales</h2>
        {puede && <Btn onClick={abrirNuevo}>📝 Nuevo aviso</Btn>}
      </div>
      {msg && <Alerta tipo={msg.tipo} onClose={() => setMsg(null)}>{msg.txt}</Alerta>}
      {cargando ? <Spinner /> : avisos.length === 0 ? (
        <Tarjeta><div style={{ textAlign: "center", padding: 40, color: C.muy }}><div style={{ fontSize: 40 }}>📭</div><div style={{ fontWeight: 600, marginTop: 8 }}>No hay avisos</div></div></Tarjeta>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {avisos.map(a => {
            const [cc, bg] = colorTipo[a.tipo] || colorTipo.General;
            const puedeE = esAdmin || (esMaestro && a.correoAutor === correo);
            return (
              <Tarjeta key={a.id} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>📢</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: C.texto }}>{a.titulo}</span>
                    <Badge color={cc} bg={bg}>{a.tipo || "General"}</Badge>
                  </div>
                  <div style={{ fontSize: 13, color: C.suave, lineHeight: 1.6, marginBottom: 8 }}>{a.contenido}</div>
                  <div style={{ fontSize: 11, color: C.muy, display: "flex", gap: 14, flexWrap: "wrap" }}>
                    <span>✍️ {a.autor || "—"}</span>
                    <span>📅 {fmtFecha(a.fechaCreacion)}</span>
                  </div>
                </div>
                {puedeE && (
                  <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
                    <Btn variante="secundario" onClick={() => abrirEditar(a)} style={{ padding: "7px 12px", fontSize: 12 }}>✏️</Btn>
                    <Btn variante="peligro"    onClick={() => eliminar(a)}    style={{ padding: "7px 12px", fontSize: 12 }}>🗑️</Btn>
                  </div>
                )}
              </Tarjeta>
            );
          })}
        </div>
      )}
      {modalForm && (
        <Modal titulo={editando ? "Editar aviso" : "Nuevo aviso"} onClose={() => setModalForm(false)}>
          <Campo label="Título *" value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} placeholder="Título del aviso" />
          <CampoArea label="Contenido *" value={form.contenido} onChange={e => setForm(p => ({ ...p, contenido: e.target.value }))} placeholder="Detalle del aviso..." rows={5} />
          <CampoSelect label="Tipo" value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))} options={["General", "Urgente", "Informativo"]} />
          {msg && <Alerta tipo={msg.tipo}>{msg.txt}</Alerta>}
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <Btn onClick={guardar}>{editando ? "💾 Actualizar" : "📤 Publicar"}</Btn>
            <Btn variante="secundario" onClick={() => setModalForm(false)}>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── MENSAJES ────────────────────────────────────────────────
function Mensajes({ correo, rol }) {
  const esAdmin      = rol === "Administrador";
  const esMaestro    = rol === "Maestro";
  const esEstudiante = rol === "Estudiante";

  const [tab,        setTab]       = useState("recibidos");
  const [mensajes,   setMensajes]  = useState([]);
  const [publicados, setPublicados]= useState([]);
  const [cargando,   setCargando]  = useState(true);
  const [verMensaje, setVerMensaje]= useState(null);
  const [msg,        setMsg]       = useState(null);

  const vacioForm = { destinatario: "", rolDestino: "Administrador", asunto: "", mensaje: "" };
  const [form, setForm] = useState(vacioForm);
  const [formPub, setFormPub] = useState({ titulo: "", contenido: "" });
  const [respuestaTexto, setRespuestaTexto] = useState("");

  const cargarPrivados = async () => {
    setCargando(true);
    const campo = tab === "recibidos" ? "destinatario" : "remitente";
    const snap = await getDocs(query(collection(db, "mensajes"), where(campo, "==", correo), orderBy("fecha", "desc")));
    setMensajes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setCargando(false);
  };

  const cargarPublicos = async () => {
    setCargando(true);
    const snap = await getDocs(query(collection(db, "mensajesPublicos"), orderBy("fecha", "desc")));
    setPublicados(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setCargando(false);
  };

  useEffect(() => {
    if (tab === "publica") cargarPublicos();
    else if (tab !== "nueva") cargarPrivados();
    else setCargando(false);
  }, [tab]);

  const enviarPrivado = async () => {
    if (!form.destinatario || !form.mensaje) { setMsg({ tipo: "error", txt: "Destinatario y mensaje son requeridos." }); return; }
    try {
      await addDoc(collection(db, "mensajes"), {
        remitente: correo, destinatario: form.destinatario,
        rolDestino: form.rolDestino, asunto: form.asunto,
        mensaje: form.mensaje, estado: "noleido",
        fecha: serverTimestamp(), respuestas: [],
      });
      setMsg({ tipo: "exito", txt: "Mensaje enviado." });
      setForm(vacioForm); setTab("enviados");
    } catch (e) { setMsg({ tipo: "error", txt: e.message }); }
  };

  const publicarMensaje = async () => {
    if (!formPub.titulo || !formPub.contenido) { setMsg({ tipo: "error", txt: "Completa título y contenido." }); return; }
    await addDoc(collection(db, "mensajesPublicos"), { titulo: formPub.titulo, contenido: formPub.contenido, autor: correo, fecha: serverTimestamp() });
    setMsg({ tipo: "exito", txt: "Publicado." });
    setFormPub({ titulo: "", contenido: "" }); cargarPublicos();
  };

  const abrirMensaje = async (m) => {
    setVerMensaje(m);
    if (m.destinatario === correo && m.estado === "noleido") {
      await updateDoc(doc(db, "mensajes", m.id), { estado: "leido" });
      setMensajes(prev => prev.map(x => x.id === m.id ? { ...x, estado: "leido" } : x));
    }
  };

  const responder = async () => {
    if (!respuestaTexto.trim()) return;
    const respuesta = { texto: respuestaTexto, autor: correo, fecha: new Date().toISOString() };
    const nuevasResp = [...(verMensaje.respuestas || []), respuesta];
    await updateDoc(doc(db, "mensajes", verMensaje.id), { respuestas: nuevasResp, estado: "leido" });
    setVerMensaje(prev => ({ ...prev, respuestas: nuevasResp }));
    setRespuestaTexto(""); setMsg({ tipo: "exito", txt: "Respuesta enviada." });
  };

  const tabs = [
    { id: "recibidos", label: "📥 Recibidos" },
    { id: "enviados",  label: "📤 Enviados" },
    { id: "publica",   label: "📋 Bandeja Pública" },
    { id: "nueva",     label: "✍️ Nuevo mensaje" },
  ];

  return (
    <div>
      {msg && <Alerta tipo={msg.tipo} onClose={() => setMsg(null)}>{msg.txt}</Alerta>}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "8px 16px", borderRadius: 9, border: `1.5px solid ${tab === t.id ? C.azulC : C.borde}`,
            background: tab === t.id ? C.azulS : "#fff", color: tab === t.id ? C.azulC : C.suave,
            fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
          }}>{t.label}</button>
        ))}
      </div>

      {tab === "publica" && (
        <div>
          {(esAdmin || esMaestro) && (
            <Tarjeta style={{ marginBottom: 18 }}>
              <h4 style={{ margin: "0 0 14px", fontWeight: 800, color: C.texto }}>📣 Publicar en bandeja pública</h4>
              <Campo label="Título" value={formPub.titulo} onChange={e => setFormPub(p => ({ ...p, titulo: e.target.value }))} placeholder="Título" />
              <CampoArea label="Contenido" value={formPub.contenido} onChange={e => setFormPub(p => ({ ...p, contenido: e.target.value }))} placeholder="Contenido..." rows={3} />
              <Btn onClick={publicarMensaje}>📨 Publicar</Btn>
            </Tarjeta>
          )}
          {cargando ? <Spinner /> : publicados.length === 0
            ? <Tarjeta><div style={{ textAlign: "center", padding: 30, color: C.muy }}>Sin publicaciones</div></Tarjeta>
            : publicados.map(p => (
              <Tarjeta key={p.id} style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: C.texto, marginBottom: 4 }}>{p.titulo}</div>
                <div style={{ fontSize: 13, color: C.suave, marginBottom: 8 }}>{p.contenido}</div>
                <div style={{ fontSize: 11, color: C.muy }}>✍️ {p.autor} · {fmtFecha(p.fecha)}</div>
              </Tarjeta>
            ))
          }
        </div>
      )}

      {tab === "nueva" && (
        <Tarjeta>
          <h4 style={{ margin: "0 0 18px", fontWeight: 800, color: C.texto }}>✍️ Redactar mensaje privado</h4>
          <Campo label="Destinatario (correo)" value={form.destinatario} onChange={e => setForm(p => ({ ...p, destinatario: e.target.value }))} placeholder="correo@ceti.mx" />
          <CampoSelect label="Rol destino" value={form.rolDestino} onChange={e => setForm(p => ({ ...p, rolDestino: e.target.value }))}
            options={esEstudiante ? ["Maestro", "Administrador"] : ["Estudiante", "Maestro", "Administrador"]} />
          <Campo label="Asunto" value={form.asunto} onChange={e => setForm(p => ({ ...p, asunto: e.target.value }))} placeholder="Asunto del mensaje" />
          <CampoArea label="Mensaje *" value={form.mensaje} onChange={e => setForm(p => ({ ...p, mensaje: e.target.value }))} placeholder="Escribe tu mensaje aquí..." rows={5} />
          <Btn onClick={enviarPrivado}>📨 Enviar mensaje</Btn>
        </Tarjeta>
      )}

      {(tab === "recibidos" || tab === "enviados") && (
        cargando ? <Spinner /> : mensajes.length === 0
          ? <Tarjeta><div style={{ textAlign: "center", padding: 40, color: C.muy }}><div style={{ fontSize: 36 }}>💬</div><div style={{ marginTop: 8, fontWeight: 600 }}>No hay mensajes</div></div></Tarjeta>
          : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {mensajes.map(m => (
                <Tarjeta key={m.id} style={{ cursor: "pointer", borderLeft: `3px solid ${m.estado === "noleido" ? C.azulC : C.borde}` }} onClick={() => abrirMensaje(m)}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <span style={{ fontWeight: 800, fontSize: 13, color: C.texto }}>
                          {tab === "recibidos" ? `De: ${m.remitente}` : `Para: ${m.destinatario}`}
                        </span>
                        <EstadoBadge estado={m.estado} />
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.suave, marginBottom: 2 }}>{m.asunto || "(Sin asunto)"}</div>
                      <div style={{ fontSize: 12, color: C.muy, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.mensaje}</div>
                    </div>
                    <div style={{ fontSize: 11, color: C.muy, flexShrink: 0 }}>{fmtFecha(m.fecha)}</div>
                  </div>
                </Tarjeta>
              ))}
            </div>
          )
      )}

      {verMensaje && (
        <Modal titulo={`Mensaje: ${verMensaje.asunto || "(Sin asunto)"}`} onClose={() => { setVerMensaje(null); setRespuestaTexto(""); }} ancho={620}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10, fontSize: 13, color: C.suave }}>
              <span>📤 <strong>De:</strong> {verMensaje.remitente}</span>
              <span>📥 <strong>Para:</strong> {verMensaje.destinatario}</span>
              <span>🕐 {fmtFecha(verMensaje.fecha)}</span>
              <EstadoBadge estado={verMensaje.estado} />
            </div>
            <div style={{ background: C.fondo, padding: "14px 16px", borderRadius: 10, fontSize: 14, color: C.texto, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {verMensaje.mensaje}
            </div>
          </div>
          {(verMensaje.respuestas || []).length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 800, color: C.texto }}>💬 Respuestas</h4>
              {verMensaje.respuestas.map((r, i) => (
                <div key={i} style={{ background: r.autor === correo ? C.azulS : C.exitoS, borderRadius: 10, padding: "10px 14px", marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.suave, marginBottom: 4 }}>✍️ {r.autor}</div>
                  <div style={{ fontSize: 13, color: C.texto }}>{r.texto}</div>
                </div>
              ))}
            </div>
          )}
          {(esAdmin || esMaestro) && verMensaje.destinatario === correo && (
            <div>
              <CampoArea label="Responder" value={respuestaTexto} onChange={e => setRespuestaTexto(e.target.value)} placeholder="Escribe tu respuesta..." rows={3} />
              <Btn onClick={responder}>📨 Enviar respuesta</Btn>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ─── USUARIOS ────────────────────────────────────────────────
function Usuarios({ correo, rol, filtroInicial = "Todos" }) {
  const esAdmin   = rol === "Administrador";
  const esMaestro = rol === "Maestro";

  const [usuarios,  setUsuarios]  = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [busqueda,  setBusqueda]  = useState("");
  const [filtroRol, setFiltroRol] = useState(filtroInicial);
  const [modalForm, setModalForm] = useState(false);
  const [editando,  setEditando]  = useState(null);
  const [msg,       setMsg]       = useState(null);

  const vacioForm = {
    nombre: "", correo: "", password: "", rol: "Estudiante",
    registro: "", carrera: "", semestre: "", grupo: "",
    departamento: "", materia: "",
  };
  const [form, setForm] = useState(vacioForm);

  // Actualizar filtro si cambia desde dashboard
  useEffect(() => { setFiltroRol(filtroInicial); }, [filtroInicial]);

  // Tiempo real con onSnapshot
  useEffect(() => {
    const q = query(collection(db, "usuarios"), orderBy("fechaCreacion", "desc"));
    const unsub = onSnapshot(q, snap => {
      setUsuarios(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCargando(false);
    }, () => setCargando(false));
    return unsub;
  }, []);

  const filtrados = usuarios.filter(u => {
    const matchB = !busqueda || (u.nombre||"").toLowerCase().includes(busqueda.toLowerCase()) || (u.correo||"").toLowerCase().includes(busqueda.toLowerCase());
    const matchR = filtroRol === "Todos" || u.rol === filtroRol;
    return matchB && matchR;
  });

  const abrirNuevo  = () => { if (!esAdmin) return; setEditando(null); setForm(vacioForm); setMsg(null); setModalForm(true); };
  const abrirEditar = (u) => {
    if (!(esAdmin || (esMaestro && u.rol === "Estudiante"))) { setMsg({ tipo: "error", txt: "Sin permiso." }); return; }
    setEditando(u); setMsg(null);
    setForm({ nombre: u.nombre||"", correo: u.correo||"", password: "", rol: u.rol||"Estudiante", registro: u.registro||"", carrera: u.carrera||"", semestre: u.semestre||"", grupo: u.grupo||"", departamento: u.departamento||"", materia: u.materia||"" });
    setModalForm(true);
  };

  const guardar = async () => {
    if (!form.nombre || !form.correo || !form.rol) { setMsg({ tipo: "error", txt: "Nombre, correo y rol son requeridos." }); return; }
    if (!editando && !form.password)       { setMsg({ tipo: "error", txt: "La contraseña es requerida." }); return; }
    if (!editando && form.password.length < 6) { setMsg({ tipo: "error", txt: "Mínimo 6 caracteres." }); return; }

    try {
      if (editando) {
        const data = { ...form, fechaActualizacion: serverTimestamp() };
        delete data.password;
        await updateDoc(doc(db, "usuarios", editando.id), data);
        setMsg({ tipo: "exito", txt: "Usuario actualizado." });
        setModalForm(false);
      } else {
        const correoLimpio = form.correo.trim().toLowerCase();
        const cred = await createUserWithEmailAndPassword(authAux, correoLimpio, form.password);
        const nuevoUID = cred.user.uid;
        const data = {
          uid: nuevoUID, nombre: form.nombre.trim(), correo: correoLimpio, rol: form.rol,
          registro: form.registro||"", carrera: form.carrera||"",
          semestre: form.semestre||"", grupo: form.grupo||"",
          departamento: form.departamento||"", materia: form.materia||"",
          fechaCreacion: serverTimestamp(), fechaActualizacion: serverTimestamp(),
        };
        await setDoc(doc(db, "usuarios", nuevoUID), data);
        await signOut(authAux);
        setMsg({ tipo: "exito", txt: `✅ "${form.nombre}" creado. Ya puede iniciar sesión.` });
        setModalForm(false);
      }
    } catch (e) {
      const errores = {
        "auth/email-already-in-use": "Ese correo ya está registrado.",
        "auth/weak-password":        "Contraseña muy débil.",
        "auth/invalid-email":        "Formato de correo inválido.",
      };
      setMsg({ tipo: "error", txt: errores[e.code] || "Error: " + e.message });
    }
  };

  const eliminar = async (u) => {
    if (!esAdmin) { setMsg({ tipo: "error", txt: "Sin permiso." }); return; }
    if (!confirm(`¿Eliminar a ${u.nombre}?`)) return;
    await deleteDoc(doc(db, "usuarios", u.id));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: C.texto }}>Usuarios ({filtrados.length})</h2>
        {esAdmin && <Btn onClick={abrirNuevo}>➕ Nuevo usuario</Btn>}
      </div>
      {msg && <Alerta tipo={msg.tipo} onClose={() => setMsg(null)}>{msg.txt}</Alerta>}

      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <input
          placeholder="🔍 Buscar por nombre o correo..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: "9px 13px", borderRadius: 9, border: `1.5px solid ${C.borde}`, fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff" }}
        />
        {["Todos", "Administrador", "Maestro", "Estudiante"].map(r => (
          <button key={r} onClick={() => setFiltroRol(r)} style={{
            padding: "8px 14px", borderRadius: 9, border: `1.5px solid ${filtroRol === r ? C.azulC : C.borde}`,
            background: filtroRol === r ? C.azulS : "#fff", color: filtroRol === r ? C.azulC : C.suave,
            fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
          }}>{r}</button>
        ))}
      </div>

      {cargando ? <Spinner /> : filtrados.length === 0
        ? <Tarjeta><div style={{ textAlign: "center", padding: 40, color: C.muy }}>No se encontraron usuarios</div></Tarjeta>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtrados.map(u => {
              const [cc, bg] = colorRol(u.rol);
              return (
                <Tarjeta key={u.id} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <Avatar letras={iniciales(u.nombre)} color={cc} size={42} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: C.texto }}>{u.nombre}</span>
                      <Badge color={cc} bg={bg}>{u.rol}</Badge>
                    </div>
                    <div style={{ fontSize: 12, color: C.suave, marginBottom: 2 }}>✉️ {u.correo}</div>
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 11, color: C.muy }}>
                      {u.registro     && <span>🪪 {u.registro}</span>}
                      {u.carrera      && <span>🎓 {u.carrera}</span>}
                      {u.semestre     && <span>📚 Sem. {u.semestre}</span>}
                      {u.grupo        && <span>👥 Gpo. {u.grupo}</span>}
                      {u.departamento && <span>🏢 {u.departamento}</span>}
                      {u.materia      && <span>📖 {u.materia}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
                    {(esAdmin || (esMaestro && u.rol === "Estudiante")) && <Btn variante="secundario" onClick={() => abrirEditar(u)} style={{ padding: "7px 12px", fontSize: 12 }}>✏️ Editar</Btn>}
                    {esAdmin && <Btn variante="peligro" onClick={() => eliminar(u)} style={{ padding: "7px 12px", fontSize: 12 }}>🗑️</Btn>}
                  </div>
                </Tarjeta>
              );
            })}
          </div>
        )
      }

      {modalForm && (
        <Modal titulo={editando ? "Editar usuario" : "Nuevo usuario"} onClose={() => setModalForm(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <Campo label="Nombre completo *" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre y apellidos" />
            </div>
            <Campo label="Correo *" value={form.correo} onChange={e => setForm(p => ({ ...p, correo: e.target.value }))} placeholder="correo@ceti.mx" type="email" />
            {!editando && (
              <Campo label="Contraseña *" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Mínimo 6 caracteres" type="password" />
            )}
          </div>

          <CampoSelect label="Rol *" value={form.rol} onChange={e => setForm(p => ({ ...p, rol: e.target.value }))}
            options={esAdmin ? ["Estudiante", "Maestro", "Administrador"] : ["Estudiante"]}
            disabled={!esAdmin && !!editando && editando.rol !== "Estudiante"}
          />

          {form.rol === "Estudiante" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <Campo label="No. Registro"  value={form.registro}  onChange={e => setForm(p => ({ ...p, registro:  e.target.value }))} placeholder="Número de registro" />
              <Campo label="Carrera"       value={form.carrera}   onChange={e => setForm(p => ({ ...p, carrera:   e.target.value }))} placeholder="Ingeniería en..." />
              <Campo label="Semestre"      value={form.semestre}  onChange={e => setForm(p => ({ ...p, semestre:  e.target.value }))} placeholder="1–12" />
              <Campo label="Grupo"         value={form.grupo}     onChange={e => setForm(p => ({ ...p, grupo:     e.target.value }))} placeholder="A, B, C..." />
            </div>
          )}
          {form.rol === "Maestro" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <Campo label="No. Empleado"  value={form.registro}     onChange={e => setForm(p => ({ ...p, registro:     e.target.value }))} placeholder="Número de empleado" />
              <Campo label="División"      value={form.departamento} onChange={e => setForm(p => ({ ...p, departamento: e.target.value }))} placeholder="División académica" />
              <div style={{ gridColumn: "1 / -1" }}>
                <Campo label="Materia que imparte" value={form.materia} onChange={e => setForm(p => ({ ...p, materia: e.target.value }))} placeholder="Nombre de la materia" />
              </div>
            </div>
          )}
          {form.rol === "Administrador" && (
            <Campo label="Departamento" value={form.departamento} onChange={e => setForm(p => ({ ...p, departamento: e.target.value }))} placeholder="Depto. de Sistemas, Dirección..." />
          )}

          {msg && <Alerta tipo={msg.tipo}>{msg.txt}</Alerta>}
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <Btn onClick={guardar}>{editando ? "💾 Actualizar" : "✅ Crear usuario"}</Btn>
            <Btn variante="secundario" onClick={() => setModalForm(false)}>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── INFORMES ────────────────────────────────────────────────
function Informes({ correo, rol }) {
  const esAdmin   = rol === "Administrador";
  const esMaestro = rol === "Maestro";

  const [informes,  setInformes]  = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [modalForm, setModalForm] = useState(false);
  const [editando,  setEditando]  = useState(null);
  const [msg,       setMsg]       = useState(null);
  const [subiendo,  setSubiendo]  = useState(false);
  const [progreso,  setProgreso]  = useState(0);
  const fileRef = useRef();

  const vacioForm = { titulo: "", descripcion: "", archivo: null, archivoNombre: "", archivoURL: "", archivoRuta: "" };
  const [form, setForm] = useState(vacioForm);

  // Tiempo real con onSnapshot
  useEffect(() => {
    const q = query(collection(db, "informes"), orderBy("fecha", "desc"));
    const unsub = onSnapshot(q, snap => {
      setInformes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCargando(false);
    }, () => setCargando(false));
    return unsub;
  }, []);

  const abrirNuevo  = () => { setEditando(null); setForm(vacioForm); setMsg(null); setModalForm(true); };
  const abrirEditar = (inf) => {
    setEditando(inf); setMsg(null);
    setForm({ titulo: inf.titulo, descripcion: inf.descripcion||"", archivo: null, archivoNombre: inf.archivoNombre||"", archivoURL: inf.archivoURL||"", archivoRuta: inf.archivoRuta||"" });
    setModalForm(true);
  };

  const subirArchivo = () => new Promise((resolve, reject) => {
    if (!form.archivo) { resolve(null); return; }
    const nombreSeguro = form.archivo.name.replace(/\s+/g, "_");
    const ruta = `informes/${Date.now()}_${nombreSeguro}`;
    const storageRef = ref(storage, ruta);
    const metadata = { contentType: form.archivo.type };
    const task = uploadBytesResumable(storageRef, form.archivo, metadata);
    task.on("state_changed",
      (snapshot) => {
        if (snapshot.totalBytes > 0) setProgreso(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
      },
      (error) => { console.error("Storage error:", error.code, error.message); reject(error); },
      async () => {
        try { const url = await getDownloadURL(task.snapshot.ref); resolve({ url, nombre: form.archivo.name, ruta }); }
        catch (e) { reject(e); }
      }
    );
  });

  const guardar = async () => {
    if (!form.titulo.trim()) { setMsg({ tipo: "error", txt: "El título es requerido." }); return; }
    setSubiendo(true); setProgreso(0); setMsg(null);
    try {
      let archivoData = { archivoURL: form.archivoURL||"", archivoNombre: form.archivoNombre||"", archivoRuta: form.archivoRuta||"" };
      if (form.archivo) {
        setMsg({ tipo: "info", txt: "Subiendo archivo, espera..." });
        const res = await subirArchivo();
        if (res) { archivoData = { archivoURL: res.url, archivoNombre: res.nombre, archivoRuta: res.ruta }; setMsg(null); }
      }
      const data = { titulo: form.titulo.trim(), descripcion: form.descripcion||"", ...archivoData, autor: correo, autorCorreo: correo, fechaActualizacion: serverTimestamp() };
      if (editando) {
        await updateDoc(doc(db, "informes", editando.id), data);
        setMsg({ tipo: "exito", txt: "Informe actualizado." });
      } else {
        await addDoc(collection(db, "informes"), { ...data, fecha: serverTimestamp() });
        setMsg({ tipo: "exito", txt: "Informe publicado." });
      }
      setModalForm(false);
    } catch (e) {
      console.error("Error guardar informe:", e);
      setMsg({ tipo: "error", txt: "Error: " + (e.message || e.code || "desconocido") });
    } finally { setSubiendo(false); }
  };

  const eliminar = async (inf) => {
    if (!(esAdmin || (esMaestro && inf.autorCorreo === correo))) { setMsg({ tipo: "error", txt: "Sin permiso." }); return; }
    if (!confirm(`¿Eliminar informe "${inf.titulo}"?`)) return;
    if (inf.archivoRuta) { try { await deleteObject(ref(storage, inf.archivoRuta)); } catch {} }
    await deleteDoc(doc(db, "informes", inf.id));
  };

  const iconoArchivo = (nombre = "") => {
    const ext = (nombre.split(".").pop() || "").toLowerCase();
    if (ext === "pdf") return "📄";
    if (["doc","docx"].includes(ext)) return "📝";
    if (["xls","xlsx"].includes(ext)) return "📊";
    if (["ppt","pptx"].includes(ext)) return "📋";
    if (["jpg","jpeg","png","gif"].includes(ext)) return "🖼️";
    return "📎";
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: C.texto }}>Informes ({informes.length})</h2>
        {(esAdmin || esMaestro) && <Btn onClick={abrirNuevo}>📤 Subir informe</Btn>}
      </div>
      {msg && <Alerta tipo={msg.tipo} onClose={() => setMsg(null)}>{msg.txt}</Alerta>}

      {cargando ? <Spinner /> : informes.length === 0
        ? <Tarjeta><div style={{ textAlign: "center", padding: 40, color: C.muy }}><div style={{ fontSize: 40 }}>📊</div><div style={{ marginTop: 8, fontWeight: 600 }}>No hay informes</div></div></Tarjeta>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {informes.map(inf => {
              const puedeE = esAdmin || (esMaestro && inf.autorCorreo === correo);
              return (
                <Tarjeta key={inf.id} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: C.advS, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                    {iconoArchivo(inf.archivoNombre)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: C.texto, marginBottom: 4 }}>{inf.titulo}</div>
                    {inf.descripcion && <div style={{ fontSize: 13, color: C.suave, marginBottom: 6 }}>{inf.descripcion}</div>}
                    {/* Vista previa inline de imagen */}
                    {inf.archivoURL && inf.archivoNombre && ["jpg","jpeg","png","gif"].some(e => inf.archivoNombre.toLowerCase().endsWith(e)) && (
                      <img src={inf.archivoURL} alt={inf.archivoNombre} style={{ maxWidth: 160, maxHeight: 100, borderRadius: 8, marginBottom: 6, objectFit: "cover" }} />
                    )}
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 11, color: C.muy }}>
                      <span>✍️ {inf.autor}</span>
                      <span>📅 {fmtFecha(inf.fecha)}</span>
                      {inf.archivoNombre && <span>📎 {inf.archivoNombre}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 7, flexShrink: 0, flexWrap: "wrap" }}>
                    {inf.archivoURL && (
                      <a href={inf.archivoURL} target="_blank" rel="noreferrer">
                        <Btn variante="exito" style={{ padding: "7px 12px", fontSize: 12 }}>⬇️ Descargar</Btn>
                      </a>
                    )}
                    {puedeE && <Btn variante="secundario" onClick={() => abrirEditar(inf)} style={{ padding: "7px 12px", fontSize: 12 }}>✏️</Btn>}
                    {puedeE && <Btn variante="peligro"    onClick={() => eliminar(inf)}    style={{ padding: "7px 12px", fontSize: 12 }}>🗑️</Btn>}
                  </div>
                </Tarjeta>
              );
            })}
          </div>
        )
      }

      {modalForm && (
        <Modal titulo={editando ? "Editar informe" : "Subir informe"} onClose={() => setModalForm(false)}>
          <Campo label="Título *" value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} placeholder="Título del informe" />
          <CampoArea label="Descripción" value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} placeholder="Descripción opcional..." rows={3} />

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.suave, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Archivo (PDF, DOCX, XLSX, PPTX, JPG, PNG)
            </label>
            <div
              onClick={() => !subiendo && fileRef.current?.click()}
              style={{
                border: `2px dashed ${form.archivo ? C.exito : C.borde}`, borderRadius: 10, padding: "20px",
                textAlign: "center", cursor: subiendo ? "default" : "pointer",
                background: form.archivo ? C.exitoS : C.fondo,
                color: form.archivo ? C.exito : C.suave, fontSize: 13, fontWeight: 600,
                transition: "all 0.2s",
              }}
            >
              {form.archivo
                ? `✅ ${form.archivo.name} (${(form.archivo.size/1024/1024).toFixed(2)} MB)`
                : form.archivoNombre ? `📎 ${form.archivoNombre} (clic para cambiar)` : "📂 Clic para seleccionar archivo"}
            </div>
            <input
              ref={fileRef} type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
              style={{ display: "none" }}
              onChange={e => e.target.files[0] && setForm(p => ({ ...p, archivo: e.target.files[0] }))}
            />
          </div>

          {/* Vista previa */}
          {form.archivo && (() => {
            const ext = form.archivo.name.split(".").pop().toLowerCase();
            if (["jpg","jpeg","png","gif","webp"].includes(ext)) {
              return (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: C.suave, marginBottom: 6, fontWeight: 600 }}>VISTA PREVIA</div>
                  <img src={URL.createObjectURL(form.archivo)} alt="preview"
                    style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 10, objectFit: "contain", border: `1px solid ${C.borde}` }} />
                </div>
              );
            }
            if (ext === "pdf") {
              return (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: C.suave, marginBottom: 6, fontWeight: 600 }}>VISTA PREVIA PDF</div>
                  <iframe src={URL.createObjectURL(form.archivo)} title="preview-pdf"
                    style={{ width: "100%", height: 200, borderRadius: 10, border: `1px solid ${C.borde}` }} />
                </div>
              );
            }
            return null;
          })()}

          {subiendo && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: C.suave, fontWeight: 600 }}>Subiendo archivo...</span>
                <span style={{ fontSize: 12, color: C.azulC, fontWeight: 700 }}>{progreso}%</span>
              </div>
              <div style={{ background: C.borde, borderRadius: 4, height: 8 }}>
                <div style={{ background: `linear-gradient(90deg, ${C.azulC}, ${C.naranja})`, height: 8, borderRadius: 4, width: `${progreso}%`, transition: "width 0.3s" }} />
              </div>
            </div>
          )}

          {msg && <Alerta tipo={msg.tipo}>{msg.txt}</Alerta>}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Btn onClick={guardar} disabled={subiendo}>{subiendo ? `Subiendo... ${progreso}%` : editando ? "💾 Actualizar" : "📤 Subir informe"}</Btn>
            <Btn variante="secundario" onClick={() => setModalForm(false)} disabled={subiendo}>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────
export default function App() {
  const [usuario,  setUsuario]  = useState(null);
  const [rol,      setRol]      = useState("Estudiante");
  const [pantalla, setPantalla] = useState("inicio");
  const [cargando, setCargando] = useState(true);
  const [filtroUsuarios, setFiltroUsuarios] = useState("Todos");

  const [stats, setStats] = useState({
    totalUsuarios: 0, totalEstudiantes: 0, totalMaestros: 0, totalAdmins: 0,
    totalAvisos: 0, totalMensajes: 0, totalInformes: 0,
  });
  const [actividad, setActividad] = useState({ usuarios: [], avisos: [], informes: [] });

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUsuario(user);
        try {
          const snapUID = await getDoc(doc(db, "usuarios", user.uid));
          if (snapUID.exists()) {
            setRol(snapUID.data().rol || "Estudiante");
          } else {
            const snapCorreo = await getDocs(
              query(collection(db, "usuarios"), where("correo", "==", (user.email||"").toLowerCase().trim()))
            );
            setRol(!snapCorreo.empty ? (snapCorreo.docs[0].data().rol || "Estudiante") : "Estudiante");
          }
        } catch (err) {
          console.error("Error al leer rol:", err.code, err.message);
          setRol("Estudiante");
        }
      } else {
        setUsuario(null); setRol("Estudiante");
      }
      setCargando(false);
    });
    return unsub;
  }, []);

  // Stats en tiempo real con onSnapshot
  useEffect(() => {
    if (!usuario) return;
    const unsubU = onSnapshot(collection(db, "usuarios"), snap => {
      const docs = snap.docs.map(d => d.data());
      setStats(prev => ({
        ...prev,
        totalUsuarios:    docs.length,
        totalEstudiantes: docs.filter(u => u.rol === "Estudiante").length,
        totalMaestros:    docs.filter(u => u.rol === "Maestro").length,
        totalAdmins:      docs.filter(u => u.rol === "Administrador").length,
      }));
      const ultU = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a,b) => (b.fechaCreacion?.seconds||0) - (a.fechaCreacion?.seconds||0)).slice(0, 3);
      setActividad(prev => ({ ...prev, usuarios: ultU }));
    });
    const unsubA = onSnapshot(collection(db, "avisos"), snap => {
      setStats(prev => ({ ...prev, totalAvisos: snap.size }));
      const ultA = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a,b) => (b.fechaCreacion?.seconds||0) - (a.fechaCreacion?.seconds||0)).slice(0, 3);
      setActividad(prev => ({ ...prev, avisos: ultA }));
    });
    const unsubM = onSnapshot(collection(db, "mensajes"), snap => {
      setStats(prev => ({ ...prev, totalMensajes: snap.size }));
    });
    const unsubI = onSnapshot(collection(db, "informes"), snap => {
      setStats(prev => ({ ...prev, totalInformes: snap.size }));
      const ultI = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a,b) => (b.fecha?.seconds||0) - (a.fecha?.seconds||0)).slice(0, 3);
      setActividad(prev => ({ ...prev, informes: ultI }));
    });
    return () => { unsubU(); unsubA(); unsubM(); unsubI(); };
  }, [usuario]);

  const cerrarSesion = async () => {
    await signOut(auth);
    setUsuario(null); setRol("Estudiante"); setPantalla("inicio");
  };

  if (cargando) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.fondo }}>
        <div style={{ textAlign: "center" }}>
          <Logo size="lg" />
          <Spinner />
          <div style={{ color: C.suave, fontSize: 13, marginTop: 8 }}>Verificando sesión...</div>
        </div>
      </div>
    );
  }

  if (!usuario) return <Login />;

  const contenido = () => {
    switch (pantalla) {
      case "inicio":
        return (
          <Dashboard
            correo={usuario.email} rol={rol}
            stats={stats} actividad={actividad}
            setPantalla={setPantalla}
            setFiltroUsuarios={setFiltroUsuarios}
          />
        );
      case "avisos":   return <Avisos correo={usuario.email} rol={rol} />;
      case "mensajes": return <Mensajes correo={usuario.email} rol={rol} />;
      case "usuarios":
        return (rol === "Administrador" || rol === "Maestro")
          ? <Usuarios correo={usuario.email} rol={rol} filtroInicial={filtroUsuarios} />
          : <Tarjeta><div style={{ padding: 40, textAlign: "center", color: C.muy }}>Sin acceso a este módulo.</div></Tarjeta>;
      case "informes": return <Informes correo={usuario.email} rol={rol} />;
      default: return null;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.fondo, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.borde}; border-radius: 4px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <Sidebar pantalla={pantalla} setPantalla={setPantalla} correo={usuario.email} rol={rol} onCerrar={cerrarSesion} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <TopBar pantalla={pantalla} rol={rol} />
        <main style={{ flex: 1, padding: "24px 28px", overflowY: "auto" }}>
          {contenido()}
        </main>
      </div>
    </div>
  );
}
