import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Restaurantes from './Restaurantes';
import Hoteles from './Hoteles';
import escudoMurcia from './assets/Escudo_ca_Murcia_(stylized).svg.png';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [isSecondaryVisible, setIsSecondaryVisible] = useState(false);
  const secondaryRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsSecondaryVisible(true);
          }
        });
      },
      {
        threshold: 0.2, // Trigger when 20% of the section is visible
      }
    );

    if (secondaryRef.current) {
      observer.observe(secondaryRef.current);
    }

    return () => {
      if (secondaryRef.current) {
        observer.unobserve(secondaryRef.current);
      }
    };
  }, []);

  // Scroll to top when view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

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
    return (
      <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
        <Hoteles onBack={handleBackToHome} />
      </div>
    );
  }

  if (currentView === 'restaurantes') {
    return (
      <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
        <Restaurantes onBack={handleBackToHome} />
      </div>
    );
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
            <span>Restaurantes</span>
          </button>
          <button className="boton" onClick={handleAlojamientosClick}>
            <span>Alojamientos</span>
          </button>
        </div>
        <div className="scroll-down-indicator">
          <span>↓</span>
        </div>
      </section>

      <section
        ref={secondaryRef}
        className={`seccion-secundaria ${isSecondaryVisible ? 'visible' : ''}`}
      >
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