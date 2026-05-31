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

function App() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");

  const [logueado, setLogueado] = useState(false);
  const [pantalla, setPantalla] = useState("inicio");
  const [mensaje, setMensaje] = useState("");

  // Usuarios
  const [usuarios, setUsuarios] = useState([]);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [rolNuevo, setRolNuevo] = useState("");

  // Avisos
  const [avisos, setAvisos] = useState([]);
  const [tituloAviso, setTituloAviso] = useState("");
  const [contenidoAviso, setContenidoAviso] = useState("");

  const iniciarSesion = async () => {
    try {
      await signInWithEmailAndPassword(
        auth,
        correo,
        password
      );

      setLogueado(true);
      setMensaje("");
    } catch (error) {
      setMensaje("❌ Correo o contraseña incorrectos");
      console.log(error);
    }
  };

  // =========================
  // USUARIOS
  // =========================

  const cargarUsuarios = async () => {
    try {
      const consulta = await getDocs(
        collection(db, "usuarios")
      );

      const lista = [];

      consulta.forEach((doc) => {
        lista.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setUsuarios(lista);
    } catch (error) {
      console.log(error);
    }
  };

  const guardarUsuario = async () => {
    if (!nombreNuevo || !rolNuevo) {
      alert("Completa todos los campos");
      return;
    }
    const eliminarUsuario = async (id) => {
  try {
    await deleteDoc(doc(db, "usuarios", id));
    cargarUsuarios();
  } catch (error) {
    console.log(error);
  }
};

    try {
      await addDoc(
        collection(db, "usuarios"),
        {
          nombre: nombreNuevo,
          rol: rolNuevo,
        }
      );

      setNombreNuevo("");
      setRolNuevo("");

      cargarUsuarios();
    } catch (error) {
      console.log(error);
    }
  };

  // =========================
  // AVISOS
  // =========================

  const cargarAvisos = async () => {
    try {
      const consulta = await getDocs(
        collection(db, "avisos")
      );

      const lista = [];

      consulta.forEach((doc) => {
        lista.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setAvisos(lista);
    } catch (error) {
      console.log(error);
    }
  };

  const guardarAviso = async () => {
    if (!tituloAviso || !contenidoAviso) {
      alert("Completa todos los campos");
      return;
    }
    const eliminarAviso = async (id) => {
  try {
    await deleteDoc(doc(db, "avisos", id));
    cargarAvisos();
  } catch (error) {
    console.log(error);
  }
};

    try {
      await addDoc(
        collection(db, "avisos"),
        {
          titulo: tituloAviso,
          contenido: contenidoAviso,
        }
      );

      setTituloAviso("");
      setContenidoAviso("");

      cargarAvisos();
    } catch (error) {
      console.log(error);
    }
  };

  // =========================
  // PANTALLA USUARIOS
  // =========================

  if (logueado && pantalla === "usuarios") {
    return (
      <div style={{ padding: "30px" }}>
        <h1>👥 Administración de Usuarios</h1>

        <button
          onClick={() => setPantalla("inicio")}
        >
          ⬅ Volver
        </button>

        <hr />

        <h3>Nuevo Usuario</h3>

        <input
          type="text"
          placeholder="Nombre"
          value={nombreNuevo}
          onChange={(e) =>
            setNombreNuevo(e.target.value)
          }
          style={{
            padding: "10px",
            width: "300px",
          }}
        />

        <br /><br />

        <input
          type="text"
          placeholder="Rol"
          value={rolNuevo}
          onChange={(e) =>
            setRolNuevo(e.target.value)
          }
          style={{
            padding: "10px",
            width: "300px",
          }}
        />

        <br /><br />

        <button onClick={guardarUsuario}>
          Guardar Usuario
        </button>

        <hr />

        <h3>Usuarios Registrados</h3>

        {usuarios.map((usuario) => (
          <div
            key={usuario.id}
            style={{
              border: "1px solid #ccc",
              padding: "15px",
              marginBottom: "10px",
              borderRadius: "5px",
            }}
          >
          <strong>{usuario.nombre}</strong>
<br />
{usuario.rol}

<br /><br />

<button
  onClick={() => eliminarUsuario(usuario.id)}
>
  🗑️ Eliminar
</button>
          </div>
        ))}
      </div>
    );
  }

  // =========================
  // PANTALLA AVISOS
  // =========================

  if (logueado && pantalla === "avisos") {
    return (
      <div style={{ padding: "30px" }}>
        <h1>📢 Avisos Institucionales</h1>

        <button
          onClick={() => setPantalla("inicio")}
        >
          ⬅ Volver
        </button>

        <hr />

        <h3>Nuevo Aviso</h3>

        <input
          type="text"
          placeholder="Título"
          value={tituloAviso}
          onChange={(e) =>
            setTituloAviso(e.target.value)
          }
          style={{
            padding: "10px",
            width: "400px",
          }}
        />

        <br /><br />

        <textarea
          rows="5"
          cols="60"
          placeholder="Contenido"
          value={contenidoAviso}
          onChange={(e) =>
            setContenidoAviso(e.target.value)
          }
        />

        <br /><br />

        <button onClick={guardarAviso}>
          Publicar Aviso
        </button>

        <hr />

        <h3>Avisos Publicados</h3>

        {avisos.map((aviso) => (
          <div
            key={aviso.id}
            style={{
              border: "1px solid #ccc",
              padding: "15px",
              marginBottom: "10px",
              borderRadius: "5px",
            }}
          >
          <strong>{aviso.titulo}</strong>

<br /><br />

{aviso.contenido}

<br /><br />

<button
  onClick={() => eliminarAviso(aviso.id)}
>
  🗑️ Eliminar
</button>
          </div>
        ))}
      </div>
    );
  }

  // =========================
  // MENU PRINCIPAL
  // =========================

  if (logueado) {
    return (
      <div style={{ padding: "30px" }}>
        <h1>🎓 Portal CETI</h1>

        <h2>Bienvenida Administradora</h2>

        <hr />

        <button
          onClick={() => {
            setPantalla("usuarios");
            cargarUsuarios();
          }}
        >
          👥 Usuarios
        </button>

        {" "}

        <button
          onClick={() => {
            setPantalla("avisos");
            cargarAvisos();
          }}
        >
          📢 Avisos
        </button>

        {" "}

        <button>
          💬 Mensajes
        </button>

        {" "}

        <button>
          📄 Informes
        </button>
      </div>
    );
  }

  // =========================
  // LOGIN
  // =========================

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#003b5c",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "10px",
          width: "350px",
        }}
      >
        <h1>Portal CETI</h1>

        <input
          type="email"
          placeholder="Correo"
          value={correo}
          onChange={(e) =>
            setCorreo(e.target.value)
          }
          style={{
            width: "100%",
            marginBottom: "10px",
            padding: "10px",
          }}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          style={{
            width: "100%",
            marginBottom: "10px",
            padding: "10px",
          }}
        />

        <button
          onClick={iniciarSesion}
          style={{
            width: "100%",
            padding: "10px",
          }}
        >
          Iniciar sesión
        </button>

        <p>{mensaje}</p>
      </div>
    </div>
  );
}

export default App;