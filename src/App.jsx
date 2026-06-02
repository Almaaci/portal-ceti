import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

// ─── PALETA INSTITUCIONAL CETI ────────────────────────────────────────────────
const C = {
  azul: "#1a3a6b",
  azulM: "#1e4d8c",
  azulC: "#2563eb",
  azulS: "#dbeafe",
  naranja: "#e85d04",
  naranjaM: "#f97316",
  naranjaS: "#fff7ed",
  exito: "#16a34a",
  exitoS: "#dcfce7",
  peligro: "#dc2626",
  peligroS: "#fee2e2",
  adv: "#d97706",
  advS: "#fef3c7",
  fondo: "#f0f4f8",
  card: "#ffffff",
  texto: "#0f172a",
  suave: "#475569",
  muy: "#94a3b8",
  borde: "#e2e8f0",
};

// ─── COMPONENTES BASE ─────────────────────────────────────────────────────────
function Campo({ label, value, onChange, placeholder, type = "text" }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.suave, marginBottom: 5 }}>
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          width: "100%",
          padding: "11px 14px",
          borderRadius: 10,
          border: `1.5px solid ${focus ? C.azulC : C.borde}`,
          fontSize: 14,
          outline: "none",
          background: C.fondo,
          color: C.texto,
          boxSizing: "border-box",
          transition: "border-color 0.2s",
          fontFamily: "inherit",
        }}
      />
    </div>
  );
}

function CampoArea({ label, value, onChange, placeholder, rows = 4 }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.suave, marginBottom: 5 }}>
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          width: "100%",
          padding: "11px 14px",
          borderRadius: 10,
          border: `1.5px solid ${focus ? C.azulC : C.borde}`,
          fontSize: 14,
          outline: "none",
          background: C.fondo,
          color: C.texto,
          boxSizing: "border-box",
          resize: "vertical",
          transition: "border-color 0.2s",
          fontFamily: "inherit",
        }}
      />
    </div>
  );
}

function CampoSelect({ label, value, onChange, options }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.suave, marginBottom: 5 }}>
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          width: "100%",
          padding: "11px 14px",
          borderRadius: 10,
          border: `1.5px solid ${focus ? C.azulC : C.borde}`,
          fontSize: 14,
          outline: "none",
          background: C.fondo,
          color: C.texto,
          boxSizing: "border-box",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        {options.map((o) =>
          typeof o === "string" ? (
            <option key={o} value={o === "Selecciona un rol" ? "" : o}>{o}</option>
          ) : (
            <option key={o.value} value={o.value}>{o.label}</option>
          )
        )}
      </select>
    </div>
  );
}

function Btn({ children, onClick, variante = "primario", ancho = false, style: extra }) {
  const [press, setPress] = useState(false);
  const estilos = {
    primario: { background: `linear-gradient(135deg, ${C.azulC}, ${C.azul})`, color: "#fff", border: "none", boxShadow: "0 4px 14px rgba(37,99,235,0.3)" },
    peligro:  { background: `linear-gradient(135deg, ${C.peligro}, #b91c1c)`,  color: "#fff", border: "none" },
    secundario: { background: C.fondo, color: C.texto, border: `1.5px solid ${C.borde}` },
    naranja:  { background: `linear-gradient(135deg, ${C.naranjaM}, ${C.naranja})`, color: "#fff", border: "none" },
  };
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      onMouseLeave={() => setPress(false)}
      style={{
        ...estilos[variante],
        padding: "11px 22px",
        borderRadius: 11,
        fontWeight: 700,
        fontSize: 14,
        cursor: "pointer",
        transition: "all 0.15s",
        transform: press ? "scale(0.97)" : "scale(1)",
        width: ancho ? "100%" : "auto",
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        ...extra,
      }}
    >
      {children}
    </button>
  );
}

function Tarjeta({ children, style }) {
  return (
    <div style={{
      background: C.card,
      borderRadius: 16,
      border: `1px solid ${C.borde}`,
      padding: "22px 24px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
      ...style,
    }}>
      {children}
    </div>
  );
}

