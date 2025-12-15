import React, { useState } from 'react';
import './ReservaModal.css';

function ReservaModal({ isOpen, onClose, item, tipo }) {
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        telefono: '',
        fecha: '',
        hora: '',
        checkIn: '',
        checkOut: '',
        personas: tipo === 'restaurante' ? 2 : 1,
        comentarios: ''
    });

    const [showSuccess, setShowSuccess] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: ''
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'El email es requerido';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email inválido';
        }

        if (!formData.telefono.trim()) {
            newErrors.telefono = 'El teléfono es requerido';
        }

        if (tipo === 'restaurante') {
            if (!formData.fecha) {
                newErrors.fecha = 'La fecha es requerida';
            }
            if (!formData.hora) {
                newErrors.hora = 'La hora es requerida';
            }
        } else {
            if (!formData.checkIn) {
                newErrors.checkIn = 'El check-in es requerido';
            }
            if (!formData.checkOut) {
                newErrors.checkOut = 'El check-out es requerido';
            }
            if (formData.checkIn && formData.checkOut && formData.checkIn >= formData.checkOut) {
                newErrors.checkOut = 'El check-out debe ser posterior al check-in';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Guardar reserva en localStorage
        const reserva = {
            id: Date.now(),
            tipo,
            itemNombre: item.Nombre,
            itemMunicipio: item.Municipio,
            ...formData,
            fechaReserva: new Date().toISOString()
        };

        const reservasGuardadas = JSON.parse(localStorage.getItem('reservas') || '[]');
        reservasGuardadas.push(reserva);
        localStorage.setItem('reservas', JSON.stringify(reservasGuardadas));

        // Mostrar mensaje de éxito
        setShowSuccess(true);

        // Cerrar modal después de 2 segundos
        setTimeout(() => {
            setShowSuccess(false);
            onClose();
            // Reset form
            setFormData({
                nombre: '',
                email: '',
                telefono: '',
                fecha: '',
                hora: '',
                checkIn: '',
                checkOut: '',
                personas: tipo === 'restaurante' ? 2 : 1,
                comentarios: ''
            });
        }, 2500);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                {!showSuccess ? (
                    <>
                        <button className="modal-close" onClick={onClose}>×</button>

                        <div className="modal-header">
                            <h2>Reservar {tipo === 'restaurante' ? 'Mesa' : 'Habitación'}</h2>
                            <div className="modal-item-info">
                                <h3>{item.Nombre}</h3>
                                <p>📍 {item.Municipio}</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="reserva-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="nombre">Nombre Completo *</label>
                                    <input
                                        type="text"
                                        id="nombre"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleChange}
                                        className={errors.nombre ? 'error' : ''}
                                    />
                                    {errors.nombre && <span className="error-message">{errors.nombre}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email">Email *</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={errors.email ? 'error' : ''}
                                    />
                                    {errors.email && <span className="error-message">{errors.email}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="telefono">Teléfono *</label>
                                    <input
                                        type="tel"
                                        id="telefono"
                                        name="telefono"
                                        value={formData.telefono}
                                        onChange={handleChange}
                                        className={errors.telefono ? 'error' : ''}
                                    />
                                    {errors.telefono && <span className="error-message">{errors.telefono}</span>}
                                </div>

                                {tipo === 'restaurante' ? (
                                    <>
                                        <div className="form-group">
                                            <label htmlFor="fecha">Fecha *</label>
                                            <input
                                                type="date"
                                                id="fecha"
                                                name="fecha"
                                                value={formData.fecha}
                                                onChange={handleChange}
                                                min={new Date().toISOString().split('T')[0]}
                                                className={errors.fecha ? 'error' : ''}
                                            />
                                            {errors.fecha && <span className="error-message">{errors.fecha}</span>}
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="hora">Hora *</label>
                                            <input
                                                type="time"
                                                id="hora"
                                                name="hora"
                                                value={formData.hora}
                                                onChange={handleChange}
                                                className={errors.hora ? 'error' : ''}
                                            />
                                            {errors.hora && <span className="error-message">{errors.hora}</span>}
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="personas">Número de Personas *</label>
                                            <select
                                                id="personas"
                                                name="personas"
                                                value={formData.personas}
                                                onChange={handleChange}
                                            >
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                                    <option key={num} value={num}>{num} {num === 1 ? 'persona' : 'personas'}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="form-group">
                                            <label htmlFor="checkIn">Check-in *</label>
                                            <input
                                                type="date"
                                                id="checkIn"
                                                name="checkIn"
                                                value={formData.checkIn}
                                                onChange={handleChange}
                                                min={new Date().toISOString().split('T')[0]}
                                                className={errors.checkIn ? 'error' : ''}
                                            />
                                            {errors.checkIn && <span className="error-message">{errors.checkIn}</span>}
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="checkOut">Check-out *</label>
                                            <input
                                                type="date"
                                                id="checkOut"
                                                name="checkOut"
                                                value={formData.checkOut}
                                                onChange={handleChange}
                                                min={formData.checkIn || new Date().toISOString().split('T')[0]}
                                                className={errors.checkOut ? 'error' : ''}
                                            />
                                            {errors.checkOut && <span className="error-message">{errors.checkOut}</span>}
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="personas">Habitaciones *</label>
                                            <select
                                                id="personas"
                                                name="personas"
                                                value={formData.personas}
                                                onChange={handleChange}
                                            >
                                                {[1, 2, 3, 4, 5].map(num => (
                                                    <option key={num} value={num}>{num} {num === 1 ? 'habitación' : 'habitaciones'}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="form-group full-width">
                                <label htmlFor="comentarios">Comentarios o Requisitos Especiales</label>
                                <textarea
                                    id="comentarios"
                                    name="comentarios"
                                    value={formData.comentarios}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Alergias, preferencias de mesa, peticiones especiales..."
                                />
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn-cancel" onClick={onClose}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-submit">
                                    Confirmar Reserva
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="success-message">
                        <div className="success-icon">✓</div>
                        <h2>¡Reserva Confirmada!</h2>
                        <p>Hemos recibido tu reserva para <strong>{item.Nombre}</strong></p>
                        <p className="success-detail">
                            Te enviaremos un email de confirmación a <strong>{formData.email}</strong>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ReservaModal;
