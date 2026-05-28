'use client'

import { useState } from 'react'
import { supabase } from './supabase'

export default function Home() {
  const [email, setEmail] = useState('')
  const [cep, setCep] = useState('')
  const [bairro, setBairro] = useState('')
  const [logado, setLogado] = useState(false)
  const [tela, setTela] = useState('home')

  const [tipoAlerta, setTipoAlerta] = useState('')
  const [localDescricao, setLocalDescricao] = useState('')
  const [descricao, setDescricao] = useState('')
  const [alertas, setAlertas] = useState<any[]>([])

  async function carregarAlertas() {
  const { data } = await supabase
    .from('alertas')
    .select('*')
    .order('created_at', { ascending: false })

  setAlertas(data || [])
}
  async function publicarAlerta() {
    if (!tipoAlerta || !localDescricao || !descricao) {
      alert('Preencha todos os campos do alerta.')
      return
    }

    await supabase.from('alertas').insert([
      {
        email,
        bairro,
        categoria: 'Segurança',
        tipo_alerta: tipoAlerta,
        local_descricao: localDescricao,
        descricao,
        verdade: 0,
        boato: 0,
        status: 'pendente',
      },
    ])

    alert('Alerta enviado para validação comunitária.')

    setTipoAlerta('')
    setLocalDescricao('')
    setDescricao('')
    setTela('home')
  }

  if (logado && tela === 'alertas') {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <button
          onClick={() => setTela('home')}
          className="mb-6 text-green-800 font-bold"
        >
          ← Voltar
        </button>

        <h1 className="text-3xl font-bold text-gray-900">
          🚨 Novo alerta de segurança
        </h1>

        <p className="text-gray-600 mt-2 mb-6">
          Informe o tipo de ocorrência e uma descrição do local.
        </p>

        <div className="bg-white rounded-3xl shadow border p-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Bairro
          </label>

          <input
            value={bairro}
            disabled
            className="w-full border border-gray-300 rounded-2xl p-4 mb-4 text-black bg-gray-100"
          />

          <label className="block text-sm font-bold text-gray-700 mb-2">
            Tipo de alerta
          </label>

          <select
            value={tipoAlerta}
            onChange={(e) => setTipoAlerta(e.target.value)}
            className="w-full border border-gray-300 rounded-2xl p-4 mb-4 text-black bg-white"
          >
            <option value="">Selecione uma opção</option>
            <option value="Operação Policial">Operação Policial</option>
            <option value="Tiroteio">Tiroteio</option>
            <option value="Assalto">Assalto</option>
            <option value="Narcotráfico">Narcotráfico</option>
            <option value="Arrastão">Arrastão</option>
            <option value="Confronto entre Facções">
              Confronto entre Facções
            </option>
          </select>

          <label className="block text-sm font-bold text-gray-700 mb-2">
            Descrição do local
          </label>

          <input
            type="text"
            placeholder="Ex: próximo à estação, praça, rua ou referência"
            value={localDescricao}
            onChange={(e) => setLocalDescricao(e.target.value)}
            className="w-full border border-gray-300 rounded-2xl p-4 mb-4 text-black bg-white"
          />

          <label className="block text-sm font-bold text-gray-700 mb-2">
            Descrição do ocorrido
          </label>

          <textarea
            placeholder="Descreva brevemente o que está acontecendo"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full border border-gray-300 rounded-2xl p-4 mb-4 text-black bg-white min-h-32"
          />

          <button
            onClick={publicarAlerta}
            className="w-full bg-green-700 text-white rounded-2xl p-4 font-bold"
          >
            Enviar alerta
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            O alerta ficará pendente até receber 3 marcações como Verdade.
          </p>
        </div>
      </main>
    )
  }

  if (logado) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <h1 className="text-4xl font-bold text-green-900 text-center">
          Chapadão Conecta
        </h1>

        <p className="text-center text-gray-600 mt-2 mb-8">
          Informação que aproxima. Comunidade que protege.
        </p>

        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Olá, comunidade! 👋
        </h2>

        <p className="text-gray-600 mb-6">
          Escolha uma opção abaixo para acessar as informações da sua região.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            ['🚨', 'Alertas de segurança', 'Veja e compartilhe alertas importantes da nossa região.'],
            ['🐾', 'Pets desaparecidos', 'Ajude a encontrar animais perdidos na comunidade.'],
            ['👤', 'Pessoas desaparecidas', 'Compartilhe informações que podem ajudar.'],
            ['☎️', 'Riscos e emergências', 'Informações sobre riscos e situações de emergência.'],
            ['📢', 'Avisos comunitários', 'Informes, eventos e comunicados úteis para moradores.'],
            ['✅', 'Confirmar informações', 'Ajude a manter nossa comunidade mais segura.'],
          ].map(([icon, title, text]) => (
            <div
              key={title}
              onClick={() => {
                if (title === 'Alertas de segurança') {
                  setTela('alertas')
                }
              }}
              className="bg-white rounded-3xl p-6 shadow border cursor-pointer"
            >
              <div className="text-5xl mb-4">{icon}</div>
              <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
              <p className="text-gray-600 mt-2">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-green-50 border border-green-200 rounded-3xl p-5 text-green-800">
          📍 Região verificada — você está conectado à comunidade do Complexo do Chapadão e entorno.
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          Projeto acadêmico desenvolvido para a UNINTER — Tecnologia em Redes de Computadores
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section   className="min-h-screen flex items-center justify-center p-6 bg-repeat"
  style={{
    backgroundImage: "url('/images/fundo2.png')",
    backgroundSize: '600px',   }} >
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-7">
          <p className="text-sm font-semibold text-green-700 mb-2 text-center">
            Comunidade hiperlocal
          </p>

          <h1 className="text-4xl font-bold text-gray-900 text-center">
            Chapadão Conecta
          </h1>

          <p className="text-gray-600 mt-3 mb-6 text-center">
            Informação que aproxima. Comunidade que protege.
          </p>

          <input
            type="text"
            inputMode="email"
            autoComplete="email"
            placeholder="Digite seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-2xl p-4 mb-3 text-black bg-white"
          />

          <input
            type="text"
            placeholder="Digite seu CEP"
            value={cep}
            onChange={(e) => setCep(e.target.value)}
            className="w-full border border-gray-300 rounded-2xl p-4 mb-4 text-black bg-white"
          />

          <button
            onClick={async () => {
              const emailLimpo = email.trim()

              if (
                emailLimpo === '' ||
                !emailLimpo.includes('@') ||
                emailLimpo.length < 5
              ) {
                alert('Digite um email válido')
                return
              }

              const response = await fetch(
                `https://viacep.com.br/ws/${cep}/json/`
              )

              const data = await response.json()

              const bairrosPermitidos = [
                'Pavuna',
                'Costa Barros',
                'Anchieta',
                'Guadalupe',
                'Ricardo de Albuquerque',
              ]

              const permitido = bairrosPermitidos.includes(data.bairro)

              await supabase.from('usuarios').insert([
                {
                  email: emailLimpo,
                  cep,
                  bairro: data.bairro,
                  permitido,
                },
              ])

              if (permitido) {
                setEmail(emailLimpo)
                setBairro(data.bairro)
                await carregarAlertas()
                setLogado(true)
              } else {
                alert('Sua região ainda não está disponível na plataforma.')
              }
            }}
            className="w-full bg-green-700 text-white rounded-2xl p-4 font-bold"
          >
            Entrar na comunidade
          </button>

          <p className="text-xs text-gray-500 text-center mt-5">
            Acesso disponível para moradores do Complexo do Chapadão e entorno.
          </p>
        </div>
      </section>
    </main>
  )
}