function Alerta({ tipo, children }) {
  const conf = {
    exito:  { bg: C.exitoS,  color: C.exito,  icon: "✅" },
    error:  { bg: C.peligroS, color: C.peligro, icon: "❌" },
    info:   { bg: C.azulS,   color: C.azulC,  icon: "ℹ️" },
  };
  const k = conf[tipo] || conf.info;
  return (
    <div style={{
      padding: "11px 16px", borderRadius: 10, background: k.bg,
      color: k.color, fontWeight: 600, fontSize: 13,
      display: "flex", alignItems: "center", gap: 8, marginTop: 12,
    }}>
      {k.icon} {children}
    </div>
  );
}

function Avatar({ letras, color, size = 38 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${color}, ${color}bb)`,
      color: "#fff", display: "flex", alignItems: "center",
      justifyContent: "center", fontWeight: 800,
      fontSize: size * 0.33, flexShrink: 0,
      boxShadow: `0 2px 8px ${color}40`,
    }}>
      {letras}
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ pantalla, setPantalla, correo, onCerrar, cargarUsuarios, cargarAvisos, cargarMensajes }) {
  const items = [
    { id: "inicio",   icono: "🏠", label: "Inicio" },
    { id: "avisos",   icono: "📢", label: "Avisos",   accion: cargarAvisos },
    { id: "mensajes", icono: "💬", label: "Mensajes", accion: cargarMensajes },
    { id: "usuarios", icono: "👥", label: "Usuarios", accion: cargarUsuarios },
    { id: "informes", icono: "📊", label: "Informes" },
  ];

  return (
    <div style={{
      width: 220, minHeight: "100vh",
      background: `linear-gradient(180deg, ${C.azul} 0%, #0f2447 100%)`,
      display: "flex", flexDirection: "column",
      flexShrink: 0, position: "sticky", top: 0, height: "100vh",
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
          🎓
        </div>
        <div>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 14, lineHeight: 1.2 }}>Portal CETI</div>
          <div style={{ color: C.naranjaM, fontSize: 10, fontWeight: 700 }}>Colomos</div>
        </div>
      </div>

      {/* Usuario */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar letras={correo.slice(0, 2).toUpperCase()} color={C.naranja} size={36} />
        <div style={{ minWidth: 0 }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{correo}</div>
          <div style={{ color: C.naranjaM, fontSize: 10, fontWeight: 600 }}>Administrador</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px 8px" }}>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => { setPantalla(item.id); item.accion && item.accion(); }}
            style={{
              width: "100%", padding: "11px 14px", borderRadius: 10,
              border: "none", cursor: "pointer", display: "flex",
              alignItems: "center", gap: 10, marginBottom: 2,
              fontWeight: 600, fontSize: 13,
              background: pantalla === item.id ? "rgba(255,255,255,0.15)" : "transparent",
              color: pantalla === item.id ? "#fff" : "rgba(255,255,255,0.6)",
              borderLeft: `3px solid ${pantalla === item.id ? C.naranjaM : "transparent"}`,
              transition: "all 0.15s", fontFamily: "inherit", textAlign: "left",
            }}
          >
            <span style={{ fontSize: 18 }}>{item.icono}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Cerrar sesión */}
      <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <button
          onClick={onCerrar}
          style={{
            width: "100%", padding: "10px 0", borderRadius: 10, border: "none",
            background: "rgba(220,38,38,0.15)", color: "#fca5a5",
            cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit",
          }}
        >
          🚪 Cerrar sesión
        </button>
      </div>
    </div>
  );
}

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
function TopBar({ pantalla }) {
  const titulos = {
    inicio:   "🏠 Inicio",
    avisos:   "📢 Avisos Institucionales",
    mensajes: "💬 Mensajes",
    usuarios: "👥 Administración de Usuarios",
    informes: "📊 Informes",
  };
  return (
    <div style={{
      background: C.card, borderBottom: `1px solid ${C.borde}`,
      padding: "14px 28px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      position: "sticky", top: 0, zIndex: 100,
    }}>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.texto }}>
        {titulos[pantalla] || "Portal CETI"}
      </h2>
    </div>
  );
}

