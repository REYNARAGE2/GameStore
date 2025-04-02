export const idlFactory = ({ IDL }) => {
    return IDL.Service({
        // Obtener todos los juegos
        'getGames': IDL.Func([], [IDL.Vec(IDL.Record({
            id: IDL.Nat,  // Agregado para que también se pueda obtener el ID del juego
            title: IDL.Text,
            price: IDL.Nat,
            discount: IDL.Nat,
            stock: IDL.Nat
        }))], []),

        // Agregar un nuevo juego
        'addGame': IDL.Func([IDL.Text, IDL.Nat, IDL.Nat, IDL.Nat], [IDL.Nat], []),

        // Editar un juego existente
        'updateGame': IDL.Func([IDL.Nat, IDL.Text, IDL.Nat, IDL.Nat, IDL.Nat], [IDL.Bool], []),

        // Eliminar un juego
        'deleteGame': IDL.Func([IDL.Nat], [IDL.Bool], []),

        // Agregar un juego al carrito
        'addToCart': IDL.Func([IDL.Principal, IDL.Nat], [IDL.Bool], []),

        // Eliminar un juego del carrito
        'removeFromCart': IDL.Func([IDL.Principal, IDL.Nat], [IDL.Bool], []),

        // Finalizar la compra
        'checkout': IDL.Func([IDL.Principal], [IDL.Bool], []),
    });
};