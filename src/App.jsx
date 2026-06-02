// ============================================================
// PORTAL CETI — App.jsx completo
// React + Firebase Auth + Firestore + Storage
// Roles: Administrador | Maestro | Estudiante
// ============================================================

import { useState, useEffect, useRef } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db, storage } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
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

// ─── HELPERS ─────────────────────────────────────────────────
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

// ─── COMPONENTES BASE ─────────────────────────────────────────

function Logo({ size = "md" }) {
  const s = size === "lg" ? { w: 64, font: 22 } : size === "sm" ? { w: 28, font: 11 } : { w: 42, font: 15 };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {/* Logo SVG que emula el logo CETI oficial con figura humana y flechas */}
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
        <div style={{ fontWeight: 900, fontSize: s.font, color: size === "lg" ? C.azul : "#fff", letterSpacing: -0.5, lineHeight: 1 }}>
          ceti
        </div>
        <div style={{ fontSize: s.font * 0.6, fontWeight: 700, color: size === "lg" ? C.naranja : C.naranjaM, letterSpacing: 1, textTransform: "uppercase" }}>
          Colomos
        </div>
      </div>
    </div>
  );
}

function Campo({ label, value, onChange, placeholder, type = "text", disabled = false }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.suave, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>}
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        disabled={disabled}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          width: "100%", padding: "10px 13px", borderRadius: 9,
          border: `1.5px solid ${focus ? C.azulC : C.borde}`,
          fontSize: 14, outline: "none",
          background: disabled ? C.fondo : "#fff",
          color: C.texto, boxSizing: "border-box",
          transition: "border-color 0.2s", fontFamily: "inherit",
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
        rows={rows} value={value} onChange={onChange} placeholder={placeholder}
        disabled={disabled}
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
        ...estilos[variante] || estilos.primario,
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

