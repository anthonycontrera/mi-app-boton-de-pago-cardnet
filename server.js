const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3001;

const CARDNET_SESSIONS_URL = "https://labservicios.cardnet.com.do/sessions";
const CARDNET_AUTHORIZE_URL = "https://labservicios.cardnet.com.do/authorize";

//const CARDNET_SESSIONS_URL = "https://lab.cardnet.com.do/sessions";
//const CARDNET_AUTHORIZE_URL = "https://lab.cardnet.com.do/authorize";

const BASE_URL = `http://localhost:${PORT}`;

const sessionStore = new Map();
let lastSession = null;

const responseCodes = {

  "00": "Aprobada",
  "01": "Llamar al Banco",
  "02": "Llamar al Banco",
  "03": "Comercio Invalido",
  "04": "Rechazada",
  "05": "Rechazada",
  "06": "Error en Mensaje",
  "07": "Tarjeta Rechazada",
  "08": "Llamar al Banco",
  "09": "Request in progress",
  "10": "Aprobación Parcial",
  "11": "Approved VIP",
  "12": "Transaccion Invalida",
  "13": "Monto Invalido",
  "14": "Cuenta Invalida",
  "15": "No such issuer",
  "16": "Approved update track 3",
  "17": "Customer cancellation",
  "18": "Customer dispute",
  "19": "Reintentar Transaccion",
  "20": "No tomo accion",
  "21": "No tomo acción",
  "22": "Transaccion No Aprobada",
  "23": "Transaccion No Aceptada",
  "24": "File update not supported",
  "25": "Unable to locate record",
  "26": "Duplicate record",
  "27": "File update edit error",
  "28": "File update file locked",
  "30": "File update failed",
  "31": "Bin no soportado",
  "32": "Tx. Completada Parcialmente",
  "33": "Tarjeta Expirada",
  "34": "Transacción No Aprobada",
  "35": "Transaccion No Aprobada",
  "36": "Transaccion No Aprobada",
  "37": "Transaccion No Aprobada",
  "38": "Transaccion No Aprobada",
  "39": "Tarjeta Invalida",
  "40": "Función no Soportada",
  "41": "Transacción No Aprobada",
  "42": "Cuenta Invalida",
  "43": "Transacción No Aprobada",
  "44": "No investment account",
  "51": "Fondos insuficientes",
  "52": "Cuenta Invalidad",
  "53": "Cuenta Invalidad",
  "54": "Tarjeta vencida",
  "56": "Cuenta Invalidad",
  "57": "Transaccion no permitida",
  "58": "Transaccion no permitida en terminal",
  "60": "Contactar Adquirente",
  "61": "Excedió Limite de Retiro",
  "62": "Tarjeta Restringida",
  "65": "Excedió Cantidad de Intento",
  "66": "Contactar Adquirente",
  "67": "Hard capture",
  "68": "Response received too late",
  "75": "Pin excedió Limite de Intentos",
  "77": "Captura de Lote Invalida",
  "78": "Intervención del Banco Requerida",
  "79": "Rechazada",
  "81": "Pin invalido",
  "82": "PIN Required",
  "85": "Llaves no disponibles",
  "89": "Terminal Invalida",
  "90": "Cierre en proceso",
  "91": "Host No Disponible",
  "92": "Error de Ruteo",
  "94": "Duplicate Transaction",
  "95": "Error de Reconciliación",
  "96": "Error de Sistema",
  "97": "Emisor no Disponible",
  "98": "Excede Limite de Efectivo",
  "99": "CVV or CVC Error response",
  "TF": "Solicitud de autenticación rechazada o no completada."

  //"00": "Aprobada",
  //"91": "Host No Disponible",
  //"96": "Error de Sistema",
  //"51": "Fondos insuficientes"
};

function getResponseDescription(code) {
  return responseCodes[code] || "Código de respuesta no identificado";
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(JSON.stringify(data));
}

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

function readBody(req) {
  return new Promise(resolve => {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => resolve(body));
  });
}