// ─── PANTALLA: INICIO ─────────────────────────────────────────────────────────
function PantallaInicio({ correo }) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: C.texto, margin: "0 0 6px" }}>
          Bienvenido al Portal 🎓
        </h1>
        <p style={{ color: C.suave, fontSize: 14, margin: 0 }}>
          Sesión iniciada como: <strong>{correo}</strong>
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
        {[
          { icono: "👥", val: "—",  label: "Usuarios registrados", color: C.azulC,   bg: C.azulS },
          { icono: "📢", val: "—",  label: "Avisos publicados",    color: C.naranja,  bg: C.naranjaS },
          { icono: "💬", val: "—",  label: "Mensajes enviados",    color: C.exito,    bg: C.exitoS },
          { icono: "📊", val: "—",  label: "Informes generados",   color: C.adv,      bg: C.advS },
        ].map((s, i) => (
          <Tarjeta key={i} style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
              {s.icono}
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: C.texto, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 12, color: C.suave, marginTop: 3 }}>{s.label}</div>
            </div>
          </Tarjeta>
        ))}
      </div>

      <Tarjeta>
        <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 800, color: C.texto }}>
          🚀 Accesos rápidos
        </h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ padding: "14px 18px", background: C.azulS, borderRadius: 12, borderLeft: `4px solid ${C.azulC}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.texto }}>📢 Publicar aviso</div>
            <div style={{ fontSize: 12, color: C.suave, marginTop: 2 }}>Ve al módulo de Avisos</div>
          </div>
          <div style={{ padding: "14px 18px", background: C.naranjaS, borderRadius: 12, borderLeft: `4px solid ${C.naranja}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.texto }}>👥 Gestionar usuarios</div>
            <div style={{ fontSize: 12, color: C.suave, marginTop: 2 }}>Agrega o elimina usuarios</div>
          </div>
          <div style={{ padding: "14px 18px", background: C.exitoS, borderRadius: 12, borderLeft: `4px solid ${C.exito}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.texto }}>💬 Ver mensajes</div>
            <div style={{ fontSize: 12, color: C.suave, marginTop: 2 }}>Mensajes del sistema</div>
          </div>
        </div>
      </Tarjeta>
    </div>
  );
}

// ─── PANTALLA: AVISOS ─────────────────────────────────────────────────────────
function PantallaAvisos({ avisos, tituloAviso, setTituloAviso, contenidoAviso, setContenidoAviso, guardarAviso, eliminarAviso }) {
  const [exito, setExito] = useState(false);

  const handleGuardar = async () => {
    await guardarAviso();
    setExito(true);
    setTimeout(() => setExito(false), 3000);
  };

  return (
    <div>
      {/* Formulario nuevo aviso */}
      <Tarjeta style={{ marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 18px", fontSize: 16, fontWeight: 800, color: C.texto }}>
          📝 Nuevo Aviso Institucional
        </h3>
        <Campo
          label="Título del aviso *"
          value={tituloAviso}
          onChange={(e) => setTituloAviso(e.target.value)}
          placeholder="Ej: Entrega de proyecto final"
        />
        <CampoArea
          label="Contenido *"
          value={contenidoAviso}
          onChange={(e) => setContenidoAviso(e.target.value)}
          placeholder="Escribe el detalle del aviso..."
          rows={4}
        />
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Btn onClick={handleGuardar}>📤 Publicar Aviso</Btn>
          {exito && <Alerta tipo="exito">¡Aviso publicado correctamente!</Alerta>}
        </div>
      </Tarjeta>

      {/* Lista de avisos */}
      <h3 style={{ fontSize: 15, fontWeight: 800, color: C.texto, margin: "0 0 14px" }}>
        Avisos Publicados ({avisos.length})
      </h3>

      {avisos.length === 0 && (
        <Tarjeta>
          <div style={{ textAlign: "center", padding: 30, color: C.muy }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
            <div style={{ fontWeight: 600 }}>No hay avisos publicados aún</div>
          </div>
        </Tarjeta>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {avisos.map((aviso) => (
          <Tarjeta key={aviso.id} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: C.azulS, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
              📢
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.texto, marginBottom: 6 }}>
                {aviso.titulo}
              </div>
              <div style={{ fontSize: 13, color: C.suave, lineHeight: 1.6 }}>
                {aviso.contenido}
              </div>
            </div>
            <Btn variante="peligro" onClick={() => eliminarAviso(aviso.id)} style={{ padding: "8px 14px", fontSize: 13 }}>
              🗑️ Eliminar
            </Btn>
          </Tarjeta>
        ))}
      </div>
    </div>
  );
}

// ─── PANTALLA: MENSAJES ───────────────────────────────────────────────────────
function PantallaMensajes({ mensajes, nuevoMensaje, setNuevoMensaje, guardarMensaje, correo }) {
  const [enviado, setEnviado] = useState(false);

  const handleEnviar = async () => {
    await guardarMensaje();
    setEnviado(true);
    setTimeout(() => setEnviado(false), 3000);
  };

  return (
    <div>
      {/* Input nuevo mensaje */}
      <Tarjeta style={{ marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800, color: C.texto }}>
          ✍️ Nuevo Mensaje
        </h3>
        <CampoArea
          label="Escribe tu mensaje"
          value={nuevoMensaje}
          onChange={(e) => setNuevoMensaje(e.target.value)}
          placeholder="Escribe aquí tu mensaje..."
          rows={4}
        />
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Btn onClick={handleEnviar}>📨 Enviar Mensaje</Btn>
          {enviado && <Alerta tipo="exito">¡Mensaje enviado!</Alerta>}
        </div>
      </Tarjeta>

      {/* Lista de mensajes */}
      <h3 style={{ fontSize: 15, fontWeight: 800, color: C.texto, margin: "0 0 14px" }}>
        Mensajes Publicados ({mensajes.length})
      </h3>

      {mensajes.length === 0 && (
        <Tarjeta>
          <div style={{ textAlign: "center", padding: 30, color: C.muy }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
            <div style={{ fontWeight: 600 }}>No hay mensajes aún</div>
          </div>
        </Tarjeta>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {mensajes.map((msg) => (
          <Tarjeta key={msg.id}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <Avatar
                letras={msg.autor ? msg.autor.slice(0, 2).toUpperCase() : "??"}
                color={C.azulC}
                size={42}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.azulC, marginBottom: 4 }}>
                  {msg.autor}
                </div>
                <div style={{ fontSize: 14, color: C.texto, lineHeight: 1.6 }}>
                  {msg.mensaje}
                </div>
              </div>
            </div>
          </Tarjeta>
        ))}
      </div>
    </div>
  );
}

// ─── PANTALLA: USUARIOS ───────────────────────────────────────────────────────
function PantallaUsuarios({
  usuarios, guardarUsuario, eliminarUsuario,
  nombreNuevo, setNombreNuevo,
  correoNuevo, setCorreoNuevo,
  rolNuevo, setRolNuevo,
  registroNuevo, setRegistroNuevo,
  carreraNueva, setCarreraNueva,
  semestreNuevo, setSemestreNuevo,
  grupoNuevo, setGrupoNuevo,
  departamentoNuevo, setDepartamentoNuevo,
  materiaNueva, setMateriaNueva,
}) {
  const [exito, setExito] = useState(false);

  const handleGuardar = async () => {
    await guardarUsuario();
    setExito(true);
    setTimeout(() => setExito(false), 3000);
  };

  const colorRol = {
    Administrador: [C.peligro, C.peligroS],
    Maestro:       [C.azulC,   C.azulS],
    Estudiante:    [C.exito,   C.exitoS],
  };

  return (
    <div>
      {/* Formulario */}
      <Tarjeta style={{ marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 18px", fontSize: 16, fontWeight: 800, color: C.texto }}>
          ➕ Registrar Nuevo Usuario
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
          <Campo
            label="Nombre completo *"
            value={nombreNuevo}
            onChange={(e) => setNombreNuevo(e.target.value)}
            placeholder="Ej: Ana Torres"
          />
          <Campo
            label="Correo electrónico"
            value={correoNuevo}
            onChange={(e) => setCorreoNuevo(e.target.value)}
            placeholder="correo@ceti.mx"
            type="email"
          />
        </div>

        <CampoSelect
          label="Rol *"
          value={rolNuevo}
          onChange={(e) => setRolNuevo(e.target.value)}
          options={[
            { value: "", label: "Selecciona un rol..." },
            { value: "Administrador", label: "Administrador" },
            { value: "Maestro",       label: "Maestro" },
            { value: "Estudiante",    label: "Estudiante" },
          ]}
        />

        {/* Campos adicionales para Estudiante */}
        {rolNuevo === "Estudiante" && (
          <div style={{ background: C.azulS, borderRadius: 12, padding: "16px 18px", marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.azulC, marginBottom: 14 }}>
              📚 Datos del Estudiante
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
              <Campo label="Número de registro" value={registroNuevo} onChange={(e) => setRegistroNuevo(e.target.value)} placeholder="Ej: 21TI0123" />
              <Campo label="Carrera" value={carreraNueva} onChange={(e) => setCarreraNueva(e.target.value)} placeholder="Ej: Sistemas" />
              <Campo label="Semestre" value={semestreNuevo} onChange={(e) => setSemestreNuevo(e.target.value)} placeholder="Ej: 6" />
              <Campo label="Grupo" value={grupoNuevo} onChange={(e) => setGrupoNuevo(e.target.value)} placeholder="Ej: A" />
            </div>
          </div>
        )}

        {/* Campos adicionales para Maestro */}
        {rolNuevo === "Maestro" && (
          <div style={{ background: "#ede9fe", borderRadius: 12, padding: "16px 18px", marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed", marginBottom: 14 }}>
              👨‍🏫 Datos del Maestro
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
              <Campo label="Departamento" value={departamentoNuevo} onChange={(e) => setDepartamentoNuevo(e.target.value)} placeholder="Ej: Ingeniería en Sistemas" />
              <Campo label="Materia" value={materiaNueva} onChange={(e) => setMateriaNueva(e.target.value)} placeholder="Ej: Programación Web" />
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Btn onClick={handleGuardar}>💾 Guardar Usuario</Btn>
          {exito && <Alerta tipo="exito">¡Usuario guardado exitosamente!</Alerta>}
        </div>
      </Tarjeta>

      {/* Lista de usuarios */}
      <h3 style={{ fontSize: 15, fontWeight: 800, color: C.texto, margin: "0 0 14px" }}>
        Usuarios Registrados ({usuarios.length})
      </h3>

      {usuarios.length === 0 && (
        <Tarjeta>
          <div style={{ textAlign: "center", padding: 30, color: C.muy }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>👥</div>
            <div style={{ fontWeight: 600 }}>No hay usuarios registrados aún</div>
          </div>
        </Tarjeta>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {usuarios.map((u) => {
          const [colorR, bgR] = colorRol[u.rol] || [C.suave, C.fondo];
          const iniciales = u.nombre ? u.nombre.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "??";
          return (
            <Tarjeta key={u.id} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar letras={iniciales} color={colorR} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.texto, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.nombre}
                  </div>
                  <div style={{ fontSize: 12, color: C.suave, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.correo || "Sin correo"}
                  </div>
                </div>
              </div>

              {/* Badge de rol */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ background: bgR, color: colorR, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700 }}>
                  {u.rol}
                </span>
                <Btn variante="peligro" onClick={() => eliminarUsuario(u.id)} style={{ padding: "6px 12px", fontSize: 12 }}>
                  🗑️ Eliminar
                </Btn>
              </div>

              {/* Datos extra */}
              {u.rol === "Estudiante" && u.registro && (
                <div style={{ fontSize: 12, color: C.suave, background: C.fondo, borderRadius: 8, padding: "8px 12px" }}>
                  📋 Reg: {u.registro} · {u.carrera} · {u.semestre}° sem · Grupo {u.grupo}
                </div>
              )}
              {u.rol === "Maestro" && u.departamento && (
                <div style={{ fontSize: 12, color: C.suave, background: C.fondo, borderRadius: 8, padding: "8px 12px" }}>
                  🏫 {u.departamento} · {u.materia}
                </div>
              )}
            </Tarjeta>
          );
        })}
      </div>
    </div>
  );
}

// ─── PANTALLA: INFORMES (placeholder) ────────────────────────────────────────
function PantallaInformes() {
  return (
    <Tarjeta>
      <div style={{ textAlign: "center", padding: 40, color: C.muy }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
        <div style={{ fontWeight: 800, fontSize: 18, color: C.texto, marginBottom: 6 }}>
          Módulo de Informes
        </div>
        <div style={{ fontSize: 14 }}>Próximamente disponible</div>
      </div>
    </Tarjeta>
  );
}

// ─── PANTALLA DE LOGIN ────────────────────────────────────────────────────────
function PantallaLogin({ correo, setCorreo, password, setPassword, iniciarSesion, mensajeError }) {
  const [cargando, setCargando] = useState(false);

  const handleLogin = async () => {
    setCargando(true);
    await iniciarSesion();
    setCargando(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(145deg, ${C.azul} 0%, #1e4d8c 50%, #0f2447 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, fontFamily: "'Segoe UI', system-ui, sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      {/* Decoración */}
      <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />
      <div style={{ position: "absolute", bottom: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(232,93,4,0.07)" }} />

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div style={{
            width: 100, height: 100, borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
            border: "2px solid rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 18px", fontSize: 44,
          }}>
            🎓
          </div>
          <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 800, margin: "0 0 6px", letterSpacing: 0.5 }}>
            Portal Universitario
          </h1>
          <div style={{ color: C.naranjaM, fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>
            CETI COLOMOS
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "6px 0 0" }}>
            Centro de Enseñanza Técnica Industrial
          </p>
        </div>

        {/* Card */}
        <div style={{ background: "#fff", borderRadius: 22, padding: "32px 30px", boxShadow: "0 32px 80px rgba(0,0,0,0.3)" }}>
          <h2 style={{ margin: "0 0 22px", fontSize: 20, fontWeight: 800, color: C.texto }}>
            Iniciar Sesión
          </h2>

          <Campo
            label="Correo electrónico"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="correo@ceti.mx"
            type="email"
          />
          <Campo
            label="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            type="password"
          />

          {mensajeError && <Alerta tipo="error">{mensajeError}</Alerta>}

          <Btn
            onClick={handleLogin}
            ancho
            style={{ marginTop: 20, justifyContent: "center", opacity: cargando ? 0.75 : 1 }}
          >
            {cargando ? "Verificando..." : "Entrar al Portal →"}
          </Btn>

          <p style={{ textAlign: "center", color: C.muy, fontSize: 12, marginTop: 14, marginBottom: 0 }}>
            ¿Problemas para acceder? Contacta a soporte · Ext. 1234
          </p>
        </div>

        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 18 }}>
          CETI Colomos · Guadalajara, Jalisco · v2.0
        </p>
      </div>
    </div>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App() {
  // Auth
  const [correo,    setCorreo]    = useState("");
  const [password,  setPassword]  = useState("");
  const [logueado,  setLogueado]  = useState(false);
  const [pantalla,  setPantalla]  = useState("inicio");
  const [mensajeError, setMensajeError] = useState("");

  // Usuarios
  const [usuarios,          setUsuarios]          = useState([]);
  const [nombreNuevo,       setNombreNuevo]        = useState("");
  const [correoNuevo,       setCorreoNuevo]        = useState("");
  const [rolNuevo,          setRolNuevo]           = useState("");
  const [registroNuevo,     setRegistroNuevo]      = useState("");
  const [carreraNueva,      setCarreraNueva]       = useState("");
  const [semestreNuevo,     setSemestreNuevo]      = useState("");
  const [grupoNuevo,        setGrupoNuevo]         = useState("");
  const [departamentoNuevo, setDepartamentoNuevo]  = useState("");
  const [materiaNueva,      setMateriaNueva]       = useState("");

  // Avisos
  const [avisos,         setAvisos]         = useState([]);
  const [tituloAviso,    setTituloAviso]    = useState("");
  const [contenidoAviso, setContenidoAviso] = useState("");

  // Mensajes
  const [mensajes,      setMensajes]      = useState([]);
  const [nuevoMensaje,  setNuevoMensaje]  = useState("");

  // ── Auth ──────────────────────────────────────────────────────────────────
  const iniciarSesion = async () => {
    setMensajeError("");
    try {
      await signInWithEmailAndPassword(auth, correo, password);
      setLogueado(true);
    } catch (error) {
      setMensajeError("Correo o contraseña incorrectos");
      console.error(error);
    }
  };

  const cerrarSesion = () => {
    setLogueado(false);
    setPantalla("inicio");
    setCorreo("");
    setPassword("");
  };

  // ── Usuarios ──────────────────────────────────────────────────────────────
  const cargarUsuarios = async () => {
    try {
      const snap = await getDocs(collection(db, "usuarios"));
      setUsuarios(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) { console.error(error); }
  };

  const guardarUsuario = async () => {
    if (!nombreNuevo || !rolNuevo) { alert("Completa nombre y rol"); return; }
    try {
      const datos = { nombre: nombreNuevo, correo: correoNuevo, rol: rolNuevo };
      if (rolNuevo === "Estudiante") {
        datos.registro    = registroNuevo;
        datos.carrera     = carreraNueva;
        datos.semestre    = semestreNuevo;
        datos.grupo       = grupoNuevo;
      }
      if (rolNuevo === "Maestro") {
        datos.departamento = departamentoNuevo;
        datos.materia      = materiaNueva;
      }
      await addDoc(collection(db, "usuarios"), datos);
      // Limpiar
      setNombreNuevo(""); setCorreoNuevo(""); setRolNuevo("");
      setRegistroNuevo(""); setCarreraNueva(""); setSemestreNuevo(""); setGrupoNuevo("");
      setDepartamentoNuevo(""); setMateriaNueva("");
      await cargarUsuarios();
    } catch (error) { console.error(error); }
  };

  const eliminarUsuario = async (id) => {
    try {
      await deleteDoc(doc(db, "usuarios", id));
      await cargarUsuarios();
    } catch (error) { console.error(error); }
  };

  // ── Avisos ────────────────────────────────────────────────────────────────
  const cargarAvisos = async () => {
    try {
      const snap = await getDocs(collection(db, "avisos"));
      setAvisos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) { console.error(error); }
  };

  const guardarAviso = async () => {
    if (!tituloAviso || !contenidoAviso) { alert("Completa título y contenido"); return; }
    try {
      await addDoc(collection(db, "avisos"), { titulo: tituloAviso, contenido: contenidoAviso });
      setTituloAviso(""); setContenidoAviso("");
      await cargarAvisos();
    } catch (error) { console.error(error); }
  };

  const eliminarAviso = async (id) => {
    try {
      await deleteDoc(doc(db, "avisos", id));
      await cargarAvisos();
    } catch (error) { console.error(error); }
  };

  // ── Mensajes ──────────────────────────────────────────────────────────────
  const cargarMensajes = async () => {
    try {
      const snap = await getDocs(collection(db, "mensajes"));
      setMensajes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) { console.error(error); }
  };

  const guardarMensaje = async () => {
    if (!nuevoMensaje) { alert("Escribe un mensaje"); return; }
    try {
      await addDoc(collection(db, "mensajes"), { autor: correo, mensaje: nuevoMensaje });
      setNuevoMensaje("");
      await cargarMensajes();
    } catch (error) { console.error(error); }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (!logueado) {
    return (
      <PantallaLogin
        correo={correo} setCorreo={setCorreo}
        password={password} setPassword={setPassword}
        iniciarSesion={iniciarSesion}
        mensajeError={mensajeError}
      />
    );
  }

  const renderPantalla = () => {
    switch (pantalla) {
      case "inicio":
        return <PantallaInicio correo={correo} />;
      case "avisos":
        return (
          <PantallaAvisos
            avisos={avisos}
            tituloAviso={tituloAviso} setTituloAviso={setTituloAviso}
            contenidoAviso={contenidoAviso} setContenidoAviso={setContenidoAviso}
            guardarAviso={guardarAviso} eliminarAviso={eliminarAviso}
          />
        );
      case "mensajes":
        return (
          <PantallaMensajes
            mensajes={mensajes}
            nuevoMensaje={nuevoMensaje} setNuevoMensaje={setNuevoMensaje}
            guardarMensaje={guardarMensaje} correo={correo}
          />
        );
      case "usuarios":
        return (
          <PantallaUsuarios
            usuarios={usuarios} guardarUsuario={guardarUsuario} eliminarUsuario={eliminarUsuario}
            nombreNuevo={nombreNuevo} setNombreNuevo={setNombreNuevo}
            correoNuevo={correoNuevo} setCorreoNuevo={setCorreoNuevo}
            rolNuevo={rolNuevo} setRolNuevo={setRolNuevo}
            registroNuevo={registroNuevo} setRegistroNuevo={setRegistroNuevo}
            carreraNueva={carreraNueva} setCarreraNueva={setCarreraNueva}
            semestreNuevo={semestreNuevo} setSemestreNuevo={setSemestreNuevo}
            grupoNuevo={grupoNuevo} setGrupoNuevo={setGrupoNuevo}
            departamentoNuevo={departamentoNuevo} setDepartamentoNuevo={setDepartamentoNuevo}
            materiaNueva={materiaNueva} setMateriaNueva={setMateriaNueva}
          />
        );
      case "informes":
        return <PantallaInformes />;
      default:
        return null;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", background: C.fondo }}>
      <Sidebar
        pantalla={pantalla} setPantalla={setPantalla}
        correo={correo} onCerrar={cerrarSesion}
        cargarUsuarios={cargarUsuarios}
        cargarAvisos={cargarAvisos}
        cargarMensajes={cargarMensajes}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <TopBar pantalla={pantalla} />
        <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
          {renderPantalla()}
        </main>
      </div>
    </div>
  );
}