function Tarjeta({ children, style = {} }) {
  return (
    <div style={{
      background: C.card, borderRadius: 14, border: `1px solid ${C.borde}`,
      padding: "20px 22px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", ...style,
    }}>
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
    exito:   { bg: C.exitoS,   color: C.exito,   icon: "✅" },
    error:   { bg: C.peligroS, color: C.peligro, icon: "❌" },
    info:    { bg: C.azulS,    color: C.azulC,   icon: "ℹ️" },
    adv:     { bg: C.advS,     color: C.adv,     icon: "⚠️" },
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
  const esAdmin  = rol === "Administrador";
  const esMaestro = rol === "Maestro";

  const items = [
    { id: "inicio",    icono: "🏠", label: "Inicio",    todos: true },
    { id: "avisos",    icono: "📢", label: "Avisos",    todos: true },
    { id: "mensajes",  icono: "💬", label: "Mensajes",  todos: true },
    { id: "usuarios",  icono: "👥", label: "Usuarios",  soloAdmin: false, oculto: false },
    { id: "informes",  icono: "📊", label: "Informes",  todos: true },
  ];

  const visibles = items.filter(i => {
    if (i.id === "usuarios" && rol === "Estudiante") return false;
    return true;
  });

  const [colapsar, setColapsar] = useState(false);

  return (
    <div style={{
      width: colapsar ? 64 : 220, minHeight: "100vh",
      background: `linear-gradient(180deg, ${C.azul} 0%, #0a1f40 100%)`,
      display: "flex", flexDirection: "column", flexShrink: 0,
      position: "sticky", top: 0, height: "100vh",
      transition: "width 0.2s", overflow: "hidden",
    }}>
      {/* Logo */}
      <div style={{
        padding: "18px 14px", borderBottom: "1px solid rgba(255,255,255,0.1)",
        display: "flex", alignItems: "center", justifyContent: colapsar ? "center" : "space-between",
        gap: 8,
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

      {/* Usuario */}
      {!colapsar && (
        <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Avatar letras={iniciales(correo)} color={C.naranja} size={34} />
            <div style={{ minWidth: 0 }}>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 11.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{correo}</div>
              <div style={{ marginTop: 2 }}>
                <Badge color={colorRol(rol)[0]} bg="rgba(255,255,255,0.15)"
                  style={{ fontSize: 10 }}
                >{rol}</Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
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

      {/* Cerrar sesión */}
      <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <button
          onClick={onCerrar}
          title="Cerrar sesión"
          style={{
            width: "100%", padding: colapsar ? "10px 0" : "10px 0",
            borderRadius: 10, border: "none",
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
    inicio:   "🏠 Inicio",
    avisos:   "📢 Avisos Institucionales",
    mensajes: "💬 Mensajes",
    usuarios: "👥 Usuarios",
    informes: "📊 Informes",
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

// ─── PANTALLA: LOGIN ──────────────────────────────────────────
function Login({ onLogin }) {
  const [correo, setCorreo]     = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState("");

  const handleLogin = async () => {
    if (!correo || !contrasena) { setError("Ingresa correo y contraseña."); return; }
    setCargando(true); setError("");
    try {
      const cred = await signInWithEmailAndPassword(auth, correo, contrasena);
      // El rol se carga en App después del login
      onLogin(cred.user);
    } catch (e) {
      setError("Correo o contraseña incorrectos.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: `linear-gradient(135deg, ${C.azul} 0%, #0a1f40 50%, ${C.azulM} 100%)`,
      padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.97)", borderRadius: 22,
          padding: "40px 38px", boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
        }}>
          {/* Logo */}
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

// ─── PANTALLA: DASHBOARD ──────────────────────────────────────
function Dashboard({ correo, rol, stats, actividad }) {
  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";

  const tarjetas = [
    { icono: "👥", val: stats.totalUsuarios,      label: "Usuarios",      color: C.azulC,   bg: C.azulS },
    { icono: "🎓", val: stats.totalEstudiantes,   label: "Estudiantes",   color: C.exito,   bg: C.exitoS },
    { icono: "🧑‍🏫", val: stats.totalMaestros,     label: "Maestros",      color: C.purpura, bg: C.purpuraS },
    { icono: "⚙️", val: stats.totalAdmins,        label: "Administradores",color: C.peligro, bg: C.peligroS },
    { icono: "📢", val: stats.totalAvisos,        label: "Avisos",        color: C.naranja, bg: C.naranjaS },
    { icono: "💬", val: stats.totalMensajes,      label: "Mensajes",      color: C.azulM,   bg: C.azulS },
    { icono: "📊", val: stats.totalInformes,      label: "Informes",      color: C.adv,     bg: C.advS },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: C.texto, margin: "0 0 4px" }}>
          {saludo} 👋
        </h1>
        <p style={{ color: C.suave, fontSize: 14, margin: 0 }}>
          Sesión iniciada como <strong>{correo}</strong> · Rol: <strong>{rol}</strong>
        </p>
      </div>

      {/* Estadísticas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 12, marginBottom: 24 }}>
        {tarjetas.map((s, i) => (
          <Tarjeta key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px" }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
              {s.icono}
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, color: C.texto, lineHeight: 1 }}>{s.val ?? "—"}</div>
              <div style={{ fontSize: 11, color: C.suave, marginTop: 2 }}>{s.label}</div>
            </div>
          </Tarjeta>
        ))}
      </div>

      {/* Actividad reciente */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <Tarjeta>
          <h4 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 800, color: C.texto }}>👥 Últimos usuarios</h4>
          {actividad.usuarios.length === 0 && <div style={{ color: C.muy, fontSize: 13 }}>Sin datos</div>}
          {actividad.usuarios.map((u, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
              <Avatar letras={iniciales(u.nombre || u.correo)} color={C.azulC} size={30} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.texto }}>{u.nombre || u.correo}</div>
                <div style={{ fontSize: 11, color: C.muy }}>{fmtFecha(u.fechaCreacion)}</div>
              </div>
            </div>
          ))}
        </Tarjeta>

        <Tarjeta>
          <h4 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 800, color: C.texto }}>📢 Últimos avisos</h4>
          {actividad.avisos.length === 0 && <div style={{ color: C.muy, fontSize: 13 }}>Sin datos</div>}
          {actividad.avisos.map((a, i) => (
            <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: i < actividad.avisos.length - 1 ? `1px solid ${C.borde}` : "none" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.texto, marginBottom: 2 }}>{a.titulo}</div>
              <div style={{ fontSize: 11, color: C.muy }}>{fmtFecha(a.fechaCreacion)}</div>
            </div>
          ))}
        </Tarjeta>

        <Tarjeta>
          <h4 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 800, color: C.texto }}>💬 Últimos mensajes</h4>
          {actividad.mensajes.length === 0 && <div style={{ color: C.muy, fontSize: 13 }}>Sin datos</div>}
          {actividad.mensajes.map((m, i) => (
            <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: i < actividad.mensajes.length - 1 ? `1px solid ${C.borde}` : "none" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.texto, marginBottom: 2 }}>{m.remitente || m.autor || "—"}</div>
              <div style={{ fontSize: 11, color: C.suave, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.mensaje || m.asunto}</div>
              <div style={{ fontSize: 11, color: C.muy }}>{fmtFecha(m.fecha || m.fechaCreacion)}</div>
            </div>
          ))}
        </Tarjeta>
      </div>
    </div>
  );
}

