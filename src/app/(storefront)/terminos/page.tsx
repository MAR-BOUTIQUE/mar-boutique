import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description: "Términos y condiciones de uso de Mar Boutique.",
};

export default function TerminosPage() {
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
            Términos y Condiciones
          </h1>
          <p className="text-sm text-[#897568] mt-3">
            Última actualización: junio de 2026
          </p>
        </div>

        <div className="bg-white border border-[#DDD5C4] p-8 space-y-8 text-sm text-[#897568] leading-relaxed">
          <section>
            <h2 className="text-base font-[600] text-[#3D2B1F] mb-3">1. Aceptación de términos</h2>
            <p>
              Al acceder y utilizar el sitio web de Mar Boutique (mar-boutique.com), aceptas cumplir
              y estar sujeto a los presentes Términos y Condiciones. Si no estás de acuerdo con
              alguno de estos términos, te pedimos que no utilices nuestro sitio.
            </p>
          </section>

          <section>
            <h2 className="text-base font-[600] text-[#3D2B1F] mb-3">2. Sobre Mar Boutique</h2>
            <p>
              Mar Boutique es una tienda de moda femenina con sede en Cartagena, Colombia.
              Ofrecemos prendas con estilo playero y costero a través de nuestra plataforma digital.
            </p>
          </section>

          <section>
            <h2 className="text-base font-[600] text-[#3D2B1F] mb-3">3. Productos y disponibilidad</h2>
            <p>
              Todos los productos están sujetos a disponibilidad de inventario. Nos reservamos el derecho
              de limitar las cantidades por pedido. Los precios están expresados en pesos colombianos (COP)
              e incluyen los impuestos aplicables según la normativa colombiana vigente.
            </p>
          </section>

          <section>
            <h2 className="text-base font-[600] text-[#3D2B1F] mb-3">4. Proceso de compra</h2>
            <p>
              Al realizar un pedido, recibirás una confirmación por correo electrónico. El contrato de
              compraventa se perfecciona una vez confirmado el pago a través de la pasarela autorizada
              (Wompi). Nos reservamos el derecho de cancelar pedidos en caso de error en precios o
              indisponibilidad de stock.
            </p>
          </section>

          <section>
            <h2 className="text-base font-[600] text-[#3D2B1F] mb-3">5. Envíos</h2>
            <p>
              Los envíos se realizan a todo el territorio colombiano. Los tiempos de entrega son
              estimados y pueden variar según la ubicación y el operador logístico. Mar Boutique no
              se hace responsable por demoras atribuibles a terceros operadores.
            </p>
          </section>

          <section>
            <h2 className="text-base font-[600] text-[#3D2B1F] mb-3">6. Propiedad intelectual</h2>
            <p>
              Todo el contenido del sitio (imágenes, textos, logotipos, diseños) es propiedad de
              Mar Boutique y está protegido por las leyes de propiedad intelectual colombianas e
              internacionales. Queda prohibida su reproducción sin autorización expresa.
            </p>
          </section>

          <section>
            <h2 className="text-base font-[600] text-[#3D2B1F] mb-3">7. Modificaciones</h2>
            <p>
              Mar Boutique se reserva el derecho de modificar estos términos en cualquier momento.
              Los cambios serán publicados en esta página y entrarán en vigencia inmediatamente.
            </p>
          </section>

          <section>
            <h2 className="text-base font-[600] text-[#3D2B1F] mb-3">8. Contacto</h2>
            <p>
              Para cualquier consulta relacionada con estos términos, puedes escribirnos a{" "}
              <a href="mailto:hola@mar-boutique.com" className="text-[#B5888A] underline">
                hola@mar-boutique.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
