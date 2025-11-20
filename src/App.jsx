import React, { useState } from 'react';
import './App.css';
import Restaurantes from './Restaurantes';
import Hoteles from './Hoteles';
import escudoMurcia from './assets/Escudo_ca_Murcia_(stylized).svg.png';

function App() {
  const [currentView, setCurrentView] = useState('home');

  const handleRestaurantesClick = () => {
    setCurrentView('restaurantes');
  };

  const handleAlojamientosClick = () => {
    setCurrentView('hoteles');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
  };

  if (currentView === 'hoteles') {
    return <Hoteles onBack={handleBackToHome} />;
  }

  if (currentView === 'restaurantes') {
    return <Restaurantes onBack={handleBackToHome} />;
  }

  return (
    <>
      <section className="seccion-hero">
        <div className="logo">
          <div className="escudo">
            <img src={escudoMurcia} alt="Escudo Murcia" />
          </div>
          <span>MURCIA</span>
        </div>

        <h1 className="titulo-hero">
          Mejores restaurantes y<br />
          alojamientos de la ciudad.
        </h1>

        <div className="contenedor-botones">
          <button className="boton" onClick={handleRestaurantesClick}>
            Restaurantes
          </button>
          <button className="boton" onClick={handleAlojamientosClick}>
            Alojamientos
          </button>
        </div>
        <div className="scroll-down-indicator">
          <span>↓</span>
        </div>
      </section>

      <section className="seccion-secundaria">
        <h2 className="titulo-secundario">
          Come, bebe y descubre:<br />
          Construye nuevos recuerdos en Murcia.
        </h2>

        <p className="descripcion">
          Descubre Murcia a través de su irresistible gastronomía y déjate
          seducir por los sabores que nacen de una tierra fértil, donde la
          huerta y el mar se dan la mano para crear una experiencia culinaria
          única. En el corazón del Mediterráneo, Murcia te invita a disfrutar
          de platos llenos de tradición y frescura.
        </p>
      </section>
    </>
  );
}

export default App;