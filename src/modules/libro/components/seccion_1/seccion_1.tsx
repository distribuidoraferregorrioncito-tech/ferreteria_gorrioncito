import { useState } from "react";
import style from "./seccion_1.module.css";
import { supabase } from "./../../../../lib/supabase";

const Seccion_1 = () => {
  const [tipoDoc, setTipoDoc] = useState<"DNI" | "CE">("DNI");
  const [tipoReclamo, setTipoReclamo] = useState<"Reclamo" | "Queja">("Reclamo");

  const [form, setForm] = useState({
    email: "",
    nombres: "",
    domicilio: "",
    documento: "",
    telefono: "",
    detalle: "",
  });

  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "documento") {
      const maxLen = tipoDoc === "DNI" ? 8 : 9;
      if (!/^\d*$/.test(value)) return;
      if (value.length > maxLen) return;
    }

    if (name === "telefono") {
      if (!/^\d*$/.test(value)) return;
      if (value.length > 9) return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTipoDoc = (tipo: "DNI" | "CE") => {
    setTipoDoc(tipo);
    setForm((prev) => ({ ...prev, documento: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validaciones
    if (
      !form.email ||
      !form.nombres ||
      !form.domicilio ||
      !form.documento ||
      !form.telefono ||
      !form.detalle
    ) {
      setError("Por favor complete todos los campos obligatorios.");
      return;
    }
    if (tipoDoc === "DNI" && form.documento.length !== 8) {
      setError("El DNI debe tener exactamente 8 dígitos.");
      return;
    }
    if (tipoDoc === "CE" && form.documento.length !== 9) {
      setError("El CE debe tener exactamente 9 dígitos.");
      return;
    }
    if (form.telefono.length !== 9) {
      setError("El teléfono debe tener exactamente 9 dígitos.");
      return;
    }

    setCargando(true);

    // Insert directo a Supabase — tabla libro_reclamaciones
    const { error: sbError } = await supabase
      .from("libro_reclamaciones")
      .insert([
        {
          lbrclms_email: form.email,
          lbrclms_nombres_apellidos: form.nombres,
          lbrclms_domicilio: form.domicilio,
          lbrclms_dni_ce: tipoDoc === "DNI",      // true = DNI / false = CE
          lbrclms_dni: tipoDoc === "DNI" ? form.documento : null,
          lbrclms_ce: tipoDoc === "CE" ? form.documento : null,
          lbrclms_telefono: form.telefono,
          lbrclms_recl_quej_detall: `[${tipoReclamo}] ${form.detalle}`,
        },
      ]);

    setCargando(false);

    if (sbError) {
      setError(`Error al guardar: ${sbError.message}`);
      return;
    }

    setEnviado(true);
  };

  const resetForm = () => {
    setEnviado(false);
    setError("");
    setForm({
      email: "",
      nombres: "",
      domicilio: "",
      documento: "",
      telefono: "",
      detalle: "",
    });
    setTipoDoc("DNI");
    setTipoReclamo("Reclamo");
  };

  // ── Pantalla de confirmación ──
  if (enviado) {
    return (
      <section className={style.main}>
        <div className={style.formulario}>
          <div className={style.titulo}>
            <h1>
              <b>
                LIBRO DE <br />
                RECLAMACIONES
                <br />- FERRETERIA GORRIONCITO
              </b>
            </h1>
          </div>
          <div
            className={style.formulario1}
            style={{ padding: "30px 10px", textAlign: "center" }}
          >
            <p style={{ color: "#16c5d8", fontWeight: "bold", fontSize: "18px" }}>
              ✓ Su reclamo fue enviado correctamente.
            </p>
            <p>Recibirá una respuesta en un plazo máximo de 30 días calendario.</p>
            <button
              className={style.enviar}
              style={{ marginTop: "20px" }}
              onClick={resetForm}
            >
              Nuevo Reclamo
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ── Formulario ──
  return (
    <section className={style.main}>
      <div className={style.formulario}>
        <div className={style.titulo}>
          <h1>
            <b>
              LIBRO DE <br />
              RECLAMACIONES <br />- FERRETERIA GORRIONCITO
            </b>
          </h1>
        </div>

        <form onSubmit={handleSubmit} className={style.formulario1}>
          {/* ── Sección 1 ── */}
          <span>1. Identificador del Consumidor Reclamante</span>

          <p>Dirección de correo electrónico: *</p>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="ejemplo@correo.com"
          />

          <p>Nombres y Apellidos: *</p>
          <input
            type="text"
            name="nombres"
            value={form.nombres}
            onChange={handleChange}
          />

          <p>Domicilio: *</p>
          <input
            type="text"
            name="domicilio"
            value={form.domicilio}
            onChange={handleChange}
          />

          <p>Tipo de Documento de Identidad: *</p>
          <div className={style.opciones}>
            <label className={style.radioCustom}>
              <input
                type="radio"
                name="tipoDoc"
                checked={tipoDoc === "DNI"}
                onChange={() => handleTipoDoc("DNI")}
              />
              <span className={style.circulo}></span>
              DNI
            </label>
            <label className={style.radioCustom}>
              <input
                type="radio"
                name="tipoDoc"
                checked={tipoDoc === "CE"}
                onChange={() => handleTipoDoc("CE")}
              />
              <span className={style.circulo}></span>
              CE
            </label>
          </div>

          <p>
            {tipoDoc}: *{" "}
            <small style={{ color: "#888" }}>
              ({tipoDoc === "DNI" ? "8 dígitos" : "9 dígitos"})
            </small>
          </p>
          <input
            type="text"
            name="documento"
            value={form.documento}
            onChange={handleChange}
            maxLength={tipoDoc === "DNI" ? 8 : 9}
            inputMode="numeric"
            placeholder={tipoDoc === "DNI" ? "12345678" : "123456789"}
          />

          <p>
            Teléfono: *{" "}
            <small style={{ color: "#888" }}>(9 dígitos)</small>
          </p>
          <input
            type="text"
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
            maxLength={9}
            inputMode="numeric"
            placeholder="987654321"
          />

          {/* ── Sección 2 ── */}
          <span>2. Detalle de la Reclamación y Pedido del consumidor</span>

          <p>¿Es un reclamo o queja? *</p>
          <div className={style.opciones}>
            <label className={style.radioCustom}>
              <input
                type="radio"
                name="tipoReclamo"
                checked={tipoReclamo === "Reclamo"}
                onChange={() => setTipoReclamo("Reclamo")}
              />
              <span className={style.circulo}></span>
              Reclamo
            </label>
            <label className={style.radioCustom}>
              <input
                type="radio"
                name="tipoReclamo"
                checked={tipoReclamo === "Queja"}
                onChange={() => setTipoReclamo("Queja")}
              />
              <span className={style.circulo}></span>
              Queja
            </label>
          </div>

          <p>Detalle: *</p>
          <textarea
            name="detalle"
            value={form.detalle}
            onChange={handleChange}
            rows={4}
            style={{
              width: "100%",
              resize: "vertical",
              backgroundColor: "white",
              borderTop: "2px solid #8f8f8f",
              borderLeft: "2px solid #8f8f8f",
              borderRight: "1px solid #d9d9d9",
              borderBottom: "1px solid #d9d9d9",
              boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.25)",
              padding: "6px 8px",
              outline: "none",
              fontFamily: "inherit",
              color: "#585656",
            }}
          />

          {error && (
            <p style={{ color: "red", fontWeight: "bold", marginTop: "8px" }}>
              ⚠ {error}
            </p>
          )}

          <div><br /></div>
          <p>(*) Campos obligatorios</p>
          <p>
            *La formulación del reclamo no impide acudir a otras vías de
            solución de controversias ni es requisito previo para interponer una
            denuncia ante el INDECOPI.
          </p>
          <br />
          <p>
            *El proveedor deberá dar respuesta al reclamo en un plazo no mayor a
            treinta (30) días calendario, pudiendo ampliar el plazo hasta por
            treinta (30) días más, previa comunicación al consumidor.
          </p>
          <br />

          <button
            type="submit"
            className={style.enviar}
            disabled={cargando}
            style={{
              opacity: cargando ? 0.6 : 1,
              cursor: cargando ? "not-allowed" : "pointer",
            }}
          >
            {cargando ? "ENVIANDO..." : "ENVIAR"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default Seccion_1;