import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from './idl';  // Asegúrate de que este archivo tenga el IDL del canister
import { Principal } from '@dfinity/principal';

// URL de tu canister de Motoko (reemplazar con tu canister ID y URL)
const canisterId = 'bw4dl-smaaa-aaaaa-qaacq-cai';  // ID del canister que será usado

// Crear el agente HTTP
const agent = new HttpAgent({
    host: 'http://127.0.0.1:4943',  // Cambia esto a tu URL de desarrollo o producción
});

// ⚠️ Deshabilitar verificación de certificados en desarrollo
if (process.env.DFX_NETWORK === "local") {
    agent.fetchRootKey().catch(err => {
        console.error("Error fetching root key:", err);
    });
}

// Crear el actor con el IDL del canister Motoko
const gameStore = Actor.createActor(idlFactory, {
    agent,
    canisterId,
});

// Variables para el carrito de compras
let carritoCompras = [];

document.addEventListener("DOMContentLoaded", () => {
    const inventario = document.getElementById("inventario");
    const carrito = document.getElementById("carrito");

    let carritoCompras = [];

    // Función para cargar juegos del canister
    async function cargarInventario() {
        try {
            console.log('Cargando inventario...');
            const juegos = await gameStore.getGames();
            console.log('Juegos cargados:', juegos);
            inventario.innerHTML = "";

            juegos.forEach((juego) => {
                const card = document.createElement("div");
                card.className = "game-card";

                const titulo = document.createElement("p");
                titulo.className = "game-title";
                titulo.textContent = juego.title;

                const precio = document.createElement("p");
                precio.className = "game-price";
                precio.textContent = `Precio: $${juego.price} MXN`;

                const descuento = document.createElement("p");
                descuento.className = "game-discount";
                descuento.textContent = `Descuento: ${juego.discount}%`;

                const stock = document.createElement("p"); 
                stock.className = "game-stock";
                stock.textContent = `Stock disponible: ${juego.stock}`;

                const buyButton = document.createElement("button");
                buyButton.className = "buy-button";
                buyButton.textContent = "Agregar al Carrito";
                buyButton.onclick = () => agregarAlCarrito(juego);

                const deleteButton = document.createElement("button");
                deleteButton.className = "delete-button";
                deleteButton.textContent = "Eliminar";
                deleteButton.onclick = () => eliminarJuego(juego.id);

                const editButton = document.createElement("button");
                editButton.className = "edit-button";
                editButton.textContent = "Editar";
                editButton.onclick = () => editarJuego(juego.id, juego);

                card.appendChild(titulo);
                card.appendChild(precio);
                card.appendChild(descuento);
                card.appendChild(stock);
                card.appendChild(buyButton);
                card.appendChild(deleteButton);
                card.appendChild(editButton);
                inventario.appendChild(card);
            });
        } catch (err) {
            console.error("Error al cargar juegos:", err);
        }
    }

    // Función para agregar un juego al carrito
    function agregarAlCarrito(juego) {
        if (juego.stock > 0) {
            console.log('Juego agregado al carrito:', juego);
            carritoCompras.push(juego);
            mostrarCarrito();
        } else {
            alert('Lo siento, este juego está agotado.');
        }
    }

    // Función para eliminar un juego del carrito
    function eliminarDelCarrito(index) {
        carritoCompras.splice(index, 1);
        mostrarCarrito();
    }

    // Función para mostrar el carrito
    function mostrarCarrito() {
        carrito.innerHTML = "";
        carritoCompras.forEach((juego, index) => {
            const li = document.createElement("li");
            li.textContent = `${juego.title} - $${juego.price} MXN`;

            const deleteButton = document.createElement("button");
            deleteButton.className = "delete-cart-button";
            deleteButton.textContent = "Eliminar";
            deleteButton.onclick = () => eliminarDelCarrito(index);

            li.appendChild(deleteButton);
            carrito.appendChild(li);
        });

        const totalCompra = calcularTotal();
        let totalElement = document.getElementById("totalCompra");
        if (!totalElement) {
            totalElement = document.createElement("div");
            totalElement.id = "totalCompra";
            totalElement.className = "total-compra";
            carrito.appendChild(totalElement);
        }
        totalElement.textContent = `Total: $${totalCompra.toFixed(2)} MXN`;
    }

    // Función para calcular el total
    function calcularTotal() {
        let total = 0;
        carritoCompras.forEach(juego => {
            const precio = Number(juego.price);
            const descuento = Number(juego.discount);
            const precioConDescuento = precio - (precio * descuento / 100);
            total += precioConDescuento;
        });
        return total;
    }

    // Función para eliminar un juego del inventario
    async function eliminarJuego(gameId) {
        try {
            console.log('Eliminando juego con ID:', gameId);
            const result = await gameStore.deleteGame(gameId);
            if (result) {
                console.log('Juego eliminado exitosamente.');
                cargarInventario(); // Recargar el inventario después de eliminar el juego
            } else {
                console.error('Error al eliminar el juego.');
            }
        } catch (err) {
            console.error("Error al eliminar juego:", err);
        }
    }

    async function editarJuego(gameId, juego) {
        const nuevoTitulo = prompt("Nuevo título:", juego.title);
        const nuevoPrecio = prompt("Nuevo precio:", juego.price);
        const nuevoDescuento = prompt("Nuevo descuento:", juego.discount);
        const nuevoStock = prompt("Nuevo stock:", juego.stock);
    
        if (nuevoTitulo && nuevoPrecio && nuevoDescuento && nuevoStock) {
            try {
                console.log('Editando juego:', { nuevoTitulo, nuevoPrecio, nuevoDescuento, nuevoStock });
                
                // Asegúrate de que los valores se conviertan adecuadamente
                const precioInt = BigInt(nuevoPrecio); // Si esperas un número grande
                const descuentoInt = BigInt(nuevoDescuento); // Si esperas un número grande
                const stockInt = parseInt(nuevoStock);
    
                const result = await gameStore.updateGame(
                    gameId,
                    nuevoTitulo,
                    precioInt,
                    descuentoInt,
                    stockInt
                );
    
                if (result) {
                    console.log('Juego actualizado exitosamente.');
                    cargarInventario(); // Recargar el inventario después de actualizar
                } else {
                    console.error('Error al actualizar el juego.');
                }
            } catch (err) {
                console.error("Error al editar juego:", err);
            }
        } else {
            alert("Edición cancelada. Asegúrate de llenar todos los campos.");
        }
    }

    // Función para finalizar la compra
    async function finalizarCompra() {
        console.log('Intentando finalizar compra...');
        if (carritoCompras.length === 0) {
            alert("Tu carrito está vacío.");
            return;
        }

        try {
            const userId = await getCurrentUserId();
            console.log('User ID:', userId);
            const checkoutResult = await gameStore.checkout(userId);
            console.log('Resultado de compra:', checkoutResult);

            if (checkoutResult) {
                alert("Compra realizada con éxito!");
                carritoCompras = [];
                mostrarCarrito();
            } else {
                alert("Hubo un error al realizar la compra.");
            }
        } catch (err) {
            console.error("Error al finalizar compra:", err);
        }
    }

    // Obtener el ID del usuario actual
    async function getCurrentUserId() {
        let userId = localStorage.getItem("currentUserId"); // Intenta obtener el ID de localStorage
        
        // Si no existe, solicita al usuario o asigna un ID de prueba
        if (!userId) {
            userId = prompt("Por favor, ingresa tu ID de usuario (Principal):");
            
            // Validar el formato del ID
            if (!/^[a-z0-9\-]+$/i.test(userId)) {
                throw new Error("ID de usuario no válido. Asegúrate de que no tenga caracteres especiales como '_'.");
            }
    
            localStorage.setItem("currentUserId", userId);
        }
    
        // Convertir el ID a Principal
        return Principal.fromText(userId);
    }

    // Asignar la función de agregar juego al botón
    const agregarJuegoBtn = document.getElementById("agregarJuegoBtn");
    if (agregarJuegoBtn) {
        agregarJuegoBtn.addEventListener("click", async () => {
            console.log('Intentando agregar juego...');
            const titulo = document.getElementById("tituloJuego").value;
            const precio = parseInt(document.getElementById("precioJuego").value);
            const descuento = parseInt(document.getElementById("descuentoJuego").value || 0); 
            const stock = parseInt(document.getElementById("cantidadJuego").value || 10);  // Corregido "stockJuego"

            if (titulo && precio) {
                try {
                    await gameStore.addGame(titulo, precio, descuento, stock);
                    cargarInventario();
                } catch (err) {
                    console.error('Error al agregar juego:', err);
                }
            } else {
                alert('Por favor, llena todos los campos.');
            }
        });
    }

    // Asignar la función de finalizar compra al botón
    const finalizarCompraBtn = document.getElementById("finalizarCompraBtn");
    if (finalizarCompraBtn) {
        finalizarCompraBtn.addEventListener("click", finalizarCompra);
    }

    // Cargar el inventario al inicio
    cargarInventario();

    // Función para registrar un nuevo usuario
    function registrarse() {
        const nuevoUsuario = prompt("Ingresa un ID de usuario (Principal):");

        if (!nuevoUsuario || !/^[a-z0-9\-]+$/i.test(nuevoUsuario)) {
            alert("ID de usuario no válido. Asegúrate de no usar caracteres especiales como '_'.");
            return;
        }

        localStorage.setItem("currentUserId", nuevoUsuario);
        alert(`Usuario registrado con éxito: ${nuevoUsuario}`);
        mostrarUsuarioActual();
    }

    // Función para iniciar sesión con un usuario existente
    function iniciarSesion() {
        const usuarioId = prompt("Ingresa tu ID de usuario (Principal) para iniciar sesión:");

        if (!usuarioId || !/^[a-z0-9\-]+$/i.test(usuarioId)) {
            alert("ID de usuario no válido. Asegúrate de no usar caracteres especiales como '_'.");
            return;
        }

        localStorage.setItem("currentUserId", usuarioId);
        alert(`¡Bienvenido, ${usuarioId}! Has iniciado sesión.`);
        mostrarUsuarioActual();
    }

    // Función para cerrar sesión
    function cerrarSesion() {
        localStorage.removeItem("currentUserId");
        alert("Has cerrado sesión.");
        mostrarUsuarioActual();
    }

    // Mostrar el usuario actual si está logueado
    function mostrarUsuarioActual() {
        const usuarioActual = localStorage.getItem("currentUserId");
        const usuarioDiv = document.getElementById("usuario-actual");

        if (usuarioActual) {
            usuarioDiv.textContent = `Usuario actual: ${usuarioActual}`;
        } else {
            usuarioDiv.textContent = "No has iniciado sesión.";
        }
    }

    // Ejecutar al cargar la página
    document.addEventListener("DOMContentLoaded", mostrarUsuarioActual);
});