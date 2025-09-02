import React from "react";
import "./UserProfile.css"; // Para los estilos, lo crearemos luego

const UserProfile = () => {
    const user = {
        name: "Juan Pérez",
        email: "juanperez@example.com",
        photo: null,
        orders: [
            { id: 1, product: "Botella de agua", price: 19.99 },
            { id: 2, product: "Botella de vino", price: 14.99 }
        ]
    };

    return (
        <div className="profile-container">
            <h1>Perfil de Usuario</h1>
            <div className="user-info">
                <div className="user-photo">
                    {user.photo ?(
                        <img src={user.photo} alt="Foto del usuario"/>
                    ) : (
                        <div className="photo-placeholder">👤</div>
                    )}
                </div>
                <p><strong>Nombre:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
            </div>
            <h2>Historial de Compras</h2>
            <ul>
                {user.orders.map((order) => (
                    <li key={order.id}>
                        {order.product} - ${order.price.toFixed(2)}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default UserProfile;
