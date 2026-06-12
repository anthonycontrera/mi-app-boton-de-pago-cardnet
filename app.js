const products = [
  { id: 1, name: "Mouse", price: 500 },
  { id: 2, name: "Teclado", price: 1500 },
  { id: 3, name: "Bocina", price: 5000 },
  { id: 4, name: "Teclado", price: 10000 },
  { id: 5, name: "Monitor", price: 15000 },
   { id: 6, name: "impresora", price: 30000 },
    { id: 7, name: "PC", price:45000 }
];

let cart = [];

function renderProducts() {
  const container = document.getElementById("products");

  container.innerHTML = products.map(p => `
    <div>
      <h3>${p.name}</h3>
      <p>RD$ ${p.price}</p>
      <button type="button" onclick="addToCart(${p.id})">Agregar</button>
    </div>
  `).join("");
}

function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  cart.push(product);
  renderCart();
}

function renderCart() {
  const cartDiv = document.getElementById("cartItems");
  const totalSpan = document.getElementById("total");

  cartDiv.innerHTML = cart.map(p => `
    <p>${p.name} - RD$ ${p.price}</p>
  `).join("");

  const total = cart.reduce((sum, p) => sum + p.price, 0);
  totalSpan.innerText = total;
}

async function payWithCardnet() {
  const total = cart.reduce((sum, p) => sum + p.price, 0);

  if (total <= 0) {
    alert("Debes agregar un producto al carrito.");
    return;
  }

  try {
    const response = await fetch("/create-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: total * 100
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      alert("Error creando sesión CardNET.");
      return;
    }

    if (!data.session || !data.cardnetPostUrl) {
      console.error(data);
      alert("Respuesta inválida del servidor.");
      return;
    }

    const form = document.createElement("form");
    form.method = "POST";
    form.action = data.cardnetPostUrl;

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "SESSION";
    input.value = data.session;

    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();

  } catch (error) {
    console.error(error);
    alert("Error conectando con el servidor.");
  }
}

function showPaymentMessage() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("status");
  const codigo = params.get("codigo");
  const orden = params.get("orden");
  const descripcion = params.get("descripcion");

  const messageBox = document.getElementById("paymentMessage");

  if (!messageBox || !status) return;

  if (status === "approved") {
    messageBox.innerHTML = `
      <div class="message success">
        ✅ Pago aprobado<br>
        <small>Orden: ${orden || "N/A"} | Código: ${codigo || "00"}</small>
      </div>
    `;
  }

  if (status === "failed") {
    messageBox.innerHTML = `
      <div class="message error">
        ❌ Pago rechazado<br>
        <small>Orden: ${orden || "N/A"} | Código: ${codigo || "N/A"} - ${descripcion || ""}</small>
      </div>
    `;
  }
}

renderProducts();
renderCart();
showPaymentMessage();