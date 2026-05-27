export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      <section
        className="min-h-screen bg-cover bg-center flex items-center justify-center p-6"
        style={{ backgroundImage: "url('/images/mapa-chapadao.jpg')" }}
      >
        <div className="bg-white/95 rounded-3xl shadow-2xl p-6 w-full max-w-md">
          <h1 className="text-3xl font-bold text-green-800 text-center">
            Chapadão Conecta
          </h1>

          <p className="text-gray-600 text-center mt-2 mb-6">
            Informação que aproxima. Comunidade que protege.
          </p>

          <input
            type="email"
            placeholder="Digite seu email"
            className="w-full border rounded-xl p-3 mb-3"
          />

          <input
            type="text"
            placeholder="Digite seu CEP"
            className="w-full border rounded-xl p-3 mb-4"
          />

          <button className="w-full bg-green-700 text-white rounded-xl p-3 font-semibold">
            Entrar na comunidade
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Plataforma voltada para moradores do Complexo do Chapadão e entorno.
          </p>
        </div>
      </section>
    </main>
  );
}