function serveFile(res, fileName, contentType) {
  const filePath = path.join(__dirname, fileName);

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    return res.end(`${fileName} no encontrado`);
  }

  const content = fs.readFileSync(filePath, "utf8");

  res.writeHead(200, { "Content-Type": contentType });
  res.end(content);
}

const server = http.createServer(async (req, res) => {

  // 🔹 Servir frontend (IMPORTANTE para query params)
  if (
    req.method === "GET" &&
    (req.url === "/" || req.url.startsWith("/index.html"))
  ) {
    return serveFile(res, "index.html", "text/html; charset=utf-8");
  }

  if (req.url === "/app.js") {
    return serveFile(res, "app.js", "application/javascript");
  }

  if (req.url === "/styles.css") {
    return serveFile(res, "styles.css", "text/css");
  }

  // 🔹 Crear sesión
  if (req.method === "POST" && req.url === "/create-session") {
    try {
      const body = JSON.parse(await readBody(req));

      const ordenId = String(Date.now()).slice(-10);
const transactionId = String(Date.now()).slice(-6);

const amount = Number(body.amount);

const payload = {
  TransactionType: "200",
  CurrencyCode: "214",
  AcquiringInstitutionCode: "349",
  MerchantType: "5812",
  MerchantNumber: "349011300",
  MerchantTerminal: "00988330",
  ReturnUrl: "https://mi-app-boton-de-pago-cardnet.onrender.com/resultado",
  CancelUrl: "https://mi-app-boton-de-pago-cardnet.onrender.com/resultado",
  PageLanguaje: "ESP",
  OrdenId: ordenId,
  TransactionId: transactionId,
  Tax: "0.00",
  MerchantName: "PRUEBA CARDNET",
  Amount: amount.toFixed(2),
  "3DS_email": "marianelsa442@hotmail.com",
  "3DS_mobilePhone": "8298062770"
};

      console.log("📤 REQUEST CARDNET:", payload);

      const r = await fetch(CARDNET_SESSIONS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await r.json();

      if (!data.SESSION || !data["session-key"]) {
        return sendJson(res, 500, data);
      }

      sessionStore.set(data.SESSION, {
        sessionKey: data["session-key"],
        ordenId,
        transactionId
      });

      lastSession = data.SESSION;

      return sendJson(res, 200, {
        session: data.SESSION,
        cardnetPostUrl: CARDNET_AUTHORIZE_URL
      });

    } catch (error) {
      return sendJson(res, 500, { error: error.message });
    }
  }

  // 🔹 Resultado
  if (req.url.startsWith("/resultado")) {
    try {
      const session = lastSession;
      const saved = sessionStore.get(session);

      if (!saved) {
        return redirect(res, "/index.html?status=failed&descripcion=No%20SESSION");
      }

      const resultUrl = `${CARDNET_SESSIONS_URL}/${session}?sk=${saved.sessionKey}`;
      console.log("🔎 CONSULTANDO:", resultUrl);

      const r = await fetch(resultUrl);
      const result = await r.json();

      console.log("📥 RESULTADO:", result);

      const responseCode = result.ResponseCode || "N/A";
      const description = getResponseDescription(responseCode);
      const orden = result.OrdenID || saved.ordenId;

      // 🔥 REDIRECCIÓN FINAL AL FRONT
      if (responseCode === "00") {
        return redirect(
          res,
          `/index.html?status=approved&orden=${encodeURIComponent(orden)}&codigo=${encodeURIComponent(responseCode)}`
        );
      }

      return redirect(
        res,
        `/index.html?status=failed&orden=${encodeURIComponent(orden)}&codigo=${encodeURIComponent(responseCode)}&descripcion=${encodeURIComponent(description)}`
      );

    } catch (error) {
      return redirect(
        res,
        `/index.html?status=failed&descripcion=${encodeURIComponent(error.message)}`
      );
    }
  }

  res.writeHead(404);
  res.end("Ruta no encontrada");
});

server.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
});