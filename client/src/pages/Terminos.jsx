import { Link } from 'react-router-dom';

export default function Terminos({ lang = 'ES' }) {
  const copy = lang === 'EN'
    ? {
        title: 'Terms and Conditions',
        updated: 'Last updated: May 18, 2026',
        intro: 'These Terms and Conditions govern access and use of RentPlay services, including listing, rental, and communication features between users.',
        sections: [
          {
            title: '1. Account And Access',
            items: [
              'You are responsible for keeping your account credentials secure.',
              'You must provide truthful and updated profile information.',
              'RentPlay may suspend accounts that violate these terms or applicable law.'
            ]
          },
          {
            title: '2. Listings And Content',
            items: [
              'Users must only publish games they are authorized to offer for rent.',
              'Content uploaded to the platform must not infringe third-party rights.',
              'RentPlay may remove listings that are misleading, offensive, or fraudulent.'
            ]
          },
          {
            title: '3. Rentals And Payments',
            items: [
              'Rental duration and pricing are defined by the listing owner.',
              'A game marked as actively rented cannot be rented by another user at the same time.',
              'Users agree to complete payments using available payment methods in the app.'
            ]
          },
          {
            title: '4. User Conduct',
            items: [
              'Harassment, abuse, impersonation, and spam are prohibited.',
              'Any attempt to exploit the platform, bypass permissions, or manipulate listings is forbidden.',
              'RentPlay reserves the right to investigate and apply moderation actions.'
            ]
          },
          {
            title: '5. Liability And Service Availability',
            items: [
              'RentPlay provides the platform as available and may apply maintenance windows.',
              'We do not guarantee uninterrupted service under all network conditions.',
              'To the extent permitted by law, RentPlay limits liability for indirect damages.'
            ]
          },
          {
            title: '6. Contact',
            items: [
              'For legal or support inquiries, contact the team through the official support channels.',
              'By continuing to use RentPlay, you acknowledge and accept these terms.'
            ]
          }
        ],
        back: 'Back To Register'
      }
    : {
        title: 'Términos y Condiciones',
        updated: 'Última actualización: 18 de mayo de 2026',
        intro: 'Estos Términos y Condiciones regulan el acceso y uso de los servicios de RentPlay, incluyendo funciones de publicación, alquiler y comunicación entre usuarios.',
        sections: [
          {
            title: '1. Cuenta y acceso',
            items: [
              'Eres responsable de mantener seguras tus credenciales de acceso.',
              'Debes proporcionar información de perfil veraz y actualizada.',
              'RentPlay podrá suspender cuentas que incumplan estos términos o la legislación aplicable.'
            ]
          },
          {
            title: '2. Publicaciones y contenido',
            items: [
              'Los usuarios solo deben publicar juegos sobre los que tengan autorización para alquilar.',
              'El contenido subido a la plataforma no debe infringir derechos de terceros.',
              'RentPlay podrá retirar publicaciones engañosas, ofensivas o fraudulentas.'
            ]
          },
          {
            title: '3. Alquileres y pagos',
            items: [
              'La duración y el precio del alquiler son definidos por el propietario de la publicación.',
              'Un juego marcado como alquilado de forma activa no podrá ser alquilado por otro usuario al mismo tiempo.',
              'Los usuarios aceptan completar los pagos mediante los métodos disponibles en la aplicación.'
            ]
          },
          {
            title: '4. Conducta de usuario',
            items: [
              'Se prohíbe el acoso, abuso, suplantación de identidad y spam.',
              'Queda prohibido intentar explotar la plataforma, saltar permisos o manipular publicaciones.',
              'RentPlay se reserva el derecho de investigar y aplicar medidas de moderación.'
            ]
          },
          {
            title: '5. Responsabilidad y disponibilidad del servicio',
            items: [
              'RentPlay ofrece la plataforma según disponibilidad y puede aplicar ventanas de mantenimiento.',
              'No se garantiza servicio ininterrumpido bajo todas las condiciones de red.',
              'En la medida permitida por ley, RentPlay limita su responsabilidad por daños indirectos.'
            ]
          },
          {
            title: '6. Contacto',
            items: [
              'Para consultas legales o de soporte, contacta con el equipo por los canales oficiales de atención.',
              'Al continuar usando RentPlay, reconoces y aceptas estos términos.'
            ]
          }
        ],
        back: 'Volver al registro'
      };

  return (
    <div className="container page-stack" style={{ paddingTop: '24px' }}>
      <section className="section-block card" style={{ padding: '28px' }}>
        <p className="eyebrow">RentPlay</p>
        <h1 style={{ margin: 0 }}>{copy.title}</h1>
        <p className="muted" style={{ marginTop: '10px' }}>{copy.updated}</p>
        <p style={{ marginTop: '16px', lineHeight: 1.6 }}>{copy.intro}</p>
      </section>

      <section className="section-block card" style={{ padding: '28px' }}>
        {copy.sections.map((section) => (
          <article key={section.title} style={{ marginBottom: '18px' }}>
            <h2 style={{ marginBottom: '10px' }}>{section.title}</h2>
            <ul style={{ marginTop: 0, color: 'var(--muted)', lineHeight: 1.6 }}>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
        <Link className="button button-primary" to="/register">{copy.back}</Link>
      </section>
    </div>
  );
}
