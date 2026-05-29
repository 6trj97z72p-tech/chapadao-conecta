'use client'

import { useState, useEffect } from 'react'
import { supabase } from './supabase'

export default function Home() {
  const [email, setEmail] = useState('')
  const [cep, setCep] = useState('')
  const [bairro, setBairro] = useState('')
  const [logado, setLogado] = useState(false)
  const [bannerIndex, setBannerIndex] = useState(0)
  const [tela, setTela] = useState('home')

  const [tipoAlerta, setTipoAlerta] = useState('')
  const [localDescricao, setLocalDescricao] = useState('')
  const [descricao, setDescricao] = useState('')
  const [alertas, setAlertas] = useState<any[]>([])
  const [temAlertaLocal, setTemAlertaLocal] = useState(false)

  const [nomePessoa, setNomePessoa] = useState('')
  const [idadePessoa, setIdadePessoa] = useState('')
  const [dataDesaparecimento, setDataDesaparecimento] = useState('')
  const [localDesaparecimento, setLocalDesaparecimento] = useState('')
  const [telefoneContato, setTelefoneContato] = useState('')
  const [descricaoPessoa, setDescricaoPessoa] = useState('')
  const [fotoPessoa, setFotoPessoa] = useState<File | null>(null)
  const [pessoas, setPessoas] = useState<any[]>([])

  const [nomePet, setNomePet] = useState('')
  const [tipoPet, setTipoPet] = useState('')
  const [corPet, setCorPet] = useState('')
  const [dataPet, setDataPet] = useState('')
  const [localPet, setLocalPet] = useState('')
  const [telefonePet, setTelefonePet] = useState('')
  const [descricaoPet, setDescricaoPet] = useState('')
  const [fotoPet, setFotoPet] = useState<File | null>(null)
  const [pets, setPets] = useState<any[]>([])

  const [tipoEmergencia, setTipoEmergencia] = useState('')
  const [localEmergencia, setLocalEmergencia] = useState('')
  const [descricaoEmergencia, setDescricaoEmergencia] = useState('')
  const [fotoEmergencia, setFotoEmergencia] = useState<File | null>(null)
  const [riscos, setRiscos] = useState<any[]>([])

  const inputClasse =
    'w-full border border-emerald-200 rounded-2xl p-4 mb-4 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600'

  const labelClasse = 'block text-sm font-bold text-emerald-950 mb-2'

  const cardClasse =
    'bg-white/95 rounded-3xl shadow-xl border border-emerald-200 p-6'

  const paginaClasse =
  'min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 p-6'

useEffect(() => {
  const interval = setInterval(() => {
    setBannerIndex((prev) => (prev + 1) % 2)
  }, 5000)

  return () => clearInterval(interval)
}, [])
  
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

  async function carregarAlertas(bairroFiltro = '') {
    let query = supabase
      .from('alertas')
      .select('*')
      .gte('created_at', limite24h())
      .order('created_at', { ascending: true })

    if (bairroFiltro) {
      query = query.eq('bairro', bairroFiltro)
    }

    const { data } = await query

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

  async function carregarPets() {
    const { data } = await supabase
      .from('pets_desaparecidos')
      .select('*')
      .order('created_at', { ascending: false })

    setPets(data || [])
    return data || []
  }

  async function carregarRiscos() {
  const agora = new Date().toISOString()

  const { data } = await supabase
    .from('riscos_emergencias')
    .select('*')
    .or(`expira_em.is.null,expira_em.gt.${agora}`)
    .order('created_at', { ascending: false })

  setRiscos(data || [])
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

    const alertasLocais = await carregarAlertas(bairro)
    setTemAlertaLocal(alertasLocais.length > 0)
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

  async function publicarPet() {
    if (
      !nomePet ||
      !tipoPet ||
      !corPet ||
      !dataPet ||
      !localPet ||
      !telefonePet ||
      !descricaoPet ||
      !fotoPet
    ) {
      alert('Preencha todos os campos do pet desaparecido.')
      return
    }

    const nomeArquivo = `${Date.now()}-${fotoPet.name.replaceAll(' ', '_')}`

    const upload = await supabase.storage
      .from('pets-desaparecidos')
      .upload(nomeArquivo, fotoPet)

    if (upload.error) {
      alert('Erro ao enviar a foto do pet.')
      return
    }

    const { data } = supabase.storage
      .from('pets-desaparecidos')
      .getPublicUrl(nomeArquivo)

    await supabase.from('pets_desaparecidos').insert([
      {
        email,
        bairro,
        nome_pet: nomePet,
        tipo_pet: tipoPet,
        cor: corPet,
        foto_url: data.publicUrl,
        data_desaparecimento: dataPet,
        local_desaparecimento: localPet,
        descricao: descricaoPet,
        telefone_contato: telefonePet,
        status: 'DESAPARECIDO',
      },
    ])

    alert('Pet desaparecido cadastrado.')

    setNomePet('')
    setTipoPet('')
    setCorPet('')
    setDataPet('')
    setLocalPet('')
    setTelefonePet('')
    setDescricaoPet('')
    setFotoPet(null)

    await carregarPets()
  }

  async function publicarRisco() {
    if (
      !tipoEmergencia ||
      !localEmergencia ||
      !descricaoEmergencia ||
      !fotoEmergencia
    ) {
      alert('Preencha todos os campos do risco ou emergência.')
      return
    }

    const nomeArquivo = `${Date.now()}-${fotoEmergencia.name.replaceAll(' ', '_')}`

    const upload = await supabase.storage
      .from('riscos-emergencias')
      .upload(nomeArquivo, fotoEmergencia)

    if (upload.error) {
      alert('Erro ao enviar a foto da emergência.')
      return
    }

    const { data } = supabase.storage
      .from('riscos-emergencias')
      .getPublicUrl(nomeArquivo)

    await supabase.from('riscos_emergencias').insert([
      {
        email,
        bairro,
        tipo_emergencia: tipoEmergencia,
        local_descricao: localEmergencia,
        descricao: descricaoEmergencia,
        foto_url: data.publicUrl,
        status: 'ATIVO',
        origem: 'COMUNIDADE',
        fonte: 'Morador',
        nivel: 'ATENCAO',
      },
    ])

    alert('Risco ou emergência registrado.')

    setTipoEmergencia('')
    setLocalEmergencia('')
    setDescricaoEmergencia('')
    setFotoEmergencia(null)

    await carregarRiscos()
  }

  if (logado && tela === 'alertas') {
    return (
      <main className={paginaClasse}>
        <button onClick={() => setTela('home')} className="mb-6 text-emerald-100 font-bold">
          ← Voltar
        </button>

        <h1 className="text-3xl font-extrabold text-white">🚨 Alertas de segurança</h1>

        <p className="text-emerald-100/80 mt-2 mb-6">
          Crie alertas e acompanhe validações da comunidade.
        </p>

        <div className={`${cardClasse} mb-8`}>
          <label className={labelClasse}>Bairro</label>
          <input value={bairro} disabled className={`${inputClasse} bg-emerald-50`} />

          <label className={labelClasse}>Tipo de alerta</label>
          <select value={tipoAlerta} onChange={(e) => setTipoAlerta(e.target.value)} className={inputClasse}>
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

          <button onClick={publicarAlerta} className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl p-4 font-bold shadow-lg transition">
            Enviar alerta
          </button>
        </div>

        <div className="grid gap-6">
  {alertas.length === 0 && (
    <p className="text-emerald-100 text-center">
      Ainda não há alertas cadastrados nas últimas 24 horas.
    </p>
  )}

  {alertas.map((alerta) => (
    <div
      key={alerta.id}
      className="max-w-md mx-auto bg-white/95 rounded-3xl shadow-xl border border-red-100 overflow-hidden"
    >
      <div className="p-5">
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
                <button onClick={() => votarVerdade(alerta)} className="font-bold text-emerald-700">
                  👍 Verdade {alerta.verdade}
                </button>

                <button onClick={() => votarBoato(alerta)} className="font-bold text-red-700">
                  👎 Boato {alerta.boato}
                </button>
                            </div>
      </div>
    </div>
  ))}
</div>
      </main>
    )
  }

  if (logado && tela === 'riscos') {
    return (
      <main className={paginaClasse}>
        <button onClick={() => setTela('home')} className="mb-6 text-emerald-100 font-bold">
          ← Voltar
        </button>

        <h1 className="text-3xl font-extrabold text-white">☎️ Riscos e emergências</h1>

        <p className="text-emerald-100/80 mt-2 mb-6">
          Cadastre e visualize riscos, emergências e alertas oficiais.
        </p>

        <div className={`${cardClasse} mb-8`}>
          <label className={labelClasse}>Foto da ocorrência</label>
          <input type="file" accept="image/*" onChange={(e) => setFotoEmergencia(e.target.files?.[0] || null)} className={inputClasse} />

          <label className={labelClasse}>Tipo de emergência</label>
          <select value={tipoEmergencia} onChange={(e) => setTipoEmergencia(e.target.value)} className={inputClasse}>
            <option value="">Selecione uma opção</option>
            <option value="Alagamento">Alagamento</option>
            <option value="Deslizamento">Deslizamento</option>
            <option value="Incêndio">Incêndio</option>
            <option value="Falta de energia">Falta de energia</option>
            <option value="Via bloqueada">Via bloqueada</option>
            <option value="Queda de árvore">Queda de árvore</option>
            <option value="Risco estrutural">Risco estrutural</option>
            <option value="Alerta de Tempestade">Alerta de Tempestade</option>
          </select>

          <label className={labelClasse}>Descrição do local</label>
          <input
            type="text"
            placeholder="Ex: Rua, praça, ponto de referência"
            value={localEmergencia}
            onChange={(e) => setLocalEmergencia(e.target.value)}
            className={inputClasse}
          />

          <label className={labelClasse}>Descrição da situação</label>
          <textarea
            placeholder="Descreva brevemente o risco ou emergência"
            value={descricaoEmergencia}
            onChange={(e) => setDescricaoEmergencia(e.target.value)}
            className={`${inputClasse} min-h-32`}
          />

          <button onClick={publicarRisco} className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl p-4 font-bold shadow-lg transition">
            Registrar risco ou emergência
          </button>
        </div>

        <div className="space-y-6">
          {riscos.length === 0 && (
            <p className="text-emerald-100 text-center">
              Ainda não há riscos ou emergências cadastrados.
            </p>
          )}

          {riscos.map((risco) => (
            <div key={risco.id} className="max-w-md mx-auto bg-white/95 rounded-3xl shadow-xl border border-amber-200 overflow-hidden">
              {risco.foto_url && (
                <img src={risco.foto_url} alt={risco.tipo_emergencia} className="w-full h-80 object-cover" />
              )}

              <div className="p-5">
                <h2 className="text-2xl font-bold text-amber-700">
                  ⚠️ {risco.tipo_emergencia} — {risco.bairro}
                </h2>

                <p className="text-sm text-slate-500 mt-3">
                  🕒 Criado em {formatarData(risco.created_at)}
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  📍 {risco.local_descricao}
                </p>

                <p className="text-slate-700 mt-4">{risco.descricao}</p>

                <div className="flex flex-wrap gap-2 mt-4">
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                    risco.origem === 'OFICIAL'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {risco.origem === 'OFICIAL' ? '🏛️ OFICIAL' : '👥 COMUNIDADE'}
                  </span>

                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                    risco.nivel === 'CRITICO'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {risco.nivel === 'CRITICO' ? '🔴 CRÍTICO' : '🟡 ATENÇÃO'}
                  </span>

                  <span className="inline-block bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm font-bold">
                    {risco.status || 'ATIVO'}
                  </span>
                </div>

                <p className="text-sm text-slate-500 mt-3">
                  Fonte: {risco.fonte || 'Morador'}
                </p>
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
        <button onClick={() => setTela('home')} className="mb-6 text-emerald-100 font-bold">
          ← Voltar
        </button>

        <h1 className="text-3xl font-extrabold text-white">👤 Pessoas desaparecidas</h1>

        <p className="text-emerald-100/80 mt-2 mb-6">
          Cadastre e visualize pessoas desaparecidas na comunidade.
        </p>

        <div className={`${cardClasse} mb-8`}>
          <label className={labelClasse}>Foto</label>
          <input type="file" accept="image/*" onChange={(e) => setFotoPessoa(e.target.files?.[0] || null)} className={inputClasse} />

          <label className={labelClasse}>Nome</label>
          <input type="text" value={nomePessoa} onChange={(e) => setNomePessoa(e.target.value)} className={inputClasse} />

          <label className={labelClasse}>Idade</label>
          <input type="number" value={idadePessoa} onChange={(e) => setIdadePessoa(e.target.value)} className={inputClasse} />

          <label className={labelClasse}>Data do desaparecimento</label>
          <input type="date" value={dataDesaparecimento} onChange={(e) => setDataDesaparecimento(e.target.value)} className={inputClasse} />

          <label className={labelClasse}>Último local visto</label>
          <input type="text" value={localDesaparecimento} onChange={(e) => setLocalDesaparecimento(e.target.value)} className={inputClasse} />

          <label className={labelClasse}>Telefone para contato</label>
          <input type="text" value={telefoneContato} onChange={(e) => setTelefoneContato(e.target.value)} className={inputClasse} />

          <label className={labelClasse}>Descrição</label>
          <textarea value={descricaoPessoa} onChange={(e) => setDescricaoPessoa(e.target.value)} className={`${inputClasse} min-h-32`} />

          <button onClick={publicarPessoa} className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl p-4 font-bold shadow-lg transition">
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
            <div key={pessoa.id} className="max-w-md mx-auto bg-white/95 rounded-3xl shadow-xl border border-emerald-200 overflow-hidden">
              {pessoa.foto_url && (
                <img src={pessoa.foto_url} alt={pessoa.nome} className="w-full h-80 object-cover" />
              )}

              <div className="p-5">
                <h2 className="text-2xl font-bold text-slate-900">{pessoa.nome}</h2>
                <p className="text-slate-600 mt-1">{pessoa.idade} anos</p>

                <p className="text-sm text-slate-500 mt-3">
                  🕒 Data do desaparecimento:{' '}
                  {new Date(pessoa.data_desaparecimento).toLocaleDateString('pt-BR')}
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  📍 Último local visto: {pessoa.local_desaparecimento}
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  📞 Contato: {pessoa.telefone_contato}
                </p>

                <p className="text-slate-700 mt-4">{pessoa.descricao}</p>

                <p className={`mt-4 inline-block px-4 py-2 rounded-full text-sm font-bold ${
                  pessoa.status === 'LOCALIZADA'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {pessoa.status === 'LOCALIZADA' ? '🟢 LOCALIZADO' : '🔴 DESAPARECIDO'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    )
  }

  if (logado && tela === 'pets') {
    return (
      <main className={paginaClasse}>
        <button onClick={() => setTela('home')} className="mb-6 text-emerald-100 font-bold">
          ← Voltar
        </button>

        <h1 className="text-3xl font-extrabold text-white">🐾 Pets desaparecidos</h1>

        <p className="text-emerald-100/80 mt-2 mb-6">
          Cadastre e visualize pets desaparecidos na comunidade.
        </p>

        <div className={`${cardClasse} mb-8`}>
          <label className={labelClasse}>Foto do pet</label>
          <input type="file" accept="image/*" onChange={(e) => setFotoPet(e.target.files?.[0] || null)} className={inputClasse} />

          <label className={labelClasse}>Nome do pet</label>
          <input type="text" value={nomePet} onChange={(e) => setNomePet(e.target.value)} className={inputClasse} />

          <label className={labelClasse}>Tipo do pet</label>
          <select value={tipoPet} onChange={(e) => setTipoPet(e.target.value)} className={inputClasse}>
            <option value="">Selecione</option>
            <option value="Cachorro">Cachorro</option>
            <option value="Gato">Gato</option>
            <option value="Pássaro">Pássaro</option>
            <option value="Outro">Outro</option>
          </select>

          <label className={labelClasse}>Cor</label>
          <input type="text" value={corPet} onChange={(e) => setCorPet(e.target.value)} className={inputClasse} />

          <label className={labelClasse}>Data do desaparecimento</label>
          <input type="date" value={dataPet} onChange={(e) => setDataPet(e.target.value)} className={inputClasse} />

          <label className={labelClasse}>Último local visto</label>
          <input type="text" value={localPet} onChange={(e) => setLocalPet(e.target.value)} className={inputClasse} />

          <label className={labelClasse}>Telefone para contato</label>
          <input type="text" value={telefonePet} onChange={(e) => setTelefonePet(e.target.value)} className={inputClasse} />

          <label className={labelClasse}>Descrição</label>
          <textarea value={descricaoPet} onChange={(e) => setDescricaoPet(e.target.value)} className={`${inputClasse} min-h-32`} />

          <button onClick={publicarPet} className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl p-4 font-bold shadow-lg transition">
            Cadastrar pet desaparecido
          </button>
        </div>

        <div className="space-y-6">
          {pets.length === 0 && (
            <p className="text-emerald-100 text-center">
              Ainda não há pets desaparecidos cadastrados.
            </p>
          )}

          {pets.map((pet) => (
            <div key={pet.id} className="max-w-md mx-auto bg-white/95 rounded-3xl shadow-xl border border-emerald-200 overflow-hidden">
              {pet.foto_url && (
                <img src={pet.foto_url} alt={pet.nome_pet} className="w-full h-80 object-cover" />
              )}

              <div className="p-5">
                <h2 className="text-2xl font-bold text-slate-900">🐾 {pet.nome_pet}</h2>
                <p className="text-slate-600 mt-1">{pet.tipo_pet} • {pet.cor}</p>

                <p className="text-sm text-slate-500 mt-3">
                  🕒 Desaparecido desde:{' '}
                  {new Date(pet.data_desaparecimento).toLocaleDateString('pt-BR')}
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  📍 Último local visto: {pet.local_desaparecimento}
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  📞 Contato: {pet.telefone_contato}
                </p>

                <p className="text-slate-700 mt-4">{pet.descricao}</p>

                <p className={`mt-4 inline-block px-4 py-2 rounded-full text-sm font-bold ${
                  pet.status === 'ENCONTRADO'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {pet.status === 'ENCONTRADO' ? '🟢 ENCONTRADO' : '🟠 DESAPARECIDO'}
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
              Comunidade Local
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
              ['🚨', 'Alertas de segurança', 'Clique aqui para ver alertas ativos na sua região.'],
              ['☎️', 'Riscos e emergências', 'Informações sobre riscos e situações de emergência.'],
              ['👤', 'Pessoas desaparecidas', 'Compartilhe informações que podem ajudar.'],
              ['🐾', 'Pets desaparecidos', 'Ajude a encontrar animais perdidos na comunidade.'],
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

                  if (title === 'Riscos e emergências') {
                    carregarRiscos()
                    setTela('riscos')
                  }

                  if (title === 'Pessoas desaparecidas') {
                    carregarPessoas()
                    setTela('pessoas')
                  }

                  if (title === 'Pets desaparecidos') {
                    carregarPets()
                    setTela('pets')
                  }
                }}
                className={`rounded-3xl p-6 shadow-xl border cursor-pointer hover:scale-[1.02] hover:shadow-2xl transition ${
                  title === 'Alertas de segurança' && temAlertaLocal
                    ? 'bg-red-100 border-red-500 animate-pulse'
                    : title === 'Riscos e emergências' && riscos.length > 0
                    ? 'bg-yellow-100 border-yellow-500 animate-pulse'
                    : 'bg-white/95 border-emerald-200'
                }`}
              >
                <div className="text-5xl mb-4">{icon}</div>

                <h3 className={`text-2xl font-bold ${
                  title === 'Alertas de segurança' && temAlertaLocal
                    ? 'text-red-700'
                    : title === 'Riscos e emergências' && riscos.length > 0
                    ? 'text-yellow-700'
                    : 'text-emerald-950'
                }`}>
                  {title}
                </h3>

                <p className="text-slate-600 mt-2">{text}</p>

                {title === 'Alertas de segurança' && temAlertaLocal && (
                  <p className="mt-4 text-red-700 font-bold">
                    🚨 Existem alertas ativos na sua região. Clique para visualizar.
                  </p>
                )}

                {title === 'Riscos e emergências' && riscos.length > 0 && (
                  <p className="mt-4 text-yellow-700 font-bold">
                    ⚠️ Existem riscos ou emergências ativos. Clique para visualizar.
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 bg-emerald-100/95 border border-emerald-300 rounded-3xl p-5 text-emerald-900 font-medium shadow">
            📍 Região verificada — você está conectado à comunidade do Complexo do Chapadão e entorno.
          </div>

          <div
  className="rounded-3xl p-6 mt-8 mb-6 shadow-xl text-white"
  style={{
    background:
      'linear-gradient(90deg, #0b2c69 0%, #1847a5 50%, #0b2c69 100%)',
  }}
>
  {bannerIndex === 0 ? (
  <div className="flex flex-col items-center text-center gap-4">
    <img
      src="/images/logo uninter.png"
      alt="UNINTER"
      className="h-20 object-contain"
    />

    <h2 className="text-xl md:text-3xl font-bold">
      Centro Universitário Internacional.
    </h2>
  </div>
) : (
  <div className="flex flex-col items-center text-center gap-4">
    <img
      src="/images/logo uninter.png"
      alt="UNINTER"
      className="h-20 object-contain"
    />

    <h2 className="text-xl md:text-3xl font-bold max-w-3xl">
      A melhor educação a distância do Brasil agora também em diversos países.
    </h2>
  </div>
)}
</div>
          <div className="mt-6 text-center text-xs text-emerald-100/70">
            Atividade Extensionista II - Tecnologia aplicada à Inclusão Digital - Projeto - Prof.º MARIANE GAVIOLI BERGAMINI
            
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
          backgroundImage: "url('/images/fundo5.png')",
          backgroundSize: '1400px',
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

                const alertasCarregados = await carregarAlertas(data.bairro)
                setTemAlertaLocal(alertasCarregados.length > 0)

                await carregarPessoas()
                await carregarPets()
                await carregarRiscos()

                if (alertasCarregados.length > 0) {
                  tocarAlarme()
                }

                setLogado(true)
              } else {
                alert('APENAS DISPONIVEL PARA A REGIAO DO CHAPADAO.')
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
