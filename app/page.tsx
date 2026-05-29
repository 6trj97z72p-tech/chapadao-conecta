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

  const [nomePessoa, setNomePessoa] = useState('')
  const [idadePessoa, setIdadePessoa] = useState('')
  const [dataDesaparecimento, setDataDesaparecimento] = useState('')
  const [localDesaparecimento, setLocalDesaparecimento] = useState('')
  const [telefoneContato, setTelefoneContato] = useState('')
  const [descricaoPessoa, setDescricaoPessoa] = useState('')
  const [fotoPessoa, setFotoPessoa] = useState<File | null>(null)
  const [pessoas, setPessoas] = useState<any[]>([])

  function limite24h() {
    const data = new Date()
    data.setHours(data.getHours() - 24)
    return data.toISOString()
  }

  function formatarData(data: string) {
    return new Date(data).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  }

  function tocarAlarme() {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext

    const audioContext = new AudioContextClass()

    function beep(inicio: number) {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 950
      gainNode.gain.value = 0.18

      oscillator.start(audioContext.currentTime + inicio)
      oscillator.stop(audioContext.currentTime + inicio + 0.15)
    }

    const grupos = [0, 1.2, 2.4]

    grupos.forEach((grupoInicio) => {
      beep(grupoInicio)
      beep(grupoInicio + 0.25)
      beep(grupoInicio + 0.5)
    })
  }

  async function carregarAlertas() {
    const { data } = await supabase
      .from('alertas')
      .select('*')
      .gte('created_at', limite24h())
      .order('created_at', { ascending: true })

    const agrupados: any[] = []

    ;(data || []).forEach((alerta) => {
      const existente = agrupados.find(
        (item) =>
          item.bairro === alerta.bairro &&
          item.tipo_alerta === alerta.tipo_alerta
      )

      if (existente) {
        existente.verdade += alerta.verdade
        existente.boato += alerta.boato
      } else {
        agrupados.push({ ...alerta })
      }
    })

    const resultado = agrupados.reverse()
    setAlertas(resultado)
    return resultado
  }

  async function carregarPessoas() {
    const { data } = await supabase
      .from('pessoas_desaparecidas')
      .select('*')
      .order('created_at', { ascending: false })

    setPessoas(data || [])
    return data || []
  }

  async function publicarAlerta() {
    if (!tipoAlerta || !localDescricao || !descricao) {
      alert('Preencha todos os campos do alerta.')
      return
    }

    const { data: alertasExistentes } = await supabase
      .from('alertas')
      .select('*')
      .eq('bairro', bairro)
      .eq('tipo_alerta', tipoAlerta)
      .gte('created_at', limite24h())
      .order('created_at', { ascending: true })

    const alertaExistente = alertasExistentes?.[0]

    if (alertaExistente) {
      await supabase
        .from('alertas')
        .update({
          verdade: alertaExistente.verdade + 1,
        })
        .eq('id', alertaExistente.id)

      alert('Alerta semelhante já existia. Sua informação foi registrada como Verdade.')
    } else {
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
    }

    setTipoAlerta('')
    setLocalDescricao('')
    setDescricao('')
    await carregarAlertas()
  }

  async function votarVerdade(alerta: any) {
    await supabase
      .from('alertas')
      .update({
        verdade: alerta.verdade + 1,
      })
      .eq('id', alerta.id)

    await carregarAlertas()
  }

  async function votarBoato(alerta: any) {
    await supabase
      .from('alertas')
      .update({
        boato: alerta.boato + 1,
      })
      .eq('id', alerta.id)

    await carregarAlertas()
  }

  async function publicarPessoa() {
    if (
      !nomePessoa ||
      !idadePessoa ||
      !dataDesaparecimento ||
      !localDesaparecimento ||
      !telefoneContato ||
      !descricaoPessoa ||
      !fotoPessoa
    ) {
      alert('Preencha todos os campos da pessoa desaparecida.')
      return
    }

    const nomeArquivo = `${Date.now()}-${fotoPessoa.name.replaceAll(' ', '_')}`

    const upload = await supabase.storage
      .from('pessoas-desaparecidas')
      .upload(nomeArquivo, fotoPessoa)

    if (upload.error) {
      alert('Erro ao enviar a foto.')
      return
    }

    const { data } = supabase.storage
      .from('pessoas-desaparecidas')
      .getPublicUrl(nomeArquivo)

    await supabase.from('pessoas_desaparecidas').insert([
      {
        email,
        bairro,
        nome: nomePessoa,
        idade: Number(idadePessoa),
        foto_url: data.publicUrl,
        data_desaparecimento: dataDesaparecimento,
        local_desaparecimento: localDesaparecimento,
        descricao: descricaoPessoa,
        telefone_contato: telefoneContato,
        status: 'DESAPARECIDA',
      },
    ])

    alert('Pessoa desaparecida cadastrada.')

    setNomePessoa('')
    setIdadePessoa('')
    setDataDesaparecimento('')
    setLocalDesaparecimento('')
    setTelefoneContato('')
    setDescricaoPessoa('')
    setFotoPessoa(null)

    await carregarPessoas()
  }

  const inputClasse =
    'w-full border border-emerald-200 rounded-2xl p-4 mb-4 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600'

  const labelClasse =
    'block text-sm font-bold text-emerald-950 mb-2'

  const cardClasse =
    'bg-white/95 rounded-3xl shadow-xl border border-emerald-200 p-6'

  const paginaClasse =
    'min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 p-6'

  if (logado && tela === 'alertas') {
    return (
      <main className={paginaClasse}>
        <button
          onClick={() => setTela('home')}
          className="mb-6 text-emerald-100 font-bold"
        >
          ← Voltar
        </button>

        <h1 className="text-3xl font-extrabold text-white">
          🚨 Alertas de segurança
        </h1>

        <p className="text-emerald-100/80 mt-2 mb-6">
          Crie alertas e acompanhe validações da comunidade.
        </p>

        <div className={`${cardClasse} mb-8`}>
          <label className={labelClasse}>Bairro</label>
          <input value={bairro} disabled className={`${inputClasse} bg-emerald-50`} />

          <label className={labelClasse}>Tipo de alerta</label>
          <select
            value={tipoAlerta}
            onChange={(e) => setTipoAlerta(e.target.value)}
            className={inputClasse}
          >
            <option value="">Selecione uma opção</option>
            <option value="Operação Policial">Operação Policial</option>
            <option value="Tiroteio">Tiroteio</option>
            <option value="Assalto">Assalto</option>
            <option value="Narcotráfico">Narcotráfico</option>
            <option value="Arrastão">Arrastão</option>
            <option value="Confronto entre Facções">Confronto entre Facções</option>
          </select>

          <label className={labelClasse}>Descrição do local</label>
          <input
            type="text"
            placeholder="Ex: próximo à estação, praça, rua ou referência"
            value={localDescricao}
            onChange={(e) => setLocalDescricao(e.target.value)}
            className={inputClasse}
          />

          <label className={labelClasse}>Descrição do ocorrido</label>
          <textarea
            placeholder="Descreva brevemente o que está acontecendo"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className={`${inputClasse} min-h-32`}
          />

          <button
            onClick={publicarAlerta}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl p-4 font-bold shadow-lg transition"
          >
            Enviar alerta
          </button>
        </div>

        <div className="space-y-4">
          {alertas.length === 0 && (
            <p className="text-emerald-100 text-center">
              Ainda não há alertas cadastrados nas últimas 24 horas.
            </p>
          )}

          {alertas.map((alerta) => (
            <div
              key={alerta.id}
              className="bg-white/95 rounded-3xl shadow-xl border border-red-100 p-5"
            >
              <h2 className="text-2xl font-bold text-red-700">
                🚨 {alerta.tipo_alerta} — {alerta.bairro}
              </h2>

              <p className="text-sm text-slate-500 mt-2">
                🕒 Criado em {formatarData(alerta.created_at)}
              </p>

              <p className="text-sm text-slate-500 mt-1">
                📍 {alerta.local_descricao}
              </p>

              <p className="text-slate-700 mt-4">{alerta.descricao}</p>

              <div className="flex gap-6 mt-5">
                <button
                  onClick={() => votarVerdade(alerta)}
                  className="font-bold text-emerald-700"
                >
                  👍 Verdade {alerta.verdade}
                </button>

                <button
                  onClick={() => votarBoato(alerta)}
                  className="font-bold text-red-700"
                >
                  👎 Boato {alerta.boato}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    )
  }

  if (logado && tela === 'pessoas') {
    return (
      <main className={paginaClasse}>
        <button
          onClick={() => setTela('home')}
          className="mb-6 text-emerald-100 font-bold"
        >
          ← Voltar
        </button>

        <h1 className="text-3xl font-extrabold text-white">
          👤 Pessoas desaparecidas
        </h1>

        <p className="text-emerald-100/80 mt-2 mb-6">
          Cadastre e visualize pessoas desaparecidas na comunidade.
        </p>

        <div className={`${cardClasse} mb-8`}>
          <label className={labelClasse}>Foto</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFotoPessoa(e.target.files?.[0] || null)}
            className={inputClasse}
          />

          <label className={labelClasse}>Nome</label>
          <input
            type="text"
            value={nomePessoa}
            onChange={(e) => setNomePessoa(e.target.value)}
            className={inputClasse}
          />

          <label className={labelClasse}>Idade</label>
          <input
            type="number"
            value={idadePessoa}
            onChange={(e) => setIdadePessoa(e.target.value)}
            className={inputClasse}
          />

          <label className={labelClasse}>Data do desaparecimento</label>
          <input
            type="date"
            value={dataDesaparecimento}
            onChange={(e) => setDataDesaparecimento(e.target.value)}
            className={inputClasse}
          />

          <label className={labelClasse}>Último local visto</label>
          <input
            type="text"
            value={localDesaparecimento}
            onChange={(e) => setLocalDesaparecimento(e.target.value)}
            className={inputClasse}
          />

          <label className={labelClasse}>Telefone para contato</label>
          <input
            type="text"
            value={telefoneContato}
            onChange={(e) => setTelefoneContato(e.target.value)}
            className={inputClasse}
          />

          <label className={labelClasse}>Descrição</label>
          <textarea
            value={descricaoPessoa}
            onChange={(e) => setDescricaoPessoa(e.target.value)}
            className={`${inputClasse} min-h-32`}
          />

          <button
            onClick={publicarPessoa}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl p-4 font-bold shadow-lg transition"
          >
            Cadastrar pessoa desaparecida
          </button>
        </div>

        <div className="space-y-6">
          {pessoas.length === 0 && (
            <p className="text-emerald-100 text-center">
              Ainda não há pessoas desaparecidas cadastradas.
            </p>
          )}

          {pessoas.map((pessoa) => (
            <div
              key={pessoa.id}
              className="max-w-md mx-auto bg-white/95 rounded-3xl shadow-xl border border-emerald-200 overflow-hidden"
            >
              {pessoa.foto_url && (
                <img
                  src={pessoa.foto_url}
                  alt={pessoa.nome}
                  className="w-full h-80 object-cover"
                />
              )}

              <div className="p-5">
                <h2 className="text-2xl font-bold text-slate-900">
                  {pessoa.nome}
                </h2>

                <p className="text-slate-600 mt-1">
                  {pessoa.idade} anos
                </p>

                <p className="text-sm text-slate-500 mt-3">
                  🕒 Desaparecida desde:{' '}
                  {new Date(pessoa.data_desaparecimento).toLocaleDateString('pt-BR')}
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  📍 Último local visto: {pessoa.local_desaparecimento}
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  📞 Contato: {pessoa.telefone_contato}
                </p>

                <p className="text-slate-700 mt-4">{pessoa.descricao}</p>

                <p
                  className={`mt-4 inline-block px-4 py-2 rounded-full text-sm font-bold ${
                    pessoa.status === 'LOCALIZADA'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {pessoa.status === 'LOCALIZADA'
                    ? '🟢 LOCALIZADO'
                    : '🔴 DESAPARECIDO'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    )
  }

  if (logado) {
    return (
      <main className={paginaClasse}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sm font-bold text-emerald-300 uppercase tracking-widest">
              Comunidade hiperlocal
            </p>

            <h1 className="text-5xl font-extrabold text-white mt-2">
              Chapadão Conecta
            </h1>

            <p className="text-emerald-100/80 mt-3">
              Informação que aproxima. Comunidade que protege.
            </p>
          </div>

          <div className="bg-white/95 rounded-3xl shadow-xl border border-emerald-200 p-6 mb-8">
            <h2 className="text-3xl font-bold text-emerald-950 mb-2">
              Olá, comunidade! 👋
            </h2>

            <p className="text-slate-600">
              Escolha uma opção abaixo para acessar as informações da sua região.
            </p>
          </div>

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
                    carregarAlertas()
                    setTela('alertas')
                  }

                  if (title === 'Pessoas desaparecidas') {
                    carregarPessoas()
                    setTela('pessoas')
                  }
                }}
                className="bg-white/95 rounded-3xl p-6 shadow-xl border border-emerald-200 cursor-pointer hover:scale-[1.02] hover:shadow-2xl transition"
              >
                <div className="text-5xl mb-4">{icon}</div>
                <h3 className="text-2xl font-bold text-emerald-950">{title}</h3>
                <p className="text-slate-600 mt-2">{text}</p>
              </div>
            ))}
          </div>

          {alertas.length > 0 && (
            <div className="mt-10">
              <h2 className="text-2xl font-bold text-red-200 mb-4">
                🚨 Alertas de segurança ativos
              </h2>

              <div className="space-y-4">
                {alertas.slice(0, 3).map((alerta) => (
                  <div
                    key={alerta.id}
                    className="bg-white/95 rounded-3xl shadow-xl border border-red-100 p-5"
                  >
                    <h3 className="text-xl font-bold text-red-700">
                      🚨 {alerta.tipo_alerta} — {alerta.bairro}
                    </h3>

                    <p className="text-sm text-slate-500 mt-1">
                      🕒 {formatarData(alerta.created_at)}
                    </p>

                    <p className="text-sm text-slate-500 mt-1">
                      📍 {alerta.local_descricao}
                    </p>

                    <div className="flex gap-6 mt-3">
                      <span className="font-bold text-emerald-700">
                        👍 Verdade {alerta.verdade}
                      </span>

                      <span className="font-bold text-red-700">
                        👎 Boato {alerta.boato}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-emerald-100 text-center mt-4">
                Para validar ou criar novos alertas, acesse o menu Alertas de segurança.
              </p>
            </div>
          )}

          <div className="mt-8 bg-emerald-100/95 border border-emerald-300 rounded-3xl p-5 text-emerald-900 font-medium shadow">
            📍 Região verificada — você está conectado à comunidade do Complexo do Chapadão e entorno.
          </div>

          <div className="mt-6 text-center text-xs text-emerald-100/70">
            Projeto acadêmico desenvolvido para a UNINTER — Tecnologia em Redes de Computadores
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900">
      <section
        className="min-h-screen flex items-center justify-center p-6 bg-repeat"
        style={{
          backgroundImage: "url('/images/fundo.png')",
          backgroundSize: '600px',
        }}
      >
        <div className="w-full max-w-md bg-white/95 rounded-3xl shadow-2xl border border-emerald-200 p-7">
          <p className="text-sm font-bold text-emerald-700 mb-2 text-center uppercase tracking-widest">
            Comunidade hiperlocal
          </p>

          <h1 className="text-4xl font-extrabold text-emerald-950 text-center">
            Chapadão Conecta
          </h1>

          <p className="text-slate-600 mt-3 mb-6 text-center">
            Informação que aproxima. Comunidade que protege.
          </p>

          <input
            type="text"
            inputMode="email"
            autoComplete="email"
            placeholder="Digite seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClasse}
          />

          <input
            type="text"
            placeholder="Digite seu CEP"
            value={cep}
            onChange={(e) => setCep(e.target.value)}
            className={inputClasse}
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

                const alertasCarregados = await carregarAlertas()
                await carregarPessoas()

                if (alertasCarregados.length > 0) {
                  tocarAlarme()
                }

                setLogado(true)
              } else {
                alert('Sua região ainda não está disponível na plataforma.')
              }
            }}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl p-4 font-bold shadow-lg transition"
          >
            Entrar na comunidade
          </button>

          <p className="text-xs text-slate-500 text-center mt-5">
            Acesso disponível para moradores do Complexo do Chapadão e entorno.
          </p>
        </div>
      </section>
    </main>
  )
}
