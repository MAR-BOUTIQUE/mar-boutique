import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Política de privacidad y tratamiento de datos personales de Mar Boutique según la Ley 1581 de 2012.",
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#F3EDE0]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10">
          <span className="text-[10px] tracking-[0.28em] uppercase text-[#B5888A] font-[500]">
            Legal
          </span>
          <h1
            className="text-4xl text-[#3D2B1F] mt-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Política de Privacidad
          </h1>
          <p className="text-sm text-[#897568] mt-3">
            Última actualización: junio de 2026 · Ley 1581 de 2012 y Decreto 1377 de 2013
          </p>
        </div>

        <div className="bg-white border border-[#DDD5C4] p-8 space-y-8 text-sm text-[#897568] leading-relaxed">
          <section>
            <h2 className="text-base font-[600] text-[#3D2B1F] mb-3">1. Responsable del tratamiento</h2>
            <p>
              Mar Boutique, con domicilio en Cartagena de Indias, Colombia, es responsable del
              tratamiento de los datos personales recolectados a través de mar-boutique.com.
              Contacto: <a href="mailto:hola@mar-boutique.com" className="text-[#B5888A] underline">hola@mar-boutique.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-base font-[600] text-[#3D2B1F] mb-3">2. Datos que recolectamos</h2>
            <p className="mb-2">Recolectamos los siguientes datos personales:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Nombre completo</li>
              <li>Dirección de correo electrónico</li>
              <li>Número de teléfono / WhatsApp</li>
              <li>Dirección de envío (departamento, ciudad, dirección)</li>
              <li>Número de documento de identidad (para facturación)</li>
              <li>Historial de pedidos y productos consultados</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-[600] text-[#3D2B1F] mb-3">3. Finalidad del tratamiento</h2>
            <p className="mb-2">Utilizamos tus datos para:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Procesar y gestionar tus pedidos</li>
              <li>Enviarte confirmaciones y actualizaciones de estado</li>
              <li>Gestionar tu cuenta de cliente</li>
              <li>Enviarte comunicaciones de marketing (solo con tu autorización)</li>
              <li>Cumplir obligaciones legales y contables</li>
              <li>Mejorar nuestros productos y servicios</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-[600] text-[#3D2B1F] mb-3">4. Base legal del tratamiento</h2>
            <p>
              El tratamiento de tus datos se realiza con base en: (a) la ejecución del contrato de
              compraventa, (b) el cumplimiento de obligaciones legales, y (c) tu consentimiento
              expreso para comunicaciones de marketing, el cual puedes revocar en cualquier momento.
            </p>
          </section>

          <section>
            <h2 className="text-base font-[600] text-[#3D2B1F] mb-3">5. Compartición de datos</h2>
            <p>
              No vendemos ni cedemos tus datos a terceros con fines comerciales. Podemos compartirlos
              únicamente con operadores logísticos para el despacho de tus pedidos, y con proveedores
              de servicios tecnológicos que actúan como encargados del tratamiento bajo nuestras instrucciones.
            </p>
          </section>

          <section>
            <h2 className="text-base font-[600] text-[#3D2B1F] mb-3">6. Tus derechos (Habeas Data)</h2>
            <p className="mb-2">
              De conformidad con la Ley 1581 de 2012, tienes derecho a:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Conocer, actualizar y rectificar tus datos personales</li>
              <li>Solicitar prueba de la autorización otorgada</li>
              <li>Ser informado sobre el uso dado a tus datos</li>
              <li>Revocar la autorización y/o solicitar la supresión de tus datos</li>
              <li>Acceder gratuitamente a tus datos</li>
            </ul>
            <p className="mt-3">
              Para ejercer estos derechos, escríbenos a{" "}
              <a href="mailto:hola@mar-boutique.com" className="text-[#B5888A] underline">
                hola@mar-boutique.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-base font-[600] text-[#3D2B1F] mb-3">7. Seguridad</h2>
            <p>
              Implementamos medidas técnicas y organizativas para proteger tus datos contra acceso
              no autorizado, pérdida o alteración. Utilizamos cifrado SSL/TLS en todas las
              comunicaciones y almacenamos tus datos en servidores seguros.
            </p>
          </section>

          <section>
            <h2 className="text-base font-[600] text-[#3D2B1F] mb-3">8. Cookies</h2>
            <p>
              Utilizamos cookies técnicas necesarias para el funcionamiento del sitio, y cookies
              analíticas (Google Analytics) para entender cómo nuestras clientas usan la plataforma.
              Puedes gestionar las cookies desde la configuración de tu navegador.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