// ─── PANTALLA: AVISOS ─────────────────────────────────────────
function Avisos({ correo, rol }) {
  const esAdmin   = rol === "Administrador";
  const esMaestro = rol === "Maestro";
  const puede     = esAdmin || esMaestro;

  const [avisos,    setAvisos]    = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [modalForm, setModalForm] = useState(false);
  const [editando,  setEditando]  = useState(null); // objeto aviso o null
  const [msg,       setMsg]       = useState(null);

  const vacioForm = { titulo: "", contenido: "", tipo: "General" };
  const [form, setForm] = useState(vacioForm);

  const cargar = async () => {
    setCargando(true);
    const snap = await getDocs(query(collection(db, "avisos"), orderBy("fechaCreacion", "desc")));
    setAvisos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const abrirNuevo = () => { setEditando(null); setForm(vacioForm); setModalForm(true); };
  const abrirEditar = (a) => {
    setEditando(a);
    setForm({ titulo: a.titulo, contenido: a.contenido, tipo: a.tipo || "General" });
    setModalForm(true);
  };

  const guardar = async () => {
    if (!form.titulo.trim() || !form.contenido.trim()) { setMsg({ tipo: "error", txt: "Título y contenido son requeridos." }); return; }
    try {
      if (editando) {
        await updateDoc(doc(db, "avisos", editando.id), {
          titulo: form.titulo, contenido: form.contenido, tipo: form.tipo,
          fechaActualizacion: serverTimestamp(),
        });
        setMsg({ tipo: "exito", txt: "Aviso actualizado." });
      } else {
        await addDoc(collection(db, "avisos"), {
          titulo: form.titulo, contenido: form.contenido, tipo: form.tipo,
          autor: correo, correoAutor: correo,
          fechaCreacion: serverTimestamp(),
          fechaActualizacion: serverTimestamp(),
        });
        setMsg({ tipo: "exito", txt: "Aviso publicado." });
      }
      setModalForm(false);
      cargar();
    } catch (e) { setMsg({ tipo: "error", txt: "Error al guardar: " + e.message }); }
  };

  const eliminar = async (aviso) => {
    const puedeEliminar = esAdmin || (esMaestro && aviso.correoAutor === correo);
    if (!puedeEliminar) { setMsg({ tipo: "error", txt: "Sin permiso para eliminar este aviso." }); return; }
    if (!confirm(`¿Eliminar aviso "${aviso.titulo}"?`)) return;
    await deleteDoc(doc(db, "avisos", aviso.id));
    cargar();
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
        <Tarjeta><div style={{ textAlign: "center", padding: 40, color: C.muy }}><div style={{ fontSize: 40 }}>📭</div><div style={{ fontWeight: 600, marginTop: 8 }}>No hay avisos publicados</div></div></Tarjeta>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {avisos.map(a => {
            const [cc, bg] = colorTipo[a.tipo] || colorTipo.General;
            const puedeEditar    = esAdmin || (esMaestro && a.correoAutor === correo);
            const puedeEliminar2 = esAdmin || (esMaestro && a.correoAutor === correo);
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
                    {a.fechaActualizacion && <span>🔄 {fmtFecha(a.fechaActualizacion)}</span>}
                  </div>
                </div>
                {(puedeEditar || puedeEliminar2) && (
                  <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
                    {puedeEditar    && <Btn variante="secundario" onClick={() => abrirEditar(a)} style={{ padding: "7px 12px", fontSize: 12 }}>✏️</Btn>}
                    {puedeEliminar2 && <Btn variante="peligro"    onClick={() => eliminar(a)}    style={{ padding: "7px 12px", fontSize: 12 }}>🗑️</Btn>}
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

// ─── PANTALLA: MENSAJES ───────────────────────────────────────
function Mensajes({ correo, rol }) {
  const esAdmin   = rol === "Administrador";
  const esMaestro = rol === "Maestro";
  const esEstudiante = rol === "Estudiante";

  const [tab,         setTab]         = useState("recibidos"); // recibidos | enviados | publica | nueva
  const [mensajes,    setMensajes]    = useState([]);
  const [publicados,  setPublicados]  = useState([]);
  const [cargando,    setCargando]    = useState(true);
  const [verMensaje,  setVerMensaje]  = useState(null);
  const [msg,         setMsg]         = useState(null);

  const vacioForm = { destinatario: "", rolDestino: "Administrador", asunto: "", mensaje: "" };
  const [form, setForm] = useState(vacioForm);
  const [formPub, setFormPub] = useState({ titulo: "", contenido: "" });
  const [respuestaTexto, setRespuestaTexto] = useState("");

  const cargarPrivados = async () => {
    setCargando(true);
    if (tab === "recibidos") {
      const snap = await getDocs(query(collection(db, "mensajes"), where("destinatario", "==", correo), orderBy("fecha", "desc")));
      setMensajes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } else if (tab === "enviados") {
      const snap = await getDocs(query(collection(db, "mensajes"), where("remitente", "==", correo), orderBy("fecha", "desc")));
      setMensajes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
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
      setForm(vacioForm);
      setTab("enviados");
    } catch (e) { setMsg({ tipo: "error", txt: e.message }); }
  };

  const publicarMensaje = async () => {
    if (!formPub.titulo || !formPub.contenido) { setMsg({ tipo: "error", txt: "Completa título y contenido." }); return; }
    await addDoc(collection(db, "mensajesPublicos"), {
      titulo: formPub.titulo, contenido: formPub.contenido,
      autor: correo, fecha: serverTimestamp(),
    });
    setMsg({ tipo: "exito", txt: "Publicado." });
    setFormPub({ titulo: "", contenido: "" });
    cargarPublicos();
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
    setRespuestaTexto("");
    setMsg({ tipo: "exito", txt: "Respuesta enviada." });
  };

  const tabs = [
    { id: "recibidos", label: "📥 Recibidos" },
    { id: "enviados",  label: "📤 Enviados" },
    { id: "publica",   label: "📋 Bandeja Pública" },
    { id: "nueva",     label: "✍️ Nuevo mensaje" },
  ];

  return (
    <div>
      {msg && <Alerta tipo={msg.tipo} onClose={() => setMsg(null)} style={{ marginBottom: 14 }}>{msg.txt}</Alerta>}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "8px 16px", borderRadius: 9, border: `1.5px solid ${tab === t.id ? C.azulC : C.borde}`,
            background: tab === t.id ? C.azulS : "#fff",
            color: tab === t.id ? C.azulC : C.suave,
            fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Bandeja pública */}
      {tab === "publica" && (
        <div>
          {(esAdmin || esMaestro) && (
            <Tarjeta style={{ marginBottom: 18 }}>
              <h4 style={{ margin: "0 0 14px", fontWeight: 800, color: C.texto }}>📣 Publicar en bandeja pública</h4>
              <Campo label="Título" value={formPub.titulo} onChange={e => setFormPub(p => ({ ...p, titulo: e.target.value }))} placeholder="Título del anuncio" />
              <CampoArea label="Contenido" value={formPub.contenido} onChange={e => setFormPub(p => ({ ...p, contenido: e.target.value }))} placeholder="Contenido..." rows={3} />
              <Btn onClick={publicarMensaje}>📨 Publicar</Btn>
            </Tarjeta>
          )}
          {cargando ? <Spinner /> : publicados.map(p => (
            <Tarjeta key={p.id} style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: C.texto, marginBottom: 4 }}>{p.titulo}</div>
              <div style={{ fontSize: 13, color: C.suave, marginBottom: 8 }}>{p.contenido}</div>
              <div style={{ fontSize: 11, color: C.muy }}>✍️ {p.autor} · {fmtFecha(p.fecha)}</div>
            </Tarjeta>
          ))}
          {!cargando && publicados.length === 0 && <Tarjeta><div style={{ textAlign: "center", padding: 30, color: C.muy }}>Sin publicaciones</div></Tarjeta>}
        </div>
      )}

      {/* Nueva mensaje privado */}
      {tab === "nueva" && (
        <Tarjeta>
          <h4 style={{ margin: "0 0 18px", fontWeight: 800, color: C.texto }}>✍️ Redactar mensaje privado</h4>
          <Campo label="Destinatario (correo)" value={form.destinatario} onChange={e => setForm(p => ({ ...p, destinatario: e.target.value }))} placeholder="correo@ceti.mx" />
          <CampoSelect label="Rol destino" value={form.rolDestino} onChange={e => setForm(p => ({ ...p, rolDestino: e.target.value }))} options={esEstudiante ? ["Maestro", "Administrador"] : ["Estudiante", "Maestro", "Administrador"]} />
          <Campo label="Asunto" value={form.asunto} onChange={e => setForm(p => ({ ...p, asunto: e.target.value }))} placeholder="Asunto del mensaje" />
          <CampoArea label="Mensaje *" value={form.mensaje} onChange={e => setForm(p => ({ ...p, mensaje: e.target.value }))} placeholder="Escribe tu mensaje aquí..." rows={5} />
          <Btn onClick={enviarPrivado}>📨 Enviar mensaje</Btn>
        </Tarjeta>
      )}

      {/* Recibidos / Enviados */}
      {(tab === "recibidos" || tab === "enviados") && (
        cargando ? <Spinner /> : mensajes.length === 0 ? (
          <Tarjeta><div style={{ textAlign: "center", padding: 40, color: C.muy }}><div style={{ fontSize: 36 }}>💬</div><div style={{ marginTop: 8, fontWeight: 600 }}>No hay mensajes</div></div></Tarjeta>
        ) : (
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

      {/* Modal ver mensaje */}
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

          {/* Respuestas */}
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

          {/* Responder (admin y maestro) */}
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

// ─── PANTALLA: USUARIOS ───────────────────────────────────────
function Usuarios({ correo, rol }) {
  const esAdmin   = rol === "Administrador";
  const esMaestro = rol === "Maestro";

  const [usuarios,   setUsuarios]   = useState([]);
  const [cargando,   setCargando]   = useState(true);
  const [busqueda,   setBusqueda]   = useState("");
  const [filtroRol,  setFiltroRol]  = useState("Todos");
  const [modalForm,  setModalForm]  = useState(false);
  const [editando,   setEditando]   = useState(null);
  const [msg,        setMsg]        = useState(null);

  const vacioForm = {
    nombre: "", correo: "", rol: "Estudiante",
    registro: "", carrera: "", semestre: "", grupo: "",
    departamento: "", materia: "",
  };
  const [form, setForm] = useState(vacioForm);

  const cargar = async () => {
    setCargando(true);
    const snap = await getDocs(query(collection(db, "usuarios"), orderBy("fechaCreacion", "desc")));
    setUsuarios(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = usuarios.filter(u => {
    const matchBusq = !busqueda || (u.nombre || "").toLowerCase().includes(busqueda.toLowerCase()) || (u.correo || "").toLowerCase().includes(busqueda.toLowerCase());
    const matchRol  = filtroRol === "Todos" || u.rol === filtroRol;
    return matchBusq && matchRol;
  });

  const abrirNuevo = () => { if (!esAdmin) return; setEditando(null); setForm(vacioForm); setModalForm(true); };
  const abrirEditar = (u) => {
    const puedeEditar = esAdmin || (esMaestro && u.rol === "Estudiante");
    if (!puedeEditar) { setMsg({ tipo: "error", txt: "Sin permiso para editar este usuario." }); return; }
    setEditando(u);
    setForm({ nombre: u.nombre||"", correo: u.correo||"", rol: u.rol||"Estudiante", registro: u.registro||"", carrera: u.carrera||"", semestre: u.semestre||"", grupo: u.grupo||"", departamento: u.departamento||"", materia: u.materia||"" });
    setModalForm(true);
  };

  const guardar = async () => {
    if (!form.nombre || !form.correo || !form.rol) { setMsg({ tipo: "error", txt: "Nombre, correo y rol son requeridos." }); return; }
    try {
      const data = { ...form, fechaActualizacion: serverTimestamp() };
      if (editando) {
        await updateDoc(doc(db, "usuarios", editando.id), data);
        setMsg({ tipo: "exito", txt: "Usuario actualizado." });
      } else {
        await addDoc(collection(db, "usuarios"), { ...data, fechaCreacion: serverTimestamp() });
        setMsg({ tipo: "exito", txt: "Usuario creado." });
      }
      setModalForm(false);
      cargar();
    } catch (e) { setMsg({ tipo: "error", txt: e.message }); }
  };

  const eliminar = async (u) => {
    if (!esAdmin) { setMsg({ tipo: "error", txt: "Sin permiso." }); return; }
    if (!confirm(`¿Eliminar a ${u.nombre}?`)) return;
    await deleteDoc(doc(db, "usuarios", u.id));
    cargar();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: C.texto }}>Usuarios ({filtrados.length})</h2>
        {esAdmin && <Btn onClick={abrirNuevo}>➕ Nuevo usuario</Btn>}
      </div>

      {msg && <Alerta tipo={msg.tipo} onClose={() => setMsg(null)}>{msg.txt}</Alerta>}

      {/* Filtros */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <input
          placeholder="🔍 Buscar por nombre o correo..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: "9px 13px", borderRadius: 9, border: `1.5px solid ${C.borde}`, fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff" }}
        />
        {["Todos", "Administrador", "Maestro", "Estudiante"].map(r => (
          <button key={r} onClick={() => setFiltroRol(r)} style={{
            padding: "8px 14px", borderRadius: 9, border: `1.5px solid ${filtroRol === r ? C.azulC : C.borde}`,
            background: filtroRol === r ? C.azulS : "#fff",
            color: filtroRol === r ? C.azulC : C.suave,
            fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
          }}>{r}</button>
        ))}
      </div>

      {cargando ? <Spinner /> : filtrados.length === 0 ? (
        <Tarjeta><div style={{ textAlign: "center", padding: 40, color: C.muy }}>No se encontraron usuarios</div></Tarjeta>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtrados.map(u => {
            const [cc, bg] = colorRol(u.rol);
            const puedeEditar    = esAdmin || (esMaestro && u.rol === "Estudiante");
            const puedeEliminar2 = esAdmin;
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
                  {puedeEditar    && <Btn variante="secundario" onClick={() => abrirEditar(u)} style={{ padding: "7px 12px", fontSize: 12 }}>✏️ Editar</Btn>}
                  {puedeEliminar2 && <Btn variante="peligro"    onClick={() => eliminar(u)}    style={{ padding: "7px 12px", fontSize: 12 }}>🗑️</Btn>}
                </div>
              </Tarjeta>
            );
          })}
        </div>
      )}

      {modalForm && (
        <Modal titulo={editando ? "Editar usuario" : "Nuevo usuario"} onClose={() => setModalForm(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Campo label="Nombre completo *" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre y apellidos" />
            <Campo label="Correo *" value={form.correo} onChange={e => setForm(p => ({ ...p, correo: e.target.value }))} placeholder="correo@ceti.mx" type="email" />
          </div>
          <CampoSelect label="Rol *" value={form.rol} onChange={e => setForm(p => ({ ...p, rol: e.target.value }))}
            options={esAdmin ? ["Estudiante", "Maestro", "Administrador"] : ["Estudiante"]}
            disabled={!esAdmin && !!editando && editando.rol !== "Estudiante"}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Campo label="No. Registro" value={form.registro} onChange={e => setForm(p => ({ ...p, registro: e.target.value }))} placeholder="Número de registro" />
            <Campo label="Carrera" value={form.carrera} onChange={e => setForm(p => ({ ...p, carrera: e.target.value }))} placeholder="Ingeniería en..." />
            <Campo label="Semestre" value={form.semestre} onChange={e => setForm(p => ({ ...p, semestre: e.target.value }))} placeholder="1–12" />
            <Campo label="Grupo" value={form.grupo} onChange={e => setForm(p => ({ ...p, grupo: e.target.value }))} placeholder="A, B, C..." />
            <Campo label="Departamento" value={form.departamento} onChange={e => setForm(p => ({ ...p, departamento: e.target.value }))} placeholder="Depto. académico" />
            <Campo label="Materia" value={form.materia} onChange={e => setForm(p => ({ ...p, materia: e.target.value }))} placeholder="Materia que imparte" />
          </div>
          {msg && <Alerta tipo={msg.tipo}>{msg.txt}</Alerta>}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Btn onClick={guardar}>{editando ? "💾 Actualizar" : "✅ Crear usuario"}</Btn>
            <Btn variante="secundario" onClick={() => setModalForm(false)}>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── PANTALLA: INFORMES ───────────────────────────────────────
function Informes({ correo, rol }) {
  const esAdmin      = rol === "Administrador";
  const esMaestro    = rol === "Maestro";
  const esEstudiante = rol === "Estudiante";

  const [informes,  setInformes]  = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [modalForm, setModalForm] = useState(false);
  const [editando,  setEditando]  = useState(null);
  const [msg,       setMsg]       = useState(null);
  const [subiendo,  setSubiendo]  = useState(false);
  const [progreso,  setProgreso]  = useState(0);
  const fileRef = useRef();

  const vacioForm = { titulo: "", descripcion: "", archivo: null, archivoNombre: "", archivoURL: "" };
  const [form, setForm] = useState(vacioForm);

  const cargar = async () => {
    setCargando(true);
    const snap = await getDocs(query(collection(db, "informes"), orderBy("fecha", "desc")));
    setInformes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const abrirNuevo = () => { setEditando(null); setForm(vacioForm); setModalForm(true); };
  const abrirEditar = (inf) => {
    setEditando(inf);
    setForm({ titulo: inf.titulo, descripcion: inf.descripcion || "", archivo: null, archivoNombre: inf.archivoNombre || "", archivoURL: inf.archivoURL || "" });
    setModalForm(true);
  };

  const subirArchivo = () => new Promise((resolve, reject) => {
    if (!form.archivo) { resolve(null); return; }
    const ext = form.archivo.name.split(".").pop();
    const ruta = `informes/${Date.now()}_${form.archivo.name}`;
    const storageRef = ref(storage, ruta);
    const task = uploadBytesResumable(storageRef, form.archivo);
    task.on("state_changed",
      snap => setProgreso(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
      reject,
      async () => { const url = await getDownloadURL(task.snapshot.ref); resolve({ url, nombre: form.archivo.name, ruta }); }
    );
  });

  const guardar = async () => {
    if (!form.titulo) { setMsg({ tipo: "error", txt: "El título es requerido." }); return; }
    setSubiendo(true); setProgreso(0);
    try {
      let archivoData = { archivoURL: form.archivoURL, archivoNombre: form.archivoNombre };
      if (form.archivo) {
        const res = await subirArchivo();
        if (res) archivoData = { archivoURL: res.url, archivoNombre: res.nombre, archivoRuta: res.ruta };
      }
      const data = { titulo: form.titulo, descripcion: form.descripcion, ...archivoData, autor: correo, autorCorreo: correo, fechaActualizacion: serverTimestamp() };
      if (editando) {
        await updateDoc(doc(db, "informes", editando.id), data);
        setMsg({ tipo: "exito", txt: "Informe actualizado." });
      } else {
        await addDoc(collection(db, "informes"), { ...data, fecha: serverTimestamp() });
        setMsg({ tipo: "exito", txt: "Informe creado." });
      }
      setModalForm(false);
      cargar();
    } catch (e) { setMsg({ tipo: "error", txt: e.message }); }
    setSubiendo(false);
  };

  const eliminar = async (inf) => {
    if (!esAdmin) { setMsg({ tipo: "error", txt: "Sin permiso." }); return; }
    if (!confirm(`¿Eliminar informe "${inf.titulo}"?`)) return;
    if (inf.archivoRuta) {
      try { await deleteObject(ref(storage, inf.archivoRuta)); } catch {}
    }
    await deleteDoc(doc(db, "informes", inf.id));
    cargar();
  };

  const iconoArchivo = (nombre = "") => {
    const ext = nombre.split(".").pop().toLowerCase();
    if (ext === "pdf") return "📄";
    if (["doc", "docx"].includes(ext)) return "📝";
    if (["xls", "xlsx"].includes(ext)) return "📊";
    if (["ppt", "pptx"].includes(ext)) return "📋";
    if (["jpg", "jpeg", "png"].includes(ext)) return "🖼️";
    return "📎";
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: C.texto }}>Informes ({informes.length})</h2>
        {(esAdmin || esMaestro) && <Btn onClick={abrirNuevo}>📤 Subir informe</Btn>}
      </div>

      {msg && <Alerta tipo={msg.tipo} onClose={() => setMsg(null)}>{msg.txt}</Alerta>}

      {cargando ? <Spinner /> : informes.length === 0 ? (
        <Tarjeta><div style={{ textAlign: "center", padding: 40, color: C.muy }}><div style={{ fontSize: 40 }}>📊</div><div style={{ marginTop: 8, fontWeight: 600 }}>No hay informes</div></div></Tarjeta>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {informes.map(inf => {
            const puedeEditar    = esAdmin || (esMaestro && inf.autorCorreo === correo);
            const puedeEliminar2 = esAdmin;
            return (
              <Tarjeta key={inf.id} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: C.advS, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                  {iconoArchivo(inf.archivoNombre)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: C.texto, marginBottom: 4 }}>{inf.titulo}</div>
                  {inf.descripcion && <div style={{ fontSize: 13, color: C.suave, marginBottom: 6 }}>{inf.descripcion}</div>}
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
                  {puedeEditar    && <Btn variante="secundario" onClick={() => abrirEditar(inf)} style={{ padding: "7px 12px", fontSize: 12 }}>✏️</Btn>}
                  {puedeEliminar2 && <Btn variante="peligro"    onClick={() => eliminar(inf)}    style={{ padding: "7px 12px", fontSize: 12 }}>🗑️</Btn>}
                </div>
              </Tarjeta>
            );
          })}
        </div>
      )}

      {modalForm && (
        <Modal titulo={editando ? "Editar informe" : "Subir informe"} onClose={() => setModalForm(false)}>
          <Campo label="Título *" value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} placeholder="Título del informe" />
          <CampoArea label="Descripción" value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} placeholder="Descripción opcional..." rows={3} />

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.suave, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Archivo (PDF, DOCX, XLSX, PPTX, JPG, PNG)
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${C.borde}`, borderRadius: 10, padding: "20px",
                textAlign: "center", cursor: "pointer", background: C.fondo,
                color: C.suave, fontSize: 13, fontWeight: 600,
              }}
            >
              {form.archivo ? `✅ ${form.archivo.name}` : form.archivoNombre ? `📎 ${form.archivoNombre} (click para cambiar)` : "📂 Click para seleccionar archivo"}
            </div>
            <input
              ref={fileRef} type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
              style={{ display: "none" }}
              onChange={e => e.target.files[0] && setForm(p => ({ ...p, archivo: e.target.files[0] }))}
            />
          </div>

          {subiendo && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: C.suave, marginBottom: 5 }}>Subiendo archivo... {progreso}%</div>
              <div style={{ background: C.borde, borderRadius: 4, height: 6 }}>
                <div style={{ background: C.azulC, height: 6, borderRadius: 4, width: `${progreso}%`, transition: "width 0.2s" }} />
              </div>
            </div>
          )}

          {msg && <Alerta tipo={msg.tipo}>{msg.txt}</Alerta>}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Btn onClick={guardar} disabled={subiendo}>{subiendo ? "Subiendo..." : editando ? "💾 Actualizar" : "📤 Subir informe"}</Btn>
            <Btn variante="secundario" onClick={() => setModalForm(false)}>Cancelar</Btn>
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

  // Stats para dashboard
  const [stats, setStats] = useState({
    totalUsuarios: 0, totalEstudiantes: 0, totalMaestros: 0, totalAdmins: 0,
    totalAvisos: 0, totalMensajes: 0, totalInformes: 0,
  });
  const [actividad, setActividad] = useState({ usuarios: [], avisos: [], mensajes: [] });

// Escuchar autenticación
useEffect(() => {
  const unsub = onAuthStateChanged(auth, async (user) => {
    if (user) {
      setUsuario(user);

      // ── DIAGNÓSTICO 1: verificar exactamente qué email recibe Firebase Auth
      const emailAuth = (user.email || "").trim().toLowerCase();
      console.log("[ROL DEBUG] user.uid:", user.uid);
      console.log("[ROL DEBUG] user.email RAW:", JSON.stringify(user.email));
      console.log("[ROL DEBUG] email normalizado para query:", emailAuth);

      try {
        // ── Opción A: query por correo normalizado
        const snapNorm = await getDocs(
          query(collection(db, "usuarios"), where("correo", "==", emailAuth))
        );
        console.log("[ROL DEBUG] Docs con email NORMALIZADO:", snapNorm.size);

        // ── Opción B (diagnóstico): query por correo tal cual viene de Auth
        const snapRaw = await getDocs(
          query(collection(db, "usuarios"), where("correo", "==", user.email))
        );
        console.log("[ROL DEBUG] Docs con email RAW:", snapRaw.size);

        // ── DIAGNÓSTICO 2: listar TODOS los correos en la colección para comparar
        const snapTodos = await getDocs(collection(db, "usuarios"));
        console.log("[ROL DEBUG] Total docs en 'usuarios':", snapTodos.size);
        snapTodos.forEach(d => {
          const correoFirestore = d.data().correo;
          console.log(
            `[ROL DEBUG] Doc ${d.id} → correo: ${JSON.stringify(correoFirestore)} | ¿coincide normalizado?: ${(correoFirestore || "").trim().toLowerCase() === emailAuth}`
          );
        });

        // ── Usar primero el resultado normalizado, luego el raw como fallback
        let docData = null;
        if (!snapNorm.empty) {
          docData = snapNorm.docs[0].data();
          console.log("[ROL DEBUG] Match por email NORMALIZADO:", docData);
        } else if (!snapRaw.empty) {
          docData = snapRaw.docs[0].data();
          console.log("[ROL DEBUG] Match por email RAW:", docData);
        } else {
          // ── DIAGNÓSTICO 3: buscar manualmente por si la query falla por índices
          const matchManual = snapTodos.docs.find(d =>
            (d.data().correo || "").trim().toLowerCase() === emailAuth
          );
          if (matchManual) {
            docData = matchManual.data();
            console.log("[ROL DEBUG] Match MANUAL (la query where falla, revisar índices Firestore):", docData);
          }
        }

        if (docData) {
          console.log("[ROL DEBUG] ROL asignado:", docData.rol);
          setRol(docData.rol || "Estudiante");
        } else {
          console.warn("[ROL DEBUG] No se encontró ningún doc para este usuario. Revisa los logs anteriores.");
          setRol("Estudiante");
        }
      } catch (error) {
        console.error("[ROL DEBUG] Error al consultar Firestore:", error.code, error.message);
        setRol("Estudiante");
      }

      cargarStats();
    } else {
      setUsuario(null);
      setRol("Estudiante");
    }

    setCargando(false);
  });

  return unsub;
}, []);

  const cargarStats = async () => {
    try {
      const [snapU, snapA, snapM, snapI] = await Promise.all([
        getDocs(collection(db, "usuarios")),
        getDocs(collection(db, "avisos")),
        getDocs(collection(db, "mensajes")),
        getDocs(collection(db, "informes")),
      ]);
      const usuarios = snapU.docs.map(d => d.data());
      setStats({
        totalUsuarios:    usuarios.length,
        totalEstudiantes: usuarios.filter(u => u.rol === "Estudiante").length,
        totalMaestros:    usuarios.filter(u => u.rol === "Maestro").length,
        totalAdmins:      usuarios.filter(u => u.rol === "Administrador").length,
        totalAvisos:      snapA.size,
        totalMensajes:    snapM.size,
        totalInformes:    snapI.size,
      });

      // Actividad reciente (últimos 3)
      const ultUsuarios = snapU.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.fechaCreacion?.seconds || 0) - (a.fechaCreacion?.seconds || 0)).slice(0, 3);
      const ultAvisos   = snapA.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.fechaCreacion?.seconds || 0) - (a.fechaCreacion?.seconds || 0)).slice(0, 3);
      const ultMensajes = snapM.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.fecha?.seconds || 0) - (a.fecha?.seconds || 0)).slice(0, 3);
      setActividad({ usuarios: ultUsuarios, avisos: ultAvisos, mensajes: ultMensajes });
    } catch {}
  };

  const cerrarSesion = async () => {
    await signOut(auth);
    setUsuario(null);
    setRol("Estudiante");
    setPantalla("inicio");
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

  if (!usuario) return <Login onLogin={() => {}} />;

  const contenido = () => {
    switch (pantalla) {
      case "inicio":
        return <Dashboard correo={usuario.email} rol={rol} stats={stats} actividad={actividad} />;
      case "avisos":
        return <Avisos correo={usuario.email} rol={rol} />;
      case "mensajes":
        return <Mensajes correo={usuario.email} rol={rol} />;
      case "usuarios":
        return (rol === "Administrador" || rol === "Maestro")
          ? <Usuarios correo={usuario.email} rol={rol} />
          : <Tarjeta><div style={{ padding: 40, textAlign: "center", color: C.muy }}>Sin acceso a este módulo.</div></Tarjeta>;
      case "informes":
        return <Informes correo={usuario.email} rol={rol} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.fondo, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`* { box-sizing: border-box; } ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: ${C.borde}; border-radius: 4px; }`}</style>

      <Sidebar
        pantalla={pantalla}
        setPantalla={setPantalla}
        correo={usuario.email}
        rol={rol}
        onCerrar={cerrarSesion}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <TopBar pantalla={pantalla} rol={rol} />
        <main style={{ flex: 1, padding: "24px 28px", overflowY: "auto" }}>
          {contenido()}
        </main>
      </div>
    </div>
  );
}