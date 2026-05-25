import { ChangeEvent, useState } from "react";
import style from "./NavBarCotizar.module.css";
import { supabase } from "../../../../lib/supabase";
import { images } from "../../../../assets/img";
import { icon } from "../../../../core/icons";

// ─── Types ────────────────────────────────────────────────────────────────────

type DistritoItem = { nombre: string };
type ProvinciaItem = { nombre: string; distritos: DistritoItem[] };
type DepartamentoItem = { nombre: string; provincias: ProvinciaItem[] };

// ─── Constants ────────────────────────────────────────────────────────────────

const TIPOS_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];

const PESO_MAXIMO = 10 * 1024 * 1024; // 10 MB

const ubicaciones: DepartamentoItem[] = [
  {
    nombre: "Junín",
    provincias: [
      {
        nombre: "Huancayo",
        distritos: [
          { nombre: "Huancayo" }, { nombre: "Carhuacallanga" }, { nombre: "Chacapampa" },
          { nombre: "Chicche" }, { nombre: "Chilca" }, { nombre: "Chongos Alto" },
          { nombre: "Chupuro" }, { nombre: "Colca" }, { nombre: "Cullhuas" },
          { nombre: "El Tambo" }, { nombre: "Huacrapuquio" }, { nombre: "Hualhuas" },
          { nombre: "Huancán" }, { nombre: "Huasicancha" }, { nombre: "Huayucachi" },
          { nombre: "Ingenio" }, { nombre: "Pariahuanca" }, { nombre: "Pilcomayo" },
          { nombre: "Pucará" }, { nombre: "Quichuay" }, { nombre: "Quilcas" },
          { nombre: "San Agustín" }, { nombre: "San Jerónimo de Tunán" }, { nombre: "Saño" },
          { nombre: "Sapallanga" }, { nombre: "Sicaya" },
          { nombre: "Santo Domingo de Acobamba" }, { nombre: "Viques" },
        ],
      },
      {
        nombre: "Concepción",
        distritos: [
          { nombre: "Concepción" }, { nombre: "Aco" }, { nombre: "Andamarca" },
          { nombre: "Chambará" }, { nombre: "Cochas" }, { nombre: "Comas" },
          { nombre: "Heroinas Toledo" }, { nombre: "Manzanares" },
          { nombre: "Mariscal Castilla" }, { nombre: "Matahuasi" }, { nombre: "Mito" },
          { nombre: "Nueve de Julio" }, { nombre: "Orcotuna" },
          { nombre: "Santa Rosa de Ocopa" },
        ],
      },
      {
        nombre: "Chanchamayo",
        distritos: [
          { nombre: "La Merced" }, { nombre: "Perene" }, { nombre: "Pichanaqui" },
          { nombre: "San Luis de Shuaro" }, { nombre: "San Ramón" }, { nombre: "Vitoc" },
        ],
      },
      {
        nombre: "Jauja",
        distritos: [
          { nombre: "Acolla" }, { nombre: "Apata" }, { nombre: "Ataura" },
          { nombre: "Canchayllo" }, { nombre: "Curicaca" }, { nombre: "El Mantaro" },
          { nombre: "Huamalí" }, { nombre: "Huaripampa" }, { nombre: "Huertas" },
          { nombre: "Janjaillo" }, { nombre: "Julcán" }, { nombre: "Leonor Ordóñez" },
          { nombre: "Llocllapampa" }, { nombre: "Marco" }, { nombre: "Masma" },
          { nombre: "Masma Chicche" }, { nombre: "Molinos" }, { nombre: "Monobamba" },
          { nombre: "Muqui" }, { nombre: "Muquiyauyo" }, { nombre: "Paca" },
          { nombre: "Paccha" }, { nombre: "Pancán" }, { nombre: "Parco" },
          { nombre: "Pomacancha" }, { nombre: "Ricrán" }, { nombre: "San Lorenzo" },
          { nombre: "San Pedro de Chunán" }, { nombre: "Sausa" }, { nombre: "Sincos" },
          { nombre: "Tunan Marca" }, { nombre: "Yauli" }, { nombre: "Yauyos" },
        ],
      },
      {
        nombre: "Junín",
        distritos: [
          { nombre: "Junín" }, { nombre: "Carhuamayo" },
          { nombre: "Ondores" }, { nombre: "Ulcumayo" },
        ],
      },
      {
        nombre: "Satipo",
        distritos: [
          { nombre: "Satipo" }, { nombre: "Coviriali" }, { nombre: "Llaylla" },
          { nombre: "Mazamari" }, { nombre: "Pampa Hermosa" }, { nombre: "Pangoa" },
          { nombre: "Río Negro" }, { nombre: "Río Tambo" }, { nombre: "Vizcatán del Ene" },
        ],
      },
      {
        nombre: "Tarma",
        distritos: [
          { nombre: "Tarma" }, { nombre: "Acobamba" }, { nombre: "Huaricolca" },
          { nombre: "Huasahuasi" }, { nombre: "La Unión" }, { nombre: "Palca" },
          { nombre: "Palcamayo" }, { nombre: "San Pedro de Cajas" }, { nombre: "Tapo" },
        ],
      },
      {
        nombre: "Yauli",
        distritos: [
          { nombre: "La Oroya" }, { nombre: "Chacapalpa" }, { nombre: "Huay-Huay" },
          { nombre: "Marcapomacocha" }, { nombre: "Morococha" }, { nombre: "Paccha" },
          { nombre: "Santa Bárbara de Carhuacayan" }, { nombre: "Santa Rosa de Sacco" },
          { nombre: "Suitucancha" }, { nombre: "Yauli" },
        ],
      },
      {
        nombre: "Chupaca",
        distritos: [
          { nombre: "Chupaca" }, { nombre: "Ahuac" }, { nombre: "Chongos Bajo" },
          { nombre: "Huáchac" }, { nombre: "Huamancaca Chico" },
          { nombre: "San Juan de Iscos" }, { nombre: "San Juan de Jarpa" },
          { nombre: "Tres de Diciembre" }, { nombre: "Yanacancha" },
        ],
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function subirArchivoCotizacion(file: File): Promise<string | null> {
  const extension = file.name.split(".").pop() ?? "bin";
  const nombreUnico = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  const { error } = await supabase.storage
    .from("cotizaciones")
    .upload(nombreUnico, file, { cacheControl: "3600", upsert: false });

  if (error) {
    console.error("Error al subir archivo:", error.message);
    return null;
  }

  const { data } = supabase.storage.from("cotizaciones").getPublicUrl(nombreUnico);
  return data.publicUrl;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NavBarCotizar() {
  const whatsappNumber = "51931389001";

  const [mostrarModal, setMostrarModal]       = useState(false);
  const [mostrarUbicacion, setMostrarUbicacion] = useState(false);

  // Archivo
  const [archivoNombre, setArchivoNombre]     = useState("");
  const [archivoUrl, setArchivoUrl]           = useState<string | null>(null);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const [errorArchivo, setErrorArchivo]       = useState("");

  // Formulario
  const [rucDni, setRucDni]         = useState("");
  const [materiales, setMateriales] = useState("");
  const [referencia, setReferencia] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [provincia, setProvincia]   = useState("");
  const [distrito, setDistrito]     = useState("");

  // ── Ubicación ─────────────────────────────────────────────────────────────

  const departamentoActivo =
    ubicaciones.find((item) => item.nombre === departamento) ?? ubicaciones[0];
  const provinciasDisponibles = departamentoActivo.provincias;
  const provinciaActiva = provincia
    ? provinciasDisponibles.find((item) => item.nombre === provincia) ??
      provinciasDisponibles[0]
    : undefined;
  const distritosDisponibles = provinciaActiva?.distritos ?? [];
  const ubicacionSeleccionada =
    departamento && distrito && provincia
      ? `${departamento}, ${provincia}, ${distrito}`
      : "Seleccionar Ubicacion";

  const cambiarDepartamento = (event: ChangeEvent<HTMLSelectElement>) => {
    const dep =
      ubicaciones.find((item) => item.nombre === event.target.value) ?? ubicaciones[0];
    const prov = dep.provincias[0];
    setDepartamento(event.target.value);
    setProvincia(prov.nombre);
    setDistrito(prov.distritos[0].nombre);
  };

  const cambiarProvincia = (event: ChangeEvent<HTMLSelectElement>) => {
    const prov =
      provinciasDisponibles.find((item) => item.nombre === event.target.value) ??
      provinciasDisponibles[0];
    setProvincia(event.target.value);
    setDistrito(prov.distritos[0]?.nombre ?? "");
  };

  // ── Archivo ───────────────────────────────────────────────────────────────

  const handleArchivo = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      setErrorArchivo("Solo se permiten imágenes, PDF, Excel o .txt");
      setArchivoNombre("");
      setArchivoUrl(null);
      return;
    }
    if (file.size > PESO_MAXIMO) {
      setErrorArchivo("El archivo no puede superar los 10 MB");
      setArchivoNombre("");
      setArchivoUrl(null);
      return;
    }

    setErrorArchivo("");
    setArchivoNombre(file.name);
    setArchivoUrl(null);
    setSubiendoArchivo(true);

    const url = await subirArchivoCotizacion(file);
    setSubiendoArchivo(false);

    if (!url) {
      setErrorArchivo("Error al subir el archivo. Intenta de nuevo.");
      setArchivoNombre("");
      return;
    }
    setArchivoUrl(url);
  };

  // ── Modal ─────────────────────────────────────────────────────────────────

  const resetArchivo = () => {
    setArchivoNombre("");
    setArchivoUrl(null);
    setErrorArchivo("");
    setSubiendoArchivo(false);
  };

  const abrir = () => {
    setMostrarModal(true);
    setMostrarUbicacion(false);
    resetArchivo();
  };

  const cerrar = () => {
    setMostrarModal(false);
    setMostrarUbicacion(false);
    resetArchivo();
    setRucDni("");
    setMateriales("");
    setReferencia("");
    setDepartamento("");
    setProvincia("");
    setDistrito("");
  };

  // ── WhatsApp ──────────────────────────────────────────────────────────────

  const cotizarPorWhatsapp = () => {
    const documento = rucDni.trim();

    if (!documento) {
      window.alert("Ingresa tu DNI o RUC para continuar.");
      return;
    }
    if (documento.length !== 8 && documento.length !== 11) {
      window.alert("El DNI debe tener 8 dígitos y el RUC 11 dígitos.");
      return;
    }
    if (subiendoArchivo) {
      window.alert("Espera a que termine de subir el archivo.");
      return;
    }

    const mensaje = [
      `DNI/RUC: ${documento}`,
      `UBICACION: ${
        departamento && provincia && distrito
          ? `${departamento}-${provincia}-${distrito}`
          : "-"
      }`,
      `REFERENCIA: ${referencia.trim() || "-"}`,
      `MATERIALES: ${materiales.trim() || "-"}`,
      archivoUrl
        ? `ARCHIVO ADJUNTO: ${archivoUrl}`
        : `LISTA ADJUNTADA: No adjuntó archivo`,
    ].join("\n\n");

    window.open(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(mensaje)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <button type="button" className={style.quoteButton} onClick={abrir}>
        Cotizar
      </button>

      {mostrarModal && (
        <div className={style.quoteOverlay} onClick={cerrar}>
          <div className={style.quoteModal} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={style.quoteClose}
              onClick={cerrar}
              aria-label="Cerrar cotizacion"
            >
              ×
            </button>

            <div className={style.quoteHeader}>
              <img
                src={images.logoGorrion}
                alt="Logo Gorrioncito"
                className={style.quoteLogo}
              />
              <div className={style.nameCompany}>
                <h3><b>Gorrioncito</b></h3>
                <p>Dstribuidora y Ferreteria</p>
              </div>
            </div>

            <p className={style.quoteIntro}>
              Completa tus datos y te ayudamos a cotizar más rápido.
            </p>

            <div className={style.inputWrap}>
              <p>{icon.iconDni({ className: style.ubicacionIcon })}</p>
              <input
                type="text"
                placeholder="RUC/DNI"
                className={style.quoteInput}
                value={rucDni}
                onChange={(e) => {
                  const soloNumeros = e.target.value.replace(/\D/g, "").slice(0, 11);
                  setRucDni(soloNumeros);
                }}
                inputMode="numeric"
                maxLength={11}
              />
            </div>

            <button
              type="button"
              className={style.selectTrigger}
              onClick={() => setMostrarUbicacion((prev) => !prev)}
            >
              {icon.iconUbicacion({ className: style.ubicacionIcon })}
              <span>{ubicacionSeleccionada}</span>
              {icon.iconArrowDown({ className: style.triggerArrow })}
            </button>

            {mostrarUbicacion && (
              <div className={style.selectPanel}>
                <div className={style.realSelectWrap}>
                  <select
                    className={style.realSelect}
                    value={departamento}
                    onChange={cambiarDepartamento}
                  >
                    <option value="">Departamento</option>
                    {ubicaciones.map((item) => (
                      <option key={item.nombre} value={item.nombre}>
                        {item.nombre}
                      </option>
                    ))}
                  </select>
                  {icon.iconArrowDown({ className: style.selectArrow })}
                </div>

                <div className={style.realSelectWrap}>
                  <select
                    className={style.realSelect}
                    value={provincia}
                    onChange={cambiarProvincia}
                  >
                    <option value="">Provincia</option>
                    {provinciasDisponibles.map((item) => (
                      <option key={item.nombre} value={item.nombre}>
                        {item.nombre}
                      </option>
                    ))}
                  </select>
                  {icon.iconArrowDown({ className: style.selectArrow })}
                </div>

                <div className={style.realSelectWrap}>
                  <select
                    className={style.realSelect}
                    value={distrito}
                    onChange={(e) => setDistrito(e.target.value)}
                  >
                    <option value="">Distrito</option>
                    {distritosDisponibles.map((item) => (
                      <option key={item.nombre} value={item.nombre}>
                        {item.nombre}
                      </option>
                    ))}
                  </select>
                  {icon.iconArrowDown({ className: style.selectArrow })}
                </div>

                <div className={style.referenciaBox}>
                  <div className={style.referenciaTitulo}>Referencia</div>
                  <textarea
                    className={style.referenciaInput}
                    placeholder="Escribe una referencia"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                  />
                </div>
              </div>
            )}

            <textarea
              className={style.quoteTextarea}
              placeholder="Escribe aquí tu lista de materiales..."
              value={materiales}
              onChange={(e) => setMateriales(e.target.value)}
            />

            <label
              className={style.uploadButton}
              style={{
                opacity: subiendoArchivo ? 0.6 : 1,
                cursor: subiendoArchivo ? "not-allowed" : "pointer",
              }}
            >
              <input
                type="file"
                className={style.fileInput}
                accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.xls,.xlsx,.txt"
                onChange={handleArchivo}
                disabled={subiendoArchivo}
              />
              {subiendoArchivo ? "Subiendo archivo..." : "Adjuntar lista (Opcional)"}
            </label>

            {errorArchivo && (
              <p style={{ color: "#e53e3e", fontSize: "0.8rem", marginTop: "4px" }}>
                ⚠ {errorArchivo}
              </p>
            )}
            {archivoNombre && !errorArchivo && (
              <p className={style.fileName}>
                {subiendoArchivo ? `⏳ Subiendo: ${archivoNombre}` : `✓ ${archivoNombre}`}
              </p>
            )}

            <button
              type="button"
              className={style.quoteSubmit}
              onClick={cotizarPorWhatsapp}
              disabled={subiendoArchivo}
            >
              <span>{icon.iconWhatsApp({ className: style.whatsappIcon })}</span>
              <span>Cotizar</span>
            </button>
            <p className={style.quotePhone}>o comunicate con el +51 915 144 663</p>
          </div>
        </div>
      )}
    </>
  );
}