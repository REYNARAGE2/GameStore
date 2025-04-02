import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Nat8 "mo:base/Nat8";
import Nat32 "mo:base/Nat32";
import Debug "mo:base/Debug";

actor GameStore {
  type UserId = Principal;
  type GameId = Nat;

  public type Game = {
    id: GameId;
    title: Text;
    price: Nat;
    discount: Nat;
    stock: Nat;
  };

  public type User = {
    id: UserId;
    name: Text;
    email: Text;
    password: Text;
    cart: [GameId];  // Lista estática de GameId
    purchaseHistory: [GameId];  // Lista estática de GameId
  };

  stable var nextGameId: GameId = 1;

  func hashPrincipal(p: Principal): Nat32 {
    let blob = Principal.toBlob(p);
    let blobArray = Blob.toArray(blob);
    let size = Array.size(blobArray);
    var acc: Nat32 = 0;
    for (i in Iter.range(0, size - 1)) {
      if (i < size) {
        acc := acc * 31 + Nat32.fromNat(Nat8.toNat(blobArray[i]));
      };
    };
    acc
  };

  let users = HashMap.HashMap<UserId, User>(10, func (u1, u2) { u1 == u2 }, func (id: UserId) { hashPrincipal(id) });
  let games = HashMap.HashMap<GameId, Game>(10, func (g1, g2) { g1 == g2 }, func (id) { Nat32.fromNat(id) });

  // 📌 Función para registrar usuario
  public func register(name: Text, email: Text, password: Text): async ?UserId {
    let caller = Principal.fromActor(GameStore);
    Debug.print("Intentando registrar usuario con Principal: " # Principal.toText(caller));

    // Verificar si el usuario ya existe
    switch (users.get(caller)) {
      case (null) {
        let newUser: User = {
          id = caller;
          name = name;
          email = email;
          password = password;
          cart = [];  // Inicialización con una lista vacía
          purchaseHistory = [];  // Inicialización con una lista vacía
        };
        users.put(caller, newUser);
        Debug.print("Usuario registrado exitosamente.");
        return ?caller;
      };
      case (_) {
        Debug.print("Registro fallido. El usuario ya existe.");
        return null;
      };
    };
  };

  //Función para iniciar sesión
  public func login(email: Text, password: Text): async ?UserId {
    let caller = Principal.fromActor(GameStore);

    for ((_, user) in users.entries()) {  // Cambiado a users.entries() directamente
      if (user.email == email and user.password == password) {
        Debug.print("Inicio de sesión exitoso para: " # user.name);
        return ?user.id;
      };
    };

    Debug.print("Fallo en el inicio de sesión. Credenciales incorrectas.");
    return null;
  };

  // 📌 Función para cerrar sesión
  public func logout(): async Bool {
    let caller = Principal.fromActor(GameStore);

    switch (users.get(caller)) {
      case (?_) {
        Debug.print("Cierre de sesión exitoso para Principal: " # Principal.toText(caller));
        return true;
      };
      case null {
        Debug.print("No hay sesión activa para cerrar.");
        return false;
      };
    };
  };

  // 📌 Función para finalizar compra
  public func finalizarCompra(): async Bool {
    let caller = Principal.fromActor(GameStore);
    
    // Verificar si el usuario tiene un carrito con juegos
    switch (users.get(caller)) {
      case (?user) {
        if (Array.size(user.cart) == 0) {
          Debug.print("El carrito está vacío. No se puede finalizar la compra.");
          return false;
        };
        
        // Procesar cada juego en el carrito
        for (gameId in user.cart) {
          switch (games.get(gameId)) {
            case (?game) {
              if (game.stock > 0) {
                // Reducir el stock del juego
                let updatedGame = game;
                updatedGame.stock := game.stock - 1;
                games.put(gameId, updatedGame);
                
                // Agregar el juego al historial de compras del usuario
                user.purchaseHistory := Array.append(user.purchaseHistory, [gameId]);
              } else {
                Debug.print("No hay suficiente stock para el juego: " # game.title);
                return false;
              };
            };
            case null {
              Debug.print("Juego no encontrado para el ID: " # Nat.toText(gameId));
              return false;
            };
          };
        };
        
        // Vaciar el carrito
        user.cart := [];  // Vaciar el carrito
        users.put(caller, user);
        Debug.print("Compra finalizada con éxito.");
        return true;
      };
      case null {
        Debug.print("El usuario no está registrado.");
        return false;
      };
    };
  };

  // Obtener información del usuario actual
  public query func getUserInfo(userId: UserId): async ?User {
    users.get(userId)
  };

  // Obtener todos los usuarios registrados (para depuración)
  public query func getAllUsers(): async [User] {
    Iter.toArray(users.vals())
  };
};