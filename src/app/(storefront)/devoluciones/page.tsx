import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Devoluciones",
  description: "Política de cambios y devoluciones de Mar Boutique.",
};

export default function DevolucionesPage() {
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
            Política de Devoluciones
          </h1>
          <p className="text-sm text-[#897568] mt-3">
            Última actualización: junio de 2026
          </p>
        </div>

        <div className="bg-white border border-[#DDD5C4] p-8 space-y-8 text-sm text-[#897568] leading-relaxed">
          <section>
            <h2 className="text-base font-[600] text-[#3D2B1F] mb-3">Cambios</h2>
            <p className="mb-3">
              Aceptamos cambios dentro de los <strong className="text-[#3D2B1F]">5 días hábiles</strong> siguientes
              a la recepción del pedido, siempre que:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>La prenda esté sin usar, sin lavar y con todas sus etiquetas originales</li>
              <li>Se presente el número de pedido</li>
              <li>La prenda no haya sido adquirida en promoción o liquidación</li>
            </ul>
            <p className="mt-3">
              Los cambios están sujetos a disponibilidad de inventario. En caso de no haber
              disponibilidad, se emitirá una nota crédito para usar en tu próxima compra.
            </p>
          </section>

          <section>
            <h2 className="text-base font-[600] text-[#3D2B1F] mb-3">Devoluciones por producto defectuoso</h2>
            <p>
              Si recibes una prenda con defecto de fabricación, debes notificarnos dentro de las
              <strong className="text-[#3D2B1F]"> 48 horas</strong> siguientes a la recepción enviando
              fotografías del defecto a{" "}
              <a href="mailto:hola@mar-boutique.com" className="text-[#B5888A] underline">
                hola@mar-boutique.com
              </a>
              . En este caso, asumimos el costo del envío de devolución y ofrecemos cambio por la
              misma referencia o reembolso completo.
            </p>
          </section>

          <section>
            <h2 className="text-base font-[600] text-[#3D2B1F] mb-3">Prendas sin derecho a cambio</h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Ropa interior y vestidos de baño (por higiene)</li>
              <li>Prendas en promoción o liquidación</li>
              <li>Prendas usadas, lavadas o sin etiquetas</li>
              <li>Prendas personalizadas bajo pedido</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-[600] text-[#3D2B1F] mb-3">Proceso de cambio</h2>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Escríbenos a hola@mar-boutique.com con tu número de pedido</li>
              <li>Te indicaremos la dirección de envío para la devolución</li>
              <li>El costo del envío de devolución corre por cuenta de la clienta (salvo defecto de fabricación)</li>
              <li>Una vez recibida y verificada la prenda, procesamos el cambio en 3-5 días hábiles</li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-[600] text-[#3D2B1F] mb-3">Contacto</h2>
            <p>
              Para iniciar un cambio o resolver dudas, escríbenos a{" "}
              <a href="mailto:hola@mar-boutique.com" className="text-[#B5888A] underline">
                hola@mar-boutique.com
              </a>{" "}
              o por WhatsApp. Respondemos en horario hábil (lunes a viernes, 9am–6pm).
